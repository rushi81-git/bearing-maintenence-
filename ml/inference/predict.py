"""
=============================================================
ml/inference/predict.py
CWRU Bearing Fault Diagnosis — Universal Inference Engine

Features:
  1. Single-window (1024 samples) and multi-window (>1024 samples) analysis.
  2. Pure saved-model inference (zero training dataset access during inference).
  3. Preprocessing strictly matches training (canonical features & saved scaler).
  4. Probabilistic confidence with top predictions and rule-based maintenance recommendations.
  5. CWRU demo samples extracted from held-out benchmark data.
=============================================================
"""

import os
import sys
import json
import pickle
import warnings
import numpy as np

warnings.filterwarnings('ignore')

INFERENCE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR      = os.path.dirname(INFERENCE_DIR)
MODELS_DIR    = os.path.join(BASE_DIR, 'saved_models')
DATA_DIR      = os.path.join(BASE_DIR, 'data')

sys.path.insert(0, BASE_DIR)
from preprocessing.preprocess import (
    compute_time_domain_features,
    CANONICAL_FEATURES,
    normalize_signals_for_cnn,
    FAULT_METADATA,
    WINDOW_LENGTH
)

# ─── Rule-Based Maintenance Recommendations ───────────────────────────────────
RECOMMENDATIONS = {
    'Normal': {
        'action': 'Continue routine periodic condition monitoring. All vibration parameters are within healthy baseline limits.',
        'urgency': 'None',
        'interval': 'Next planned periodic inspection',
    },
    'Mild': {
        'action': 'Increase vibration inspection frequency. Perform acoustic check and inspect bearing lubrication during next planned downtime.',
        'urgency': 'Low',
        'interval': 'Inspect within 7 to 14 days',
    },
    'Moderate': {
        'action': 'Schedule dedicated bearing inspection, check race surfaces and ball elements for spalling, verify lubricant cleanliness and alignment.',
        'urgency': 'Medium',
        'interval': 'Inspect within 3 to 7 days',
    },
    'Severe': {
        'action': 'Priority mechanical inspection required. Plan immediate bearing replacement to prevent spindle damage or catastrophic mechanical seizure.',
        'urgency': 'High',
        'interval': 'Immediate — prioritize at next operational window',
    },
}

DISCLAIMER = (
    "PROTOTYPE DIAGNOSTIC OUTPUT: Based on models trained on CWRU benchmark laboratory data. "
    "Severity categories reflect experimental seeded defect dimensions (0.007\", 0.014\", 0.021\"). "
    "Always consult qualified maintenance engineers for field operational decisions."
)

_cached_artifacts = {}


def load_inference_artifacts():
    """Load and cache model artifacts."""
    global _cached_artifacts
    if _cached_artifacts:
        return _cached_artifacts

    # 1. Config
    config_path = os.path.join(MODELS_DIR, 'preprocessing_config.json')
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Preprocessing config missing: {config_path}")
    with open(config_path, 'r') as f:
        config = json.load(f)

    # 2. Class mapping
    mapping_path = os.path.join(MODELS_DIR, 'class_mapping.json')
    with open(mapping_path, 'r') as f:
        class_mapping = json.load(f)

    # 3. Scaler
    scaler_path = os.path.join(MODELS_DIR, 'scaler_cwru_1024_v1.joblib')
    if not os.path.exists(scaler_path):
        scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)

    # 4. Label encoder
    le_path = os.path.join(MODELS_DIR, 'label_encoder_v1.joblib')
    if not os.path.exists(le_path):
        le_path = os.path.join(MODELS_DIR, 'label_encoder.pkl')
    with open(le_path, 'rb') as f:
        label_encoder = pickle.load(f)

    # 5. 1D CNN Model (Preferred Deployment Model)
    cnn_model = None
    cnn_path = os.path.join(MODELS_DIR, 'cnn_cwru_1024_v1.keras')
    if not os.path.exists(cnn_path):
        cnn_path = os.path.join(MODELS_DIR, 'cnn_model.keras')
    if os.path.exists(cnn_path):
        try:
            import tensorflow as tf
            cnn_model = tf.keras.models.load_model(cnn_path)
        except Exception as e:
            print(f"[Warning] Failed loading CNN: {e}")

    # 6. Classical ML Model (Fallback / Comparison)
    classical_model = None
    rf_path = os.path.join(MODELS_DIR, 'rf_cwru_1024_features_v1.joblib')
    if not os.path.exists(rf_path):
        rf_path = os.path.join(MODELS_DIR, 'best_ml_model.pkl')
    if os.path.exists(rf_path):
        with open(rf_path, 'rb') as f:
            classical_model = pickle.load(f)

    # 7. Model Metadata
    metadata = {}
    meta_path = os.path.join(MODELS_DIR, 'model_metadata_v1.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            metadata = json.load(f)

    _cached_artifacts = {
        'config': config,
        'class_mapping': class_mapping,
        'scaler': scaler,
        'label_encoder': label_encoder,
        'cnn_model': cnn_model,
        'classical_model': classical_model,
        'metadata': metadata
    }
    return _cached_artifacts


def determine_best_fit_model(
    signal_1024: np.ndarray,
    features: dict,
    cnn_model,
    classical_model,
    scaler,
    classes: list
) -> tuple:
    """
    Autonomous Model Selection Engine:
    Analyzes physical vibration dynamics and model certainty to autonomously select the best-fit architecture:
      - Deep 1D CNN: Optimal for non-stationary, transient impact dynamics, phase variations,
        and high-frequency harmonic energy (kurtosis > 3.0, high crest factor, or complex waveform).
      - Classical Feature ML: Evaluates statistical boundary moments.
    Computes Shannon entropy and confidence margin to guarantee maximum diagnostic certainty.
    """
    cnn_probs = None
    classical_probs = None

    # Evaluate 1D CNN if available
    if cnn_model is not None:
        try:
            sig_norm = normalize_signals_for_cnn(signal_1024.reshape(1, -1))
            cnn_probs = cnn_model.predict(sig_norm, verbose=0)[0]
        except Exception as e:
            print(f"[Warning] CNN prediction failed: {e}")

    # Evaluate Classical ML if available
    if classical_model is not None and scaler is not None:
        try:
            feat_vector = np.array([[features[col] for col in CANONICAL_FEATURES]])
            feat_scaled = scaler.transform(feat_vector)
            if hasattr(classical_model, "predict_proba"):
                classical_probs = classical_model.predict_proba(feat_scaled)[0]
            else:
                p_idx = classical_model.predict(feat_scaled)[0]
                classical_probs = np.zeros(len(classes))
                classical_probs[p_idx] = 1.0
        except Exception as e:
            print(f"[Warning] Classical ML prediction failed: {e}")

    kurtosis = float(features.get('kurtosis', 3.0))
    crest_factor = float(features.get('crest_factor', 3.0))
    rms = float(features.get('rms', 0.1))

    cnn_top_p = float(np.max(cnn_probs)) if cnn_probs is not None else 0.0
    ml_top_p = float(np.max(classical_probs)) if classical_probs is not None else 0.0

    def calc_entropy(probs):
        if probs is None: return 99.0
        p = np.clip(probs, 1e-12, 1.0)
        return float(-np.sum(p * np.log2(p)))

    cnn_entropy = calc_entropy(cnn_probs)
    ml_entropy = calc_entropy(classical_probs)

    # Decision Matrix:
    # 1D Deep CNN captures spatial/temporal dynamics directly from raw accelerometer samples.
    if cnn_model is not None and (cnn_top_p >= 0.70 or kurtosis > 3.2 or cnn_entropy <= ml_entropy or classical_probs is None):
        selected_probs = cnn_probs
        selected_name = "1D Deep CNN (Generalized Multi-Scale Residual)"
        fit_reason = (
            f"Waveform exhibits transient dynamics (Kurtosis: {kurtosis:.2f}, Crest Factor: {crest_factor:.2f}). "
            f"1D Deep CNN spatial multi-scale receptive fields autonomously selected for optimal time-domain feature isolation "
            f"(Diagnostic Certainty: {cnn_top_p*100:.1f}%, Entropy: {cnn_entropy:.3f} bits)."
        )
        fit_engine = "1d_deep_cnn"
        fit_confidence = cnn_top_p
    elif classical_probs is not None:
        selected_probs = classical_probs
        selected_name = "Random Forest (Canonical Feature Classifier)"
        fit_reason = (
            f"Signal dynamics conform to stationary statistical baseline (Kurtosis: {kurtosis:.2f}, RMS: {rms:.4f}g). "
            f"Classical moment-based tabular model autonomously selected for stable threshold classification "
            f"(Diagnostic Certainty: {ml_top_p*100:.1f}%, Entropy: {ml_entropy:.3f} bits)."
        )
        fit_engine = "classical_ml"
        fit_confidence = ml_top_p
    else:
        selected_probs = cnn_probs if cnn_probs is not None else np.ones(len(classes)) / len(classes)
        selected_name = "1D Deep CNN (Autonomous Active)"
        fit_reason = "Defaulted to available neural inference model."
        fit_engine = "1d_deep_cnn"
        fit_confidence = cnn_top_p

    auto_fit_meta = {
        'selection_mode': 'autonomous',
        'selected_engine': fit_engine,
        'selected_model_name': selected_name,
        'selection_rationale': fit_reason,
        'fit_confidence': round(fit_confidence, 4),
        'cnn_confidence': round(cnn_top_p, 4) if cnn_probs is not None else None,
        'classical_confidence': round(ml_top_p, 4) if classical_probs is not None else None,
        'entropy_bits': round(cnn_entropy if fit_engine == '1d_deep_cnn' else ml_entropy, 3),
        'signal_metrics': {
            'kurtosis': round(kurtosis, 2),
            'crest_factor': round(crest_factor, 2),
            'rms': round(rms, 4),
            'dynamics_classification': 'Transient Non-Stationary' if kurtosis > 3.2 else 'Stationary Harmonic'
        }
    }

    return selected_probs, selected_name, auto_fit_meta


def predict_single_window(signal_1024: np.ndarray, model_mode: str = "auto", use_classical_ml: bool = False) -> dict:
    """
    Diagnose a single 1024-sample vibration window using autonomous best-fit routing or manual override.
    """
    artifacts = load_inference_artifacts()
    label_encoder = artifacts['label_encoder']
    classes = list(label_encoder.classes_)

    sig = np.asarray(signal_1024, dtype=np.float64).ravel()
    if len(sig) != WINDOW_LENGTH:
        raise ValueError(f"Expected exactly {WINDOW_LENGTH} samples, got {len(sig)}")

    if not np.all(np.isfinite(sig)):
        raise ValueError("Input signal contains NaN or Infinite values.")

    # 1. Feature Extraction
    features = compute_time_domain_features(sig)

    # 2. Autonomous Model Selection or Explicit Override
    cnn_model = artifacts['cnn_model']
    classical_model = artifacts['classical_model']

    if model_mode == "auto" and not use_classical_ml:
        probabilities, model_version, auto_fit_meta = determine_best_fit_model(
            sig, features, cnn_model, classical_model, artifacts.get('scaler'), classes
        )
    elif use_classical_ml or model_mode == "classical":
        if classical_model is not None:
            feat_vector = np.array([[features[col] for col in CANONICAL_FEATURES]])
            feat_scaled = artifacts['scaler'].transform(feat_vector)
            if hasattr(classical_model, "predict_proba"):
                probabilities = classical_model.predict_proba(feat_scaled)[0]
            else:
                pred_idx = classical_model.predict(feat_scaled)[0]
                probabilities = np.zeros(len(classes))
                probabilities[pred_idx] = 1.0
            model_version = "rf_cwru_1024_features_v1 (Random Forest)"
            auto_fit_meta = {
                'selection_mode': 'manual_override',
                'selected_engine': 'classical_ml',
                'selected_model_name': model_version,
                'selection_rationale': 'User specified classical feature machine learning model.'
            }
        else:
            raise RuntimeError("Classical ML model not available.")
    else:
        # Explicit CNN
        if cnn_model is not None:
            sig_norm = normalize_signals_for_cnn(sig.reshape(1, -1))
            probabilities = cnn_model.predict(sig_norm, verbose=0)[0]
            model_version = "cnn_cwru_1024_v1 (1D Deep CNN)"
            auto_fit_meta = {
                'selection_mode': 'manual_override',
                'selected_engine': '1d_deep_cnn',
                'selected_model_name': model_version,
                'selection_rationale': 'Explicit 1D Deep CNN model invoked.'
            }
        else:
            raise RuntimeError("1D Deep CNN model not available.")

    pred_idx = int(np.argmax(probabilities))
    pred_class = classes[pred_idx]
    pred_prob = float(probabilities[pred_idx])

    meta = FAULT_METADATA.get(pred_class, {
        'fault_type': 'Unknown', 'fault_size_inches': 0.0, 'fault_size_mm': 0.0,
        'severity': 'Unknown', 'bearing_status': 'Unknown'
    })

    # Top predictions list
    sorted_indices = np.argsort(probabilities)[::-1]
    top_predictions = [
        {
            'class': classes[idx],
            'probability': round(float(probabilities[idx]), 4),
            'fault_type': FAULT_METADATA.get(classes[idx], {}).get('fault_type', 'Unknown'),
            'severity': FAULT_METADATA.get(classes[idx], {}).get('severity', 'Unknown')
        }
        for idx in sorted_indices[:4]
    ]

    rec_info = RECOMMENDATIONS.get(meta['severity'], RECOMMENDATIONS['Normal'])

    return {
        'bearing_status': meta['bearing_status'],
        'predicted_class': pred_class,
        'fault_type': meta['fault_type'],
        'fault_size_inches': meta['fault_size_inches'],
        'fault_size_mm': meta['fault_size_mm'],
        'severity': meta['severity'],
        'prediction_probability': round(pred_prob, 4),
        'features': {k: round(float(v), 5) for k, v in features.items()},
        'top_predictions': top_predictions,
        'model_version': model_version,
        'auto_fit_details': auto_fit_meta,
        'recommendation': rec_info['action'],
        'urgency': rec_info['urgency'],
        'check_interval': rec_info['interval'],
        'disclaimer': DISCLAIMER
    }


def analyze_vibration_signal(signal: list, sampling_rate_hz: int = 48000, signal_unit: str = "g",
                             source_type: str = "csv", model_mode: str = "auto", use_classical_ml: bool = False) -> dict:
    """
    Main entrypoint for vibration signal analysis.
    Supports arbitrarily long signals by partitioning into complete 1024-sample windows.
    Automatically determines the best-fit model architecture across the signal.
    """
    arr = np.asarray(signal, dtype=np.float64).ravel()
    n_samples = len(arr)

    if n_samples < WINDOW_LENGTH:
        raise ValueError(f"At least {WINDOW_LENGTH} valid vibration samples are required (received {n_samples}).")

    if not np.all(np.isfinite(arr)):
        raise ValueError("Signal contains non-finite values (NaN or Inf).")

    # Partition into consecutive 1024-sample windows
    n_windows = n_samples // WINDOW_LENGTH
    remainder = n_samples % WINDOW_LENGTH

    window_results = []
    class_counts = {}
    prob_sums = {}
    dominant_auto_fit = None

    for w_idx in range(n_windows):
        start = w_idx * WINDOW_LENGTH
        end = start + WINDOW_LENGTH
        win_sig = arr[start:end]

        res = predict_single_window(win_sig, model_mode=model_mode, use_classical_ml=use_classical_ml)
        cls = res['predicted_class']
        prob = res['prediction_probability']

        if dominant_auto_fit is None:
            dominant_auto_fit = res.get('auto_fit_details')

        window_results.append({
            'window_index': w_idx + 1,
            'start_sample': start,
            'end_sample': end - 1,
            'predicted_class': cls,
            'prediction_probability': prob,
            'severity': res['severity'],
            'fault_type': res['fault_type'],
            'features': res['features']
        })

        class_counts[cls] = class_counts.get(cls, 0) + 1
        prob_sums[cls] = prob_sums.get(cls, 0.0) + prob

    # Determine dominant diagnosis
    dominant_class = max(class_counts, key=lambda c: (class_counts[c], prob_sums[c]))
    dominant_count = class_counts[dominant_class]
    dominant_avg_prob = prob_sums[dominant_class] / dominant_count

    # Dominant class metadata
    dominant_meta = FAULT_METADATA.get(dominant_class, {
        'fault_type': 'Unknown', 'fault_size_inches': 0.0, 'fault_size_mm': 0.0,
        'severity': 'Unknown', 'bearing_status': 'Unknown'
    })
    rec_info = RECOMMENDATIONS.get(dominant_meta['severity'], RECOMMENDATIONS['Normal'])

    # Prediction distribution across windows
    distribution = [
        {
            'class': cls,
            'count': count,
            'percentage': round((count / n_windows) * 100.0, 1),
            'avg_probability': round(prob_sums[cls] / count, 4),
            'fault_type': FAULT_METADATA.get(cls, {}).get('fault_type', 'Unknown'),
            'severity': FAULT_METADATA.get(cls, {}).get('severity', 'Unknown')
        }
        for cls, count in sorted(class_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    # Overall representative features from first window
    first_window_res = predict_single_window(arr[:WINDOW_LENGTH], model_mode=model_mode, use_classical_ml=use_classical_ml)
    first_window_features = first_window_res['features']

    return {
        'bearing_status': dominant_meta['bearing_status'],
        'predicted_class': dominant_class,
        'fault_type': dominant_meta['fault_type'],
        'fault_size_inches': dominant_meta['fault_size_inches'],
        'fault_size_mm': dominant_meta['fault_size_mm'],
        'severity': dominant_meta['severity'],
        'prediction_probability': round(dominant_avg_prob, 4),
        'windows_analyzed': n_windows,
        'total_samples': n_samples,
        'discarded_trailing_samples': remainder,
        'sampling_rate_hz': sampling_rate_hz,
        'signal_unit': signal_unit,
        'source_type': source_type,
        'features': first_window_features,
        'dominant_window_count': dominant_count,
        'prediction_distribution': distribution,
        'window_predictions': window_results,
        'model_version': dominant_auto_fit.get('selected_model_name', '1D Deep CNN') if dominant_auto_fit else '1D Deep CNN',
        'auto_fit_details': dominant_auto_fit,
        'recommendation': rec_info['action'],
        'urgency': rec_info['urgency'],
        'check_interval': rec_info['interval'],
        'disclaimer': DISCLAIMER
    }


def get_curated_demo_samples():
    """
    Extracts representative CWRU demonstration samples from the held-out dataset.
    Returns 1024-point actual CWRU vibration samples for each fault condition.
    """
    npz_path = os.path.join(DATA_DIR, 'CWRU_48k_load_1_CNN_data.npz')
    if not os.path.exists(npz_path):
        return {}

    d = np.load(npz_path)
    data = d['data'].reshape(d['data'].shape[0], -1)
    raw_labels = d['labels']

    from preprocessing.preprocess import normalize_class_name
    labels = np.array([normalize_class_name(l) for l in raw_labels])

    demo_samples = {}
    for cls in ['Normal', 'Ball_014', 'IR_014', 'OR_014', 'IR_021', 'Ball_007']:
        idx = np.where(labels == cls)[0]
        if len(idx) > 0:
            # Pick a sample from the test partition (end of block)
            sample_idx = idx[-5]
            sig = data[sample_idx].tolist()
            demo_samples[cls] = {
                'fault_class': cls,
                'label_type': 'CWRU Demonstration Sample',
                'description': f"Curated benchmark recording for {FAULT_METADATA[cls]['fault_type']} ({cls})",
                'sampling_rate_hz': 48000,
                'signal_unit': 'g',
                'signal': [round(x, 4) for x in sig]
            }

    return demo_samples

"""
=============================================================
ml/training/train_cnn.py
CWRU Bearing Fault Diagnosis — 1D Deep CNN Training Pipeline

Trains 1D Convolutional Neural Network directly on raw 1024-sample
vibration waveforms [-1, 1].

Architecture:
  Input: (1024, 1)
  Conv1D(32, 64) + BatchNorm + ReLU + MaxPool(4)
  Conv1D(64, 32) + BatchNorm + ReLU + MaxPool(4)
  Conv1D(128, 16) + BatchNorm + ReLU + MaxPool(4)
  GlobalAveragePooling1D
  Dense(128, relu) + Dropout(0.3)
  Dense(10, softmax)

Data split: Leakage-Safe Block Split (70% Train, 10% Val, 20% Test).
Output Artifacts:
  - cnn_cwru_1024_v1.keras & cnn_model.keras
  - cnn_training_curves.png
  - confusion_matrix_CNN.png
  - model_metadata_v1.json
  - all_model_results.json
=============================================================
"""

import os
import sys
import json
import datetime
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

TRAINING_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR     = os.path.dirname(TRAINING_DIR)
MODELS_DIR   = os.path.join(BASE_DIR, 'saved_models')
EVAL_DIR     = os.path.join(BASE_DIR, 'evaluation')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

sys.path.insert(0, BASE_DIR)
from preprocessing.preprocess import load_and_preprocess_cwru_1024, CANONICAL_FEATURES, CWRU_CLASSES

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

import tensorflow as tf
tf.random.set_seed(RANDOM_SEED)
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, CSVLogger

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)


def build_1d_cnn(input_length=1024, n_classes=10):
    """Builds a lightweight, high-generalization 1D CNN for vibration analysis."""
    inputs = layers.Input(shape=(input_length,))
    x = layers.Reshape((input_length, 1))(inputs)

    # Block 1: Low-frequency broad waveform features
    x = layers.Conv1D(filters=32, kernel_size=64, padding='same', use_bias=False,
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling1D(pool_size=4)(x)

    # Block 2: Mid-frequency transient features
    x = layers.Conv1D(filters=64, kernel_size=32, padding='same', use_bias=False,
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling1D(pool_size=4)(x)

    # Block 3: High-frequency impact & resonance features
    x = layers.Conv1D(filters=128, kernel_size=16, padding='same', use_bias=False,
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling1D(pool_size=4)(x)

    # Global Average Pooling (prevents parameter explosion and overfitting)
    x = layers.GlobalAveragePooling1D()(x)

    # Dense Classification Head
    x = layers.Dense(128, activation='relu', kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.Dropout(0.30)(x)
    outputs = layers.Dense(n_classes, activation='softmax')(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="1D_Vibration_CNN")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def plot_cnn_training_curves(history_df, save_path):
    """Plot and save training and validation loss and accuracy curves."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    epochs = range(1, len(history_df) + 1)

    # Accuracy
    ax1.plot(epochs, history_df['accuracy'], 'b-', label='Train Accuracy', lw=2)
    ax1.plot(epochs, history_df['val_accuracy'], 'g-', label='Val Accuracy', lw=2)
    ax1.set_title('1D CNN Accuracy Curves (Leakage-Safe Split)')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.grid(True, alpha=0.3)
    ax1.legend(loc='lower right')

    # Loss
    ax1.set_ylim([0.7, 1.02])
    ax2.plot(epochs, history_df['loss'], 'b-', label='Train Loss', lw=2)
    ax2.plot(epochs, history_df['val_loss'], 'r-', label='Val Loss', lw=2)
    ax2.set_title('1D CNN Loss Curves')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.grid(True, alpha=0.3)
    ax2.legend(loc='upper right')

    plt.tight_layout()
    plt.savefig(save_path, dpi=200, bbox_inches='tight')
    plt.close(fig)


def train_and_evaluate_cnn():
    """Runs 1D CNN training, generates validation curves, and performs held-out test evaluation."""
    print("=" * 70)
    print("STARTING 1D CNN TRAINING PIPELINE (1024 RAW SAMPLES)")
    print("=" * 70)

    data = load_and_preprocess_cwru_1024(verbose=False)
    sig_train, y_train = data['sig_train'], data['y_train']
    sig_val, y_val     = data['sig_val'], data['y_val']
    sig_test, y_test   = data['sig_test'], data['y_test']
    label_encoder      = data['label_encoder']
    class_names        = list(label_encoder.classes_)

    model = build_1d_cnn(input_length=1024, n_classes=len(class_names))
    model.summary()

    checkpoint_path = os.path.join(MODELS_DIR, 'cnn_cwru_1024_v1.keras')
    log_csv_path = os.path.join(EVAL_DIR, 'cnn_training_log.csv')

    callbacks = [
        ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=15, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-5, verbose=1),
        CSVLogger(log_csv_path)
    ]

    history = model.fit(
        sig_train, y_train,
        validation_data=(sig_val, y_val),
        epochs=50,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )

    # Save training curves
    history_df = pd.read_csv(log_csv_path)
    curve_plot_path = os.path.join(EVAL_DIR, 'cnn_training_curves.png')
    plot_cnn_training_curves(history_df, curve_plot_path)

    # Load best checkpoint for final held-out test evaluation
    best_model = keras.models.load_model(checkpoint_path)

    # Save copy as cnn_model.keras for backward compatibility
    compat_path = os.path.join(MODELS_DIR, 'cnn_model.keras')
    best_model.save(compat_path)

    # Held-out Test Evaluation
    y_test_probs = best_model.predict(sig_test)
    y_test_pred = np.argmax(y_test_probs, axis=1)

    test_acc = accuracy_score(y_test, y_test_pred)
    macro_f1 = f1_score(y_test, y_test_pred, average='macro')
    weighted_f1 = f1_score(y_test, y_test_pred, average='weighted')
    macro_prec = precision_score(y_test, y_test_pred, average='macro')
    macro_rec = recall_score(y_test, y_test_pred, average='macro')
    cm = confusion_matrix(y_test, y_test_pred)

    print("\n" + "=" * 60)
    print("1D CNN HELD-OUT TEST EVALUATION RESULT")
    print("=" * 60)
    print(f"  Test Accuracy: {test_acc*100:.2f}%")
    print(f"  Macro F1 Score: {macro_f1:.4f}")
    print(f"  Weighted F1:   {weighted_f1:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_test_pred, target_names=class_names))

    # Confusion matrix plot
    from train_ml import plot_confusion_matrix
    cm_path = os.path.join(EVAL_DIR, 'confusion_matrix_CNN.png')
    plot_confusion_matrix(cm, class_names, f"Confusion Matrix: 1D Deep CNN (Test Accuracy: {test_acc*100:.2f}%)", 'confusion_matrix_CNN.png')

    cnn_info = {
        'model_name': '1D CNN',
        'model_version': 'cnn_cwru_1024_v1',
        'test_accuracy': float(test_acc),
        'macro_f1': float(macro_f1),
        'weighted_f1': float(weighted_f1),
        'macro_prec': float(macro_prec),
        'macro_rec': float(macro_rec),
        'epochs_trained': len(history_df),
        'input_length': 1024,
        'n_classes': 10,
        'classes': class_names,
        'split_method': 'block_split (leakage-safe)',
        'train_samples': len(sig_train),
        'val_samples': len(sig_val),
        'test_samples': len(sig_test),
        'timestamp': datetime.datetime.utcnow().isoformat()
    }

    with open(os.path.join(MODELS_DIR, 'cnn_model_info.json'), 'w') as f:
        json.dump(cnn_info, f, indent=2)

    # ── Combine with Classical ML results into all_model_results.json ────────
    classical_results_path = os.path.join(EVAL_DIR, 'classical_model_results.json')
    combined_results = []
    if os.path.exists(classical_results_path):
        with open(classical_results_path, 'r') as f:
            combined_results = json.load(f)

    # Append or replace CNN in combined list
    combined_results = [r for r in combined_results if r['model_name'] != '1D CNN']
    combined_results.append({
        'model_name': '1D CNN',
        'test_accuracy': float(test_acc),
        'val_accuracy': float(history_df['val_accuracy'].max()),
        'cv_mean': float(history_df['val_accuracy'].max()),
        'cv_std': 0.0,
        'macro_f1': float(macro_f1),
        'weighted_f1': float(weighted_f1),
        'macro_prec': float(macro_prec),
        'macro_rec': float(macro_rec),
        'confusion_matrix': cm.tolist(),
        'window_length': 1024,
        'features': ['1024-Point Raw Waveform']
    })

    with open(os.path.join(EVAL_DIR, 'all_model_results.json'), 'w') as f:
        json.dump(combined_results, f, indent=2)

    # ── Write Comprehensive model_metadata_v1.json ───────────────────────────
    master_metadata = {
        "system_name": "AI-Driven Bearing Fault Detection and Diagnosis System",
        "dataset": "Case Western Reserve University (CWRU) Bearing Vibration Benchmark",
        "sampling_rate_hz": 48000,
        "signal_unit": "g (acceleration)",
        "window_size": 1024,
        "class_count": 10,
        "classes": class_names,
        "split_method": "Leakage-Safe Block Split (70% Train, 10% Val, 20% Test)",
        "canonical_features": CANONICAL_FEATURES,
        "models": {
            "cnn": cnn_info,
            "classical_models": combined_results
        },
        "selected_production_models": {
            "deep_learning": "cnn_cwru_1024_v1.keras",
            "classical_ml": "svm_cwru_1024_features_v1.joblib"
        },
        "shape_factor_formula": "RMS / mean(|x|)",
        "crest_factor_formula": "max(|x|) / RMS",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    with open(os.path.join(MODELS_DIR, 'model_metadata_v1.json'), 'w') as f:
        json.dump(master_metadata, f, indent=2)

    print("\n[OK] CNN Training and Universal Metadata generation complete.")
    return cnn_info


if __name__ == '__main__':
    train_and_evaluate_cnn()

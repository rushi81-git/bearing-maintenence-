"""
=============================================================
ml/training/train_ml.py
CWRU Bearing Fault Diagnosis — Classical ML Training Pipeline

Trains and compares classical ML models strictly on 1024-sample
extracted statistical features from CWRU data:
  1. Random Forest Classifier
  2. SVM (RBF Kernel)
  3. Gradient Boosting Classifier
  4. Logistic Regression (Linear Baseline)

Features used: 12 Canonical Time-Domain Features (1024-point windows).
Data split: Leakage-Safe Block Split (70% Train, 10% Val, 20% Test).
Scaler: StandardScaler fitted strictly on Train split.
=============================================================
"""

import os
import sys
import json
import pickle
import datetime
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_val_score

warnings.filterwarnings('ignore')

TRAINING_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR     = os.path.dirname(TRAINING_DIR)
MODELS_DIR   = os.path.join(BASE_DIR, 'saved_models')
EVAL_DIR     = os.path.join(BASE_DIR, 'evaluation')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

sys.path.insert(0, BASE_DIR)
from preprocessing.preprocess import load_and_preprocess_cwru_1024, CANONICAL_FEATURES, CWRU_CLASSES

RANDOM_SEED = 42


def get_classical_models():
    """Returns a dictionary of candidate classical ML classifiers."""
    return {
        'Random Forest': RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=RANDOM_SEED,
            n_jobs=-1
        ),
        'SVM (RBF)': SVC(
            C=10.0,
            kernel='rbf',
            gamma='scale',
            probability=True,
            class_weight='balanced',
            random_state=RANDOM_SEED
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=4,
            subsample=0.8,
            random_state=RANDOM_SEED
        ),
        'Logistic Regression': LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight='balanced',
            random_state=RANDOM_SEED,
            n_jobs=-1
        )
    }


def plot_confusion_matrix(cm, class_names, title, filename):
    """Plot and save confusion matrix heatmap."""
    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title=title,
        ylabel='True Label',
        xlabel='Predicted Label'
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j, i, format(cm[i, j], 'd'),
                ha="center", va="center",
                color="white" if cm[i, j] > thresh else "black"
            )

    fig.tight_layout()
    save_path = os.path.join(EVAL_DIR, filename)
    plt.savefig(save_path, dpi=200, bbox_inches='tight')
    plt.close(fig)
    return save_path


def train_and_evaluate_classical_models():
    """Runs training, cross-validation, and held-out test evaluation for classical ML models."""
    print("=" * 70)
    print("STARTING CLASSICAL ML TRAINING PIPELINE (1024-SAMPLE FEATURES)")
    print("=" * 70)

    data = load_and_preprocess_cwru_1024(verbose=True)
    X_train, y_train = data['X_train'], data['y_train']
    X_val, y_val     = data['X_val'], data['y_val']
    X_test, y_test   = data['X_test'], data['y_test']
    label_encoder    = data['label_encoder']
    class_names      = list(label_encoder.classes_)

    models = get_classical_models()
    results = []
    trained_models = {}

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        # 5-fold cross validation on training split
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy', n_jobs=-1)
        print(f"  5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

        # Fit model on training split
        model.fit(X_train, y_train)
        trained_models[name] = model

        # Evaluate on validation split
        val_pred = model.predict(X_val)
        val_acc = accuracy_score(y_val, val_pred)

        # Evaluate on final held-out test split
        test_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, test_pred)
        macro_f1 = f1_score(y_test, test_pred, average='macro')
        weighted_f1 = f1_score(y_test, test_pred, average='weighted')
        macro_prec = precision_score(y_test, test_pred, average='macro')
        macro_rec = recall_score(y_test, test_pred, average='macro')
        cm = confusion_matrix(y_test, test_pred)

        cm_filename = f"confusion_matrix_{name.replace(' ', '_').replace('(', '').replace(')', '')}.png"
        plot_confusion_matrix(cm, class_names, f"Confusion Matrix: {name} (Test Accuracy: {test_acc*100:.2f}%)", cm_filename)

        print(f"  Validation Accuracy: {val_acc:.4f}")
        print(f"  Held-out Test Accuracy: {test_acc:.4f}")
        print(f"  Held-out Macro F1: {macro_f1:.4f}")

        res_dict = {
            'model_name': name,
            'test_accuracy': float(test_acc),
            'val_accuracy': float(val_acc),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'macro_f1': float(macro_f1),
            'weighted_f1': float(weighted_f1),
            'macro_prec': float(macro_prec),
            'macro_rec': float(macro_rec),
            'confusion_matrix': cm.tolist(),
            'window_length': 1024,
            'features': CANONICAL_FEATURES
        }
        results.append(res_dict)

    # Save all classical model results
    results_path = os.path.join(EVAL_DIR, 'classical_model_results.json')
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Select best classical model
    best_res = max(results, key=lambda x: (x['test_accuracy'], x['macro_f1']))
    best_model_name = best_res['model_name']
    best_model = trained_models[best_model_name]
    print(f"\n[OK] Best Classical Model: {best_model_name} (Test Acc: {best_res['test_accuracy']*100:.2f}%)")

    # Save production classical models
    svm_path = os.path.join(MODELS_DIR, 'svm_cwru_1024_features_v1.joblib')
    svm_pkl = os.path.join(MODELS_DIR, 'svm_cwru_1024_features_v1.pkl')
    with open(svm_path, 'wb') as f:
        pickle.dump(trained_models['SVM (RBF)'], f)
    with open(svm_pkl, 'wb') as f:
        pickle.dump(trained_models['SVM (RBF)'], f)

    rf_path = os.path.join(MODELS_DIR, 'rf_cwru_1024_features_v1.joblib')
    rf_pkl = os.path.join(MODELS_DIR, 'rf_cwru_1024_features_v1.pkl')
    with open(rf_path, 'wb') as f:
        pickle.dump(trained_models['Random Forest'], f)
    with open(rf_pkl, 'wb') as f:
        pickle.dump(trained_models['Random Forest'], f)

    # Also maintain best_ml_model.pkl for compatibility
    best_pkl = os.path.join(MODELS_DIR, 'best_ml_model.pkl')
    with open(best_pkl, 'wb') as f:
        pickle.dump(best_model, f)

    with open(os.path.join(MODELS_DIR, 'best_ml_model_info.json'), 'w') as f:
        json.dump({
            'model_name': best_model_name,
            'model_version': 'svm_cwru_1024_features_v1',
            'test_accuracy': best_res['test_accuracy'],
            'macro_f1': best_res['macro_f1'],
            'weighted_f1': best_res['weighted_f1'],
            'cv_mean': best_res['cv_mean'],
            'cv_std': best_res['cv_std'],
            'features': CANONICAL_FEATURES,
            'n_classes': 10,
            'classes': class_names,
            'split_method': 'block_split (leakage-safe)',
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, f, indent=2)

    return results


if __name__ == '__main__':
    train_and_evaluate_classical_models()

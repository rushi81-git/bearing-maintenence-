"""
=============================================================
ml/tests/test_preprocess.py
Unit tests for CWRU preprocessing & feature extraction module
Using Python standard unittest framework (zero external dependencies)
=============================================================
"""

import os
import sys
import unittest
import numpy as np

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, BASE_DIR)

from preprocessing.preprocess import (
    compute_time_domain_features,
    extract_features_matrix,
    normalize_signals_for_cnn,
    load_and_preprocess_cwru_1024,
    CANONICAL_FEATURES,
    EPSILON
)


class TestPreprocess(unittest.TestCase):

    def test_canonical_features_order(self):
        """Verify canonical features list has exactly 12 items with expected names."""
        expected = [
            "max", "min", "mean", "std", "rms", "skewness",
            "kurtosis", "crest_factor", "shape_factor",
            "peak_to_peak", "mean_absolute_value", "variance"
        ]
        self.assertEqual(CANONICAL_FEATURES, expected)
        self.assertEqual(len(CANONICAL_FEATURES), 12)

    def test_exact_known_array_features(self):
        """Test feature calculations on a known hand-calculated array."""
        x = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
        feats = compute_time_domain_features(x)

        self.assertEqual(feats['max'], 2.0)
        self.assertEqual(feats['min'], -2.0)
        self.assertAlmostEqual(feats['mean'], 0.0, places=7)
        self.assertAlmostEqual(feats['peak_to_peak'], 4.0, places=7)

        # RMS = sqrt( (4 + 1 + 0 + 1 + 4)/5 ) = sqrt(2) ≈ 1.41421356
        expected_rms = np.sqrt(2.0)
        self.assertAlmostEqual(feats['rms'], expected_rms, places=6)

        # MAV = (2 + 1 + 0 + 1 + 2)/5 = 1.2
        self.assertAlmostEqual(feats['mean_absolute_value'], 1.2, places=6)

        # Crest factor = max(|x|) / rms = 2.0 / sqrt(2) ≈ 1.41421356
        self.assertAlmostEqual(feats['crest_factor'], 2.0 / expected_rms, places=6)

        # Shape factor = rms / mean(|x|) = sqrt(2) / 1.2 ≈ 1.1785113
        self.assertAlmostEqual(feats['shape_factor'], expected_rms / 1.2, places=6)

        # Variance (ddof=1) of [-2, -1, 0, 1, 2] = 10 / 4 = 2.5
        self.assertAlmostEqual(feats['variance'], 2.5, places=6)
        self.assertAlmostEqual(feats['std'], np.sqrt(2.5), places=6)

    def test_shape_factor_does_not_divide_by_signed_mean(self):
        """
        CRITICAL TEST: Ensure shape factor is RMS / mean(|x|), NOT RMS / mean(x).
        For a zero-mean symmetric signal, RMS/mean(x) would explode or divide by zero.
        RMS / mean(|x|) should remain stable and bounded.
        """
        x = np.sin(np.linspace(0, 2 * np.pi, 1024))
        feats = compute_time_domain_features(x)

        self.assertAlmostEqual(feats['mean'], 0.0, places=12)
        # Shape factor of sine wave is mathematically pi / (2 * sqrt(2)) ≈ 1.1107
        expected_sf = np.pi / (2 * np.sqrt(2))
        self.assertAlmostEqual(feats['shape_factor'], expected_sf, places=2)
        self.assertLess(feats['shape_factor'], 2.0)

    def test_zero_signal_edge_case(self):
        """Verify all-zero signal produces finite valid numbers without crashing or returning NaN/Inf."""
        x = np.zeros(1024)
        feats = compute_time_domain_features(x)

        for k, v in feats.items():
            self.assertTrue(np.isfinite(v), f"Feature {k} returned non-finite value {v} on zero signal")
            self.assertFalse(np.isnan(v), f"Feature {k} returned NaN on zero signal")

        self.assertEqual(feats['max'], 0.0)
        self.assertEqual(feats['min'], 0.0)
        self.assertEqual(feats['rms'], 0.0)
        self.assertEqual(feats['crest_factor'], 0.0)
        self.assertEqual(feats['shape_factor'], 0.0)

    def test_constant_signal_edge_case(self):
        """Verify constant signal produces finite valid numbers."""
        x = np.full(1024, 3.5)
        feats = compute_time_domain_features(x)

        for k, v in feats.items():
            self.assertTrue(np.isfinite(v), f"Feature {k} returned non-finite value {v} on constant signal")

        self.assertEqual(feats['max'], 3.5)
        self.assertEqual(feats['min'], 3.5)
        self.assertEqual(feats['mean'], 3.5)
        self.assertEqual(feats['std'], 0.0)
        self.assertEqual(feats['rms'], 3.5)
        self.assertEqual(feats['peak_to_peak'], 0.0)
        self.assertAlmostEqual(feats['crest_factor'], 1.0, places=5)
        self.assertAlmostEqual(feats['shape_factor'], 1.0, places=5)

    def test_nan_and_inf_detection(self):
        """Verify that signals containing NaN or Inf raise ValueError."""
        x_nan = np.ones(1024)
        x_nan[50] = np.nan
        with self.assertRaises(ValueError):
            compute_time_domain_features(x_nan)

        x_inf = np.ones(1024)
        x_inf[100] = np.inf
        with self.assertRaises(ValueError):
            compute_time_domain_features(x_inf)

    def test_extract_features_matrix(self):
        """Verify matrix feature extraction shape and column consistency."""
        signals = np.random.randn(10, 1024)
        matrix = extract_features_matrix(signals)

        self.assertEqual(matrix.shape, (10, 12))
        self.assertTrue(np.all(np.isfinite(matrix)))

    def test_normalize_signals_for_cnn(self):
        """Verify CNN normalization bounds signals into [-1, 1]."""
        signals = np.random.randn(5, 1024) * 10.0
        norm = normalize_signals_for_cnn(signals)

        self.assertEqual(norm.shape, (5, 1024))
        self.assertTrue(np.all(norm >= -1.0 - 1e-6))
        self.assertTrue(np.all(norm <= 1.0 + 1e-6))
        for row in norm:
            self.assertAlmostEqual(float(np.max(np.abs(row))), 1.0, places=5)

    def test_cwru_dataset_split_leakage_safety(self):
        """Verify dataset loading, sample counts, and leakage-safe block splits."""
        data = load_and_preprocess_cwru_1024(verbose=False)

        self.assertEqual(data['X_train'].shape, (3220, 12))
        self.assertEqual(data['X_val'].shape, (460, 12))
        self.assertEqual(data['X_test'].shape, (920, 12))

        self.assertEqual(data['sig_train'].shape, (3220, 1024))
        self.assertEqual(data['sig_val'].shape, (460, 1024))
        self.assertEqual(data['sig_test'].shape, (920, 1024))

        self.assertEqual(len(np.unique(data['y_train'])), 10)
        self.assertEqual(len(np.unique(data['y_val'])), 10)
        self.assertEqual(len(np.unique(data['y_test'])), 10)


if __name__ == '__main__':
    unittest.main(verbosity=2)

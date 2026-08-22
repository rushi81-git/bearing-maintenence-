"""
=============================================================
ml/tests/test_api.py
Unit tests for FastAPI endpoints and inference engine
Zero external HTTP client dependencies
=============================================================
"""

import os
import sys
import unittest
import numpy as np

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, BASE_DIR)

from inference.predict import (
    predict_single_window,
    analyze_vibration_signal,
    get_curated_demo_samples,
    WINDOW_LENGTH
)
from api.ml_server import (
    health_check,
    predict_bearing_condition,
    get_demo_samples,
    get_metadata,
    PredictRequest
)


class TestInferenceAndAPI(unittest.TestCase):

    def test_single_window_inference(self):
        """Test inference on a valid 1024-sample array."""
        signal = np.random.randn(1024) * 0.5
        result = predict_single_window(signal)

        self.assertIn('bearing_status', result)
        self.assertIn('predicted_class', result)
        self.assertIn('prediction_probability', result)
        self.assertIn('features', result)
        self.assertIn('top_predictions', result)
        self.assertIn('recommendation', result)
        self.assertGreaterEqual(result['prediction_probability'], 0.0)
        self.assertLessEqual(result['prediction_probability'], 1.0)
        self.assertEqual(len(result['features']), 12)

    def test_multi_window_analysis(self):
        """Test multi-window analysis on 3,072 samples (3 windows)."""
        signal = np.random.randn(3072) * 0.8
        result = analyze_vibration_signal(signal.tolist())

        self.assertEqual(result['windows_analyzed'], 3)
        self.assertEqual(result['total_samples'], 3072)
        self.assertEqual(result['discarded_trailing_samples'], 0)
        self.assertEqual(len(result['window_predictions']), 3)
        self.assertGreaterEqual(len(result['prediction_distribution']), 1)
        self.assertIn('dominant_window_count', result)

    def test_signal_less_than_1024_rejected(self):
        """Verify that signals with fewer than 1024 samples raise ValueError."""
        short_signal = np.random.randn(500).tolist()
        with self.assertRaises(ValueError):
            analyze_vibration_signal(short_signal)

    def test_nan_rejection(self):
        """Verify that signals with NaNs raise ValueError."""
        bad_signal = np.random.randn(1024)
        bad_signal[10] = np.nan
        with self.assertRaises(ValueError):
            analyze_vibration_signal(bad_signal.tolist())

    def test_fastapi_health_endpoint(self):
        """Verify health_check() returns healthy status."""
        data = health_check()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['window_size'], 1024)
        self.assertTrue(data['models_available']['1d_cnn'])

    def test_fastapi_predict_handler(self):
        """Verify predict_bearing_condition handler returns valid schema."""
        signal = (np.random.randn(1024) * 0.2).tolist()
        req = PredictRequest(
            signal=signal,
            sampling_rate_hz=48000,
            signal_unit="g",
            source_type="csv"
        )
        res = predict_bearing_condition(req)
        self.assertTrue(res.success)
        self.assertIn(res.predicted_class, [
            'Normal', 'Ball_007', 'Ball_014', 'Ball_021',
            'IR_007', 'IR_014', 'IR_021', 'OR_007', 'OR_014', 'OR_021'
        ])
        self.assertEqual(res.windows_analyzed, 1)

    def test_fastapi_predict_multi_window(self):
        """Verify multi-window request handling (2,500 samples)."""
        signal = (np.random.randn(2500) * 0.4).tolist()
        req = PredictRequest(
            signal=signal,
            sampling_rate_hz=48000,
            signal_unit="g"
        )
        res = predict_bearing_condition(req)
        self.assertTrue(res.success)
        self.assertEqual(res.windows_analyzed, 2)
        self.assertEqual(res.discarded_trailing_samples, 452)

    def test_fastapi_demo_samples_handler(self):
        """Verify get_demo_samples handler returns curated demonstration data."""
        data = get_demo_samples()
        self.assertTrue(data['success'])
        self.assertGreater(data['count'], 0)
        self.assertIn('Normal', data['samples'])
        self.assertEqual(len(data['samples']['Normal']['signal']), 1024)
        self.assertEqual(data['samples']['Normal']['label_type'], 'CWRU Demonstration Sample')


if __name__ == '__main__':
    unittest.main(verbosity=2)

# Task List — CWRU ML Upgrade

## Phase 1: Setup + Preprocessing
- [/] Create `ml/` directory structure
- [ ] Copy datasets to `ml/data/`
- [ ] Write `ml/preprocessing/preprocess.py` (fix form feature, block split, scaler)
- [ ] Test preprocessing script

## Phase 2: Classical ML Training
- [ ] Write `ml/training/train_ml.py` (RF, SVM, XGBoost)
- [ ] Run training — save models, scaler, label encoder
- [ ] Write `ml/evaluation/evaluate.py` (metrics + confusion matrix)
- [ ] Run evaluation — get honest accuracy report

## Phase 3: 1D CNN Training
- [ ] Write `ml/training/train_cnn.py`
- [ ] Run CNN training
- [ ] Compare CNN vs classical ML results

## Phase 4: Inference API
- [ ] Write `ml/inference/predict.py` (`predict_vibration()` function)
- [ ] Write `ml/api/ml_server.py` (FastAPI server)
- [ ] Test API endpoint

## Phase 5: Backend Integration
- [ ] Update `backend/schema.sql` (add bearing_predictions table)
- [ ] Update `backend/server.js` (add `/api/bearing-analysis` endpoint)
- [ ] Test Node.js ↔ Python ML API connection

## Phase 6: Frontend Update
- [ ] Add Bearing Analysis tab to `frontend/src/App.js`
- [ ] Show diagnosis output (fault type, severity, confidence)
- [ ] Add vibration waveform and probability charts

## Phase 7: Testing + Docs
- [ ] Full stack end-to-end test
- [ ] Update README.md
- [ ] Write `requirements.txt`

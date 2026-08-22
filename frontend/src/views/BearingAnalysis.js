import React, { useState, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { WaveformChart } from '../components/WaveformChart';
import { SpectrumChart } from '../components/SpectrumChart';
import { DistributionChart } from '../components/DistributionChart';
import { parseVibrationCSV } from '../utils/csvParser';
import { computeFFT } from '../utils/fft';
import { analyzeBearingSignal, fetchDemoSamples } from '../services/api';

const PROCESSING_STEPS = [
  'Reading vibration signal...',
  'Validating numeric sample continuity...',
  'Segmenting into 1024-point universal windows...',
  'Extracting time-domain statistical characteristics...',
  'Executing 1D Deep CNN inference...',
  'Formulating diagnosis and maintenance recommendation...'
];

export function BearingAnalysis({ machines, showToast }) {
  // Machine Selection
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');

  // Signal & Parsing state
  const [parsedCsv, setParsedCsv] = useState(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(0);
  const [activeSignal, setActiveSignal] = useState(null);
  const [samplingRateHz, setSamplingRateHz] = useState(48000);
  const [signalUnit, setSignalUnit] = useState('g');
  const [sourceFilename, setSourceFilename] = useState('machine_vibration.csv');
  const [sourceType, setSourceType] = useState('csv');

  // CWRU Demo samples cache
  const [demoSamples, setDemoSamples] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Analysis / Inference State
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [useClassicalML, setUseClassicalML] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Update selected machine when machine list loads
  useEffect(() => {
    if (!selectedMachineId && machines.length > 0) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  // Load demo samples list
  useEffect(() => {
    fetchDemoSamples()
      .then(res => {
        if (res.success) setDemoSamples(res.samples);
      })
      .catch(() => {});
  }, []);

  // Compute FFT spectrum for active signal
  const spectrumData = useMemo(() => {
    if (!activeSignal || activeSignal.length === 0) return [];
    return computeFFT(activeSignal.slice(0, 1024), samplingRateHz);
  }, [activeSignal, samplingRateHz]);

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFilename(file.name);
    setSourceType('csv');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const parsed = parseVibrationCSV(text);
        setParsedCsv(parsed);
        setSelectedColumnIndex(parsed.defaultColumn.columnIndex);
        setActiveSignal(parsed.defaultColumn.data);
        setDiagnosisResult(null);
        showToast(`Loaded ${parsed.defaultColumn.sampleCount.toLocaleString()} samples from ${file.name}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Handle Column selection change if CSV has multiple columns
  const handleColumnChange = (colIdx) => {
    setSelectedColumnIndex(colIdx);
    const col = parsedCsv.columns.find(c => c.columnIndex === colIdx);
    if (col) {
      setActiveSignal(col.data);
      setDiagnosisResult(null);
    }
  };

  // Load a curated CWRU Demo Sample
  const handleLoadDemo = (faultKey) => {
    if (!demoSamples || !demoSamples[faultKey]) return;
    const sample = demoSamples[faultKey];

    if (!sample.signal || sample.signal.length === 0) {
      showToast('Demo signals require the FastAPI ML service to be running (port 8000). Start it with: python -m uvicorn ml.api.ml_server:app --port 8000', 'error');
      return;
    }

    setParsedCsv(null);
    setActiveSignal(sample.signal);
    setSamplingRateHz(sample.sampling_rate_hz || 48000);
    setSignalUnit(sample.signal_unit || 'g');
    setSourceFilename(`cwru_demo_${faultKey.toLowerCase()}.csv`);
    setSourceType('demo');
    setDiagnosisResult(null);
    showToast(`Loaded CWRU Demonstration Sample (${faultKey})`, 'info');
  };

  // Execute Analysis with realistic progressive pipeline steps
  const handleAnalyze = async () => {
    if (!activeSignal || activeSignal.length < 1024) {
      showToast('At least 1024 valid vibration samples are required for diagnosis.', 'error');
      return;
    }

    setAnalyzing(true);
    setCurrentStepIndex(0);
    setDiagnosisResult(null);

    // Step progression animation
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < PROCESSING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 180);

    try {
      const res = await analyzeBearingSignal({
        signal: activeSignal,
        machine_id: selectedMachineId || null,
        sampling_rate_hz: samplingRateHz,
        signal_unit: signalUnit,
        source_type: sourceType,
        source_filename: sourceFilename,
        use_classical_ml: useClassicalML
      });

      clearInterval(stepInterval);

      if (res.success) {
        setDiagnosisResult(res.data);
        showToast('Bearing vibration diagnosis complete!', 'success');
      } else {
        showToast(res.message || 'Diagnosis failed', 'error');
      }
    } catch (err) {
      clearInterval(stepInterval);
      showToast(`Inference error: ${err.message}`, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const sampleCount = activeSignal ? activeSignal.length : 0;
  const windowCount = Math.floor(sampleCount / 1024);
  const remainderSamples = sampleCount % 1024;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      
      {/* ── Top Workflow Bar: Machine Selector & CWRU Demo Triggers ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              // STEP 1 & 2: INGESTION CONFIGURATION
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              Machine Bearing Vibration Ingestion
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Machine:
              </label>
              <select
                className="select-field"
                style={{ width: 220 }}
                value={selectedMachineId}
                onChange={e => setSelectedMachineId(e.target.value)}
              >
                <option value="">-- Unassigned Machine --</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machine_type || m.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ingestion Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          
          {/* Primary Ingestion: Machine CSV Upload */}
          <div
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
              textAlign: 'center',
              background: 'var(--bg-surface-raised)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <UploadCloud size={22} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Upload Machine Vibration CSV
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Drag & drop or click to browse (minimum 1024 samples)
            </div>
          </div>

          {/* Secondary Ingestion: Curated CWRU Demo Samples */}
          <div
            style={{
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={14} style={{ color: 'var(--status-mild)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Secondary Demo Mode
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Try CWRU Benchmark Demonstration Samples
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Curated test-split recordings for algorithm sanity checking
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {['Normal', 'Ball_014', 'IR_014', 'OR_014', 'IR_021', 'Ball_007'].map(k => (
                <button
                  key={k}
                  onClick={() => handleLoadDemo(k)}
                  className="btn btn-outline"
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-surface)'
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* If multi-column CSV detected, show Column Picker */}
        {parsedCsv && parsedCsv.columns.length > 1 && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Detected Multiple Columns:
            </span>
            <select
              className="select-field"
              style={{ width: 240 }}
              value={selectedColumnIndex}
              onChange={e => handleColumnChange(parseInt(e.target.value, 10))}
            >
              {parsedCsv.columns.map(col => (
                <option key={col.columnIndex} value={col.columnIndex}>
                  {col.columnName} ({col.sampleCount.toLocaleString()} samples)
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Select which column contains the raw accelerometer vibration readings.
            </span>
          </div>
        )}
      </div>

      {/* ── Signal Validation, Waveform Preview & Analyze CTA ── */}
      {activeSignal && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  // STEP 3 & 4: SIGNAL VALIDATION & PREVIEW
                </span>
                {sourceType === 'demo' && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--status-mild-bg)', color: 'var(--status-mild)', border: '1px solid var(--status-mild-border)', fontWeight: 700 }}>
                    CWRU Demonstration Sample
                  </span>
                )}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                Signal Telemetry ({sourceFilename})
              </h3>
            </div>

            {/* Ingestion Parameters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Sampling Rate:
                </label>
                <select
                  className="select-field"
                  style={{ width: 120, padding: '6px 10px', fontSize: 12 }}
                  value={samplingRateHz}
                  onChange={e => setSamplingRateHz(parseInt(e.target.value, 10))}
                >
                  <option value={48000}>48,000 Hz</option>
                  <option value={12000}>12,000 Hz</option>
                  <option value={20000}>20,000 Hz</option>
                  <option value={0}>Unknown Fs</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Model:
                </label>
                <select
                  className="select-field"
                  style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
                  value={useClassicalML ? 'rf' : 'cnn'}
                  onChange={e => setUseClassicalML(e.target.value === 'rf')}
                >
                  <option value="cnn">1D Deep CNN (99.5%)</option>
                  <option value="rf">Random Forest (89.9%)</option>
                </select>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || sampleCount < 1024}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: 14 }}
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Diagnosing...
                  </>
                ) : (
                  <>
                    <Activity size={16} />
                    Analyze Bearing Condition
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Metrics Pills */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Samples: </span>
              <strong style={{ color: sampleCount >= 1024 ? 'var(--status-healthy)' : 'var(--status-severe)', fontFamily: 'var(--font-mono)' }}>
                {sampleCount.toLocaleString()}
              </strong>
            </div>
            <div style={{ padding: '8px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>1024-Pt Windows: </span>
              <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {windowCount} complete {windowCount === 1 ? 'window' : 'windows'}
              </strong>
            </div>
            {remainderSamples > 0 && (
              <div style={{ padding: '8px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Trailing Remainder: </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {remainderSamples} samples discarded
                </span>
              </div>
            )}
            <div style={{ padding: '8px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Nyquist Limit: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {samplingRateHz ? `${(samplingRateHz / 2000).toFixed(1)} kHz` : 'Normalized'}
              </strong>
            </div>
          </div>

          {/* Dual Charts: Time-Domain Waveform & FFT Spectrum */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  // TIME DOMAIN WAVEFORM
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  1024 Samples Window
                </span>
              </div>
              <WaveformChart signal={activeSignal.slice(0, 1024)} unit={signalUnit} height={160} />
            </div>

            <div style={{ background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', padding: 14, border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--status-mild)', fontFamily: 'var(--font-mono)' }}>
                  // FREQUENCY DOMAIN SPECTRUM (FFT)
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {samplingRateHz ? `Fs = ${samplingRateHz / 1000} kHz` : 'Bin Spectrum'}
                </span>
              </div>
              <SpectrumChart spectrumData={spectrumData} samplingRateHz={samplingRateHz} height={160} />
            </div>
          </div>
        </div>
      )}

      {/* ── Progressive Analyzing Indicator ── */}
      {analyzing && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--accent-border)'
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'spin 1.2s linear infinite'
            }}
          >
            <RefreshCw size={24} />
          </div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
            Analyzing Bearing Signal Telemetry
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {PROCESSING_STEPS[currentStepIndex]}
          </p>
        </div>
      )}

      {/* ── Primary Diagnosis Result (Clean, Direct, Hero Presentation) ── */}
      {diagnosisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
          
          {/* Main Hero Result Card */}
          <div
            className="card"
            style={{
              borderLeft: `4px solid ${
                diagnosisResult.bearing_status === 'Healthy'
                  ? 'var(--status-healthy)'
                  : diagnosisResult.severity === 'Severe'
                  ? 'var(--status-severe)'
                  : diagnosisResult.severity === 'Moderate'
                  ? 'var(--status-moderate)'
                  : 'var(--status-mild)'
              }`,
              padding: '28px 24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <StatusBadge status={diagnosisResult.bearing_status} size="lg" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {diagnosisResult.windows_analyzed} {diagnosisResult.windows_analyzed === 1 ? 'window analyzed' : 'windows aggregated'}
                  </span>
                </div>

                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {diagnosisResult.fault_type === 'Normal' ? 'Normal Bearing Condition' : `${diagnosisResult.fault_type} Fault Detected`}
                </h2>

                {diagnosisResult.fault_size_inches > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>
                      Defect Size: <strong>{diagnosisResult.fault_size_inches}"</strong> ({diagnosisResult.fault_size_mm} mm)
                    </span>
                    <span>·</span>
                    <span>
                      Severity: <strong style={{ textTransform: 'capitalize' }}>{diagnosisResult.severity}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Model Probability Pill */}
              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  textAlign: 'right',
                  minWidth: 200
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Model Probability
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {(diagnosisResult.prediction_probability * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Based on softmax output probability
                </div>
              </div>
            </div>

            {/* Recommended Maintenance Action */}
            <div
              style={{
                marginTop: 22,
                padding: '16px 18px',
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}
            >
              <AlertTriangle size={18} style={{ color: diagnosisResult.severity === 'Severe' ? 'var(--status-severe)' : 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recommended Action ({diagnosisResult.urgency} Urgency · {diagnosisResult.check_interval})
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
                  {diagnosisResult.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Window Distribution Section (if > 1 window) */}
          {diagnosisResult.windows_analyzed > 1 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    // MULTI-WINDOW CONTINUITY ANALYSIS
                  </span>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
                    Window-by-Window Condition Distribution ({diagnosisResult.windows_analyzed} Windows)
                  </h4>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Dominant: <strong>{diagnosisResult.dominant_window_count}/{diagnosisResult.windows_analyzed} windows ({((diagnosisResult.dominant_window_count / diagnosisResult.windows_analyzed) * 100).toFixed(0)}%)</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                <div>
                  <DistributionChart distribution={diagnosisResult.prediction_distribution} height={180} />
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Windows</th>
                        <th>Percentage</th>
                        <th>Avg Prob</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisResult.prediction_distribution.map((dist, idx) => (
                        <tr key={idx}>
                          <td><strong>{dist.class}</strong> ({dist.fault_type})</td>
                          <td>{dist.count}</td>
                          <td>{dist.percentage}%</td>
                          <td>{(dist.avg_probability * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Expandable Technical Analysis Section ── */}
          <div className="card">
            <button
              onClick={() => setShowTechnicalDetails(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                padding: '4px 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                  // TECHNICAL AUDIT
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  Statistical Features, Model Probabilities & Sensor Metadata
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                <span>{showTechnicalDetails ? 'Collapse Details' : 'Expand Details'}</span>
                {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showTechnicalDetails && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
                
                {/* 12 Statistical Features Grid */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    12 Extracted Time-Domain Characteristics (1024 Window)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    {Object.entries(diagnosisResult.features).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          background: 'var(--bg-surface-raised)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          {typeof val === 'number' ? val.toFixed(4) : val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Class Softmax Distribution */}
                {diagnosisResult.top_predictions && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Top Softmax Class Probabilities
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {diagnosisResult.top_predictions.map((pred, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 90, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {pred.class}
                          </span>
                          <div style={{ flex: 1, height: 8, background: 'var(--bg-surface-raised)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${pred.probability * 100}%`,
                                background: i === 0 ? 'var(--accent-primary)' : 'var(--border-strong)',
                                borderRadius: 4,
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                          <span style={{ width: 60, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {(pred.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata & Academic Boundary Note */}
                <div style={{ padding: '14px 16px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, border: '1px solid var(--border-subtle)' }}>
                  <div><strong>Deployed Model Version:</strong> {diagnosisResult.model_version}</div>
                  <div><strong>Sampling Rate:</strong> {diagnosisResult.sampling_rate_hz ? `${diagnosisResult.sampling_rate_hz.toLocaleString()} Hz` : 'Unknown'} · <strong>Unit:</strong> {diagnosisResult.signal_unit} (acceleration)</div>
                  <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>{diagnosisResult.disclaimer}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

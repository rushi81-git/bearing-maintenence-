import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cpu,
  Upload,
  Activity,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Wrench,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ChevronRight,
  RefreshCw,
  Plus,
  Volume2,
  VolumeX,
  Radio,
  Gauge,
  Sliders,
  Maximize2,
  Download,
  Flame,
  Check,
  Terminal,
  Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { parseVibrationCsv } from '../../utils/csvParser';
import { generateDiagnosticPDF } from '../../utils/pdfReportGenerator';
import { analyzeBearingSignal, createMachine, createScheduleEntry } from '../../services/api';

// ── Web Audio Acoustic Synthesizer for Bearing Fault Simulation ──
function playBearingAcousticPulse(faultType = 'Inner Race', duration = 3.5) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Repetition frequency: Inner Race ~162 Hz, Outer Race ~107 Hz, Ball ~141 Hz, Normal ~29.5 Hz
    let repFreq = 29.5;
    let impactIntensity = 0.15;
    if (faultType === 'Inner Race') {
      repFreq = 162.2;
      impactIntensity = 0.7;
    } else if (faultType === 'Outer Race') {
      repFreq = 107.5;
      impactIntensity = 0.85;
    } else if (faultType === 'Ball') {
      repFreq = 141.2;
      impactIntensity = 0.6;
    }

    const period = 1 / repFreq;
    const numPulses = Math.min(Math.floor(duration / period), 250);

    for (let i = 0; i < numPulses; i++) {
      const pulseTime = now + (i * period);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // High-frequency ringing of bearing outer raceway resonance (~2800 Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800 + (Math.random() * 200 - 100), pulseTime);

      gain.gain.setValueAtTime(impactIntensity, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.008);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.009);
    }

    setTimeout(() => {
      ctx.close();
    }, (duration + 0.5) * 1000);

    return ctx;
  } catch (_) {
    return null;
  }
}

// ── Simple Fast Power Spectrum for Vibration FFT ──
function computePowerSpectrum(data, fs = 12000, maxFreq = 600) {
  if (!data || data.length < 256) return [];
  const N = Math.min(data.length, 512);
  const spectrum = [];
  const numBins = 60;
  const df = maxFreq / numBins;

  for (let k = 0; k < numBins; k++) {
    const freq = Math.round(k * df);
    let real = 0;
    let imag = 0;
    const omega = 2 * Math.PI * (freq / fs);

    // Discrete Fourier bin projection
    const step = 2;
    for (let n = 0; n < N; n += step) {
      const angle = omega * n;
      real += data[n] * Math.cos(angle);
      imag -= data[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(real * real + imag * imag) / (N / 2);
    spectrum.push({
      freq,
      magnitude: Math.round(mag * 1000) / 1000
    });
  }
  return spectrum;
}

export function IndustrialDashboard({
  machines = [],
  onRefreshMachines,
  onSwitchToSchedule,
  showToast
}) {
  // ── Step 1 State ──
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [isStep1Confirmed, setIsStep1Confirmed] = useState(false);
  const [machineMode, setMachineMode] = useState('select'); // 'select' | 'add'
  const [newMachineForm, setNewMachineForm] = useState({
    name: '',
    type: 'Induction Motor',
    location: 'Floor Bay 1',
    rpm: '1772',
    bearing_model: 'SKF 6205-2RS (DE)'
  });
  const [isAddingMachine, setIsAddingMachine] = useState(false);

  // ── Step 2 State ──
  const [bearingLocation, setBearingLocation] = useState('Drive End (DE)');
  const [parsedCsv, setParsedCsv] = useState(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStep2Done, setIsStep2Done] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('waveform'); // 'waveform' | 'spectrum'
  const fileInputRef = useRef(null);

  // ── Step 3 & 4 State ──
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [sourceFilename, setSourceFilename] = useState('');
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    task_type: 'Bearing Replacement & Overhaul',
    priority: 'High',
    due_date: '',
    technician: 'Bay 1 Lead Mechanical Specialist',
    notes: ''
  });

  // Auto-select first machine if available
  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(String(machines[0].id));
    }
  }, [machines, selectedMachineId]);

  const selectedMachine =
    machines.find((m) => String(m.id) === String(selectedMachineId)) ||
    (machines.length > 0 ? machines[0] : null);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDispatchForm((prev) => ({
      ...prev,
      due_date: d.toISOString().split('T')[0]
    }));
  }, []);

  // ── Handlers for Step 1 ──
  const handleConfirmStep1 = () => {
    if (!selectedMachine) {
      showToast('Please select or register a machine first.', 'error');
      return;
    }
    setIsStep1Confirmed(true);
    showToast(`Machine confirmed: ${selectedMachine.name}. Step 2 unlocked.`, 'success');
    setTimeout(() => {
      const step2El = document.getElementById('step-2-section');
      if (step2El) step2El.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    if (!newMachineForm.name.trim()) {
      showToast('Machine Name is required', 'error');
      return;
    }
    setIsAddingMachine(true);
    try {
      const res = await createMachine({
        name: newMachineForm.name.trim(),
        type: newMachineForm.type,
        location: newMachineForm.location,
        operational_hours: 120,
        temperature: 42.5,
        vibration: 1.2
      });
      if (res.success) {
        showToast(`Machine "${newMachineForm.name}" registered successfully!`, 'success');
        if (onRefreshMachines) await onRefreshMachines();
        if (res.machine_id || res.id) {
          setSelectedMachineId(String(res.machine_id || res.id));
        }
        setMachineMode('select');
        setIsStep1Confirmed(true);
      } else {
        showToast(res.message || 'Failed to create machine', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAddingMachine(false);
    }
  };

  // ── Handlers for Step 2 ──
  const handleFileProcess = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      showToast('Please upload a valid CSV or TXT file', 'error');
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseVibrationCsv(text, file.name);
      setParsedCsv(parsed);
      setSelectedColumnIndex(parsed.defaultColumnIndex || 0);
      setSourceFilename(file.name);
      setIsStep2Done(false);
      setDiagnosisResult(null);
      setDispatchSuccess(false);
      showToast(`Loaded ${parsed.columns[parsed.defaultColumnIndex]?.columnName || 'vibration'} (${parsed.totalDataPoints.toLocaleString()} samples)`, 'success');
    } catch (err) {
      showToast(err.message || 'Error parsing CSV file', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRunDiagnosis = async () => {
    if (!parsedCsv) {
      showToast('Please attach or drop a vibration CSV file first', 'error');
      return;
    }
    const col = parsedCsv.columns[selectedColumnIndex];
    if (!col || !col.data || col.data.length < 1024) {
      showToast('Need at least 1,024 vibration data points for valid diagnosis', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const fs = parsedCsv.detectedSamplingRate || 12000;
      const res = await analyzeBearingSignal({
        signal: col.data.slice(0, 4096),
        machine_id: selectedMachine ? selectedMachine.id : 1,
        sampling_rate_hz: fs,
        signal_unit: 'g',
        source_type: 'csv',
        source_filename: sourceFilename || 'vibration_telemetry.csv',
        model_mode: 'auto',
        use_classical_ml: false,
        bearing_location: bearingLocation
      });

      if (res.success && res.data) {
        setDiagnosisResult(res.data);
        setIsStep2Done(true);
        showToast('Industrial AI Diagnostic run complete!', 'success');
        setTimeout(() => {
          const step3El = document.getElementById('step-3-section');
          if (step3El) step3El.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      } else {
        showToast(res.message || 'Diagnostic inference failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Diagnosis execution error', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick-load benchmark dataset (12kHz Inner Race defect with clean physics envelope)
  const handleLoadSampleDataset = () => {
    const n = 2048;
    const fs = 12000;
    const bpfi = 162.2;
    const rows = ['Sample_No,Time_s,Vibration_Acceleration_g,Fault_Type,Defect_Size_in,Sampling_Rate_Hz'];
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      const carrier = Math.sin(2 * Math.PI * 3200 * t);
      const envelope = Math.pow(Math.max(0, Math.sin(2 * Math.PI * bpfi * t)), 8);
      const impact = 4.2 * envelope * carrier;
      const noise = (Math.random() - 0.5) * 0.35;
      const val = (impact + noise).toFixed(6);
      rows.push(`${i + 1},${t.toFixed(6)},${val},IR,0.007,12000.0`);
    }
    const csvContent = rows.join('\n');
    const parsed = parseVibrationCsv(csvContent, 'IR_007_12k_DriveEnd.csv');
    setParsedCsv(parsed);
    setSelectedColumnIndex(parsed.defaultColumnIndex || 0);
    setSourceFilename('IR_007_12k_DriveEnd.csv');
    setIsStep2Done(false);
    setDiagnosisResult(null);
    setDispatchSuccess(false);
    showToast('Loaded benchmark Inner Race (0.007") 12 kHz dataset', 'info');
  };

  // ── Handlers for Step 4 ──
  const handleDownloadPdf = () => {
    if (!diagnosisResult) return;
    generateDiagnosticPDF({
      diagnosis: diagnosisResult,
      machine: selectedMachine,
      filename: sourceFilename
    });
    showToast('Executive Diagnostic PDF Report downloaded', 'success');
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine) return;
    try {
      const res = await createScheduleEntry({
        machine_id: selectedMachine.id,
        task_type: dispatchForm.task_type,
        task_description: `${dispatchForm.task_type} - ${diagnosisResult?.fault_type || 'Fault'} (${diagnosisResult?.fault_size_inches || '0.007'}") on ${bearingLocation}. Notes: ${dispatchForm.notes}`,
        priority: dispatchForm.priority,
        due_date: dispatchForm.due_date,
        assigned_technician: dispatchForm.technician
      });

      if (res.success) {
        setDispatchSuccess(true);
        setDispatchModalOpen(false);
        showToast('Work order successfully dispatched to Maintenance Schedule!', 'success');
      } else {
        showToast(res.message || 'Failed to dispatch work order', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error dispatching task', 'error');
    }
  };

  const handlePlayAudio = () => {
    if (audioPlaying) return;
    setAudioPlaying(true);
    playBearingAcousticPulse(diagnosisResult?.fault_type || 'Inner Race', 3.0);
    setTimeout(() => setAudioPlaying(false), 3200);
  };

  // Waveform preview points (150 samples)
  const waveformPreviewData = useMemo(() => {
    if (!parsedCsv || !parsedCsv.columns[selectedColumnIndex]) return [];
    const col = parsedCsv.columns[selectedColumnIndex];
    const data = col.data;
    const step = Math.max(1, Math.floor(data.length / 150));
    const points = [];
    for (let i = 0; i < data.length && points.length < 150; i += step) {
      points.push({ index: i, val: Math.round(data[i] * 1000) / 1000 });
    }
    return points;
  }, [parsedCsv, selectedColumnIndex]);

  // FFT Power Spectrum preview points
  const spectrumPreviewData = useMemo(() => {
    if (!parsedCsv || !parsedCsv.columns[selectedColumnIndex]) return [];
    const col = parsedCsv.columns[selectedColumnIndex];
    const fs = parsedCsv.detectedSamplingRate || 12000;
    return computePowerSpectrum(col.data, fs, 500);
  }, [parsedCsv, selectedColumnIndex]);

  // Overall condition calculations
  const isHealthy = diagnosisResult?.fault_type === 'Normal';
  const faultColor = isHealthy ? '#10d9a0' : (diagnosisResult?.severity === 'Severe' ? '#ef4444' : '#f59e0b');
  const healthScore = isHealthy ? 96 : Math.max(12, Math.round(100 - (diagnosisResult?.prediction_probability || 0.85) * 85));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1260, margin: '0 auto', width: '100%', paddingBottom: 80 }}>
      
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MAXIMALIST TOP SCADA CONTROL ROOM STATUS RIBBON                           */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #090e1a 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '16px 22px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow corner effects */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Top Ticker Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 217, 160, 0.15)',
                border: '1px solid rgba(16, 217, 160, 0.4)',
                color: '#10d9a0',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10d9a0', boxShadow: '0 0 8px #10d9a0' }} />
              SCADA ONLINE
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Workshop Floor Bay Continuous Condition Monitoring
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            <div>GRID SYNC: <strong style={{ color: '#38bdf8' }}>50.0 Hz</strong></div>
            <div>MOTOR POLES: <strong style={{ color: '#38bdf8' }}>4-Pole AC</strong></div>
            <div>STANDARDS: <strong style={{ color: '#818cf8' }}>ISO 10816-3 Class II</strong></div>
          </div>
        </div>

        {/* Stepper Pipeline Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #f0f6ff 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dual-Bearing Vibration Diagnostics Console
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              High-frequency impact envelope demodulation & neural fault classification
            </div>
          </div>

          {/* Stepper Pills with Active Glow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: isStep1Confirmed ? 'rgba(16, 217, 160, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: isStep1Confirmed ? '#10d9a0' : '#38bdf8',
                border: `1px solid ${isStep1Confirmed ? 'rgba(16, 217, 160, 0.4)' : '#38bdf8'}`,
                boxShadow: isStep1Confirmed ? '0 0 10px rgba(16, 217, 160, 0.2)' : '0 0 10px rgba(56, 189, 248, 0.2)'
              }}
            >
              {isStep1Confirmed ? <CheckCircle2 size={14} /> : <span>01</span>}
              <span>Machine Asset</span>
            </div>

            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: isStep2Done ? 'rgba(16, 217, 160, 0.15)' : isStep1Confirmed ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                color: isStep2Done ? '#10d9a0' : isStep1Confirmed ? '#38bdf8' : 'var(--text-muted)',
                border: `1px solid ${isStep2Done ? 'rgba(16, 217, 160, 0.4)' : isStep1Confirmed ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`
              }}
            >
              {isStep2Done ? <CheckCircle2 size={14} /> : isStep1Confirmed ? <span>02</span> : <Lock size={12} />}
              <span>CSV Ingestion</span>
            </div>

            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: isStep2Done ? 'rgba(16, 217, 160, 0.15)' : 'rgba(255,255,255,0.03)',
                color: isStep2Done ? '#10d9a0' : 'var(--text-muted)',
                border: `1px solid ${isStep2Done ? 'rgba(16, 217, 160, 0.4)' : 'rgba(255,255,255,0.08)'}`
              }}
            >
              {isStep2Done ? <CheckCircle2 size={14} /> : <Lock size={12} />}
              <span>Diagnostic Bar Graphs</span>
            </div>

            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
                background: dispatchSuccess ? 'rgba(16, 217, 160, 0.15)' : isStep2Done ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                color: dispatchSuccess ? '#10d9a0' : isStep2Done ? '#38bdf8' : 'var(--text-muted)',
                border: `1px solid ${dispatchSuccess ? 'rgba(16, 217, 160, 0.4)' : isStep2Done ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`
              }}
            >
              {dispatchSuccess ? <CheckCircle2 size={14} /> : <span>04</span>}
              <span>Work Order Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: SELECT OR ADD MACHINE ASSET                                       */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <section
        id="step-1-section"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: isStep1Confirmed ? '2px solid rgba(16, 217, 160, 0.6)' : '2px solid #38bdf8',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        {/* Step 1 Header */}
        <div
          style={{
            padding: '18px 24px',
            background: isStep1Confirmed ? 'rgba(16, 217, 160, 0.08)' : 'var(--bg-surface-raised)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: isStep1Confirmed ? '#10d9a0' : '#38bdf8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: isStep1Confirmed ? '0 0 12px rgba(16, 217, 160, 0.4)' : '0 0 12px rgba(56, 189, 248, 0.4)'
              }}
            >
              {isStep1Confirmed ? <CheckCircle2 size={20} /> : '01'}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Step 1: Machinery Asset Selection & Bearing Specifications
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Target motor mechanical parameters, load zone, and bearing housing model numbers
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isStep1Confirmed && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#10d9a0',
                  background: 'rgba(16, 217, 160, 0.12)',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(16, 217, 160, 0.4)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                CONFIGURED: {selectedMachine?.name}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsStep1Confirmed(false)}
              style={{
                fontSize: 12,
                color: '#38bdf8',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: isStep1Confirmed ? 'inline-block' : 'none'
              }}
            >
              Change Machinery
            </button>
          </div>
        </div>

        {/* Step 1 Body */}
        <div style={{ padding: '24px' }}>
          
          {/* Sub-mode switcher */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
            <button
              type="button"
              id="tab-choose-machine"
              onClick={() => setMachineMode('select')}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: machineMode === 'select' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                background: machineMode === 'select' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface-raised)',
                color: machineMode === 'select' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: machineMode === 'select' ? '0 0 16px rgba(56, 189, 248, 0.2)' : 'none'
              }}
            >
              <Cpu size={20} />
              <span>Choose Enrolled Machine ({machines.length})</span>
            </button>

            <button
              type="button"
              id="tab-add-machine"
              onClick={() => setMachineMode('add')}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: machineMode === 'add' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                background: machineMode === 'add' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface-raised)',
                color: machineMode === 'add' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: machineMode === 'add' ? '0 0 16px rgba(56, 189, 248, 0.2)' : 'none'
              }}
            >
              <Plus size={20} />
              <span>+ Register New Workshop Machine</span>
            </button>
          </div>

          {/* Mode A: Enrolled Machine Grid with Detailed Mechanical Badges */}
          {machineMode === 'select' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: 18,
                  marginBottom: 20
                }}
              >
                {machines.map((m) => {
                  const isSelected = String(m.id) === String(selectedMachineId);
                  return (
                    <div
                      key={m.id}
                      id={`machine-card-${m.id}`}
                      onClick={() => setSelectedMachineId(String(m.id))}
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(13, 21, 37, 0.9) 100%)' : 'var(--bg-surface-raised)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25), 0 4px 16px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '3px 9px',
                            borderRadius: 4,
                            background: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                            color: isSelected ? '#060b14' : 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {m.machine_type || m.type || 'Induction Motor'}
                        </span>
                        {isSelected && (
                          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800 }}>
                            <CheckCircle2 size={16} /> ACTIVE ASSET
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {m.name}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                        📍 {m.location || 'Bay 1 - Induction Motor Stand'}
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Rated Speed:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>1772 RPM (2 HP)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Drive End (DE):</span>
                          <strong style={{ color: '#38bdf8' }}>SKF 6205-2RS JEM</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Fan End (FE):</span>
                          <strong style={{ color: '#818cf8' }}>SKF 6203 Deep Groove</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode B: Add New Machine Form */}
          {machineMode === 'add' && (
            <form
              onSubmit={handleCreateMachine}
              style={{
                background: 'var(--bg-surface-raised)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: 20
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 0, marginBottom: 16, color: '#38bdf8' }}>
                Register Machinery Baseline Specs
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Machine Name / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Induction Motor - Test Stand 3"
                    value={newMachineForm.name}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Equipment Category
                  </label>
                  <select
                    value={newMachineForm.type}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                  >
                    <option value="Induction Motor">Induction Motor (Dual Bearing)</option>
                    <option value="Centrifugal Pump">Centrifugal Pump</option>
                    <option value="CNC Lathe Spindle">CNC Lathe Spindle</option>
                    <option value="Air Compressor">Air Compressor</option>
                    <option value="Gearbox Shaft">Gearbox Input Shaft</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Workshop Bay / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bay 2 - Machining Line"
                    value={newMachineForm.location}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setMachineMode('select')}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMachine}
                  style={{
                    padding: '11px 22px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: isAddingMachine ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  {isAddingMachine ? <RefreshCw size={16} className="spin" /> : <Plus size={16} />}
                  <span>Save Machine & Continue</span>
                </button>
              </div>
            </form>
          )}

          {/* Confirm Machine Button */}
          <div
            style={{
              paddingTop: 18,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Selected Target: <strong style={{ color: 'var(--text-primary)' }}>{selectedMachine?.name || 'None'}</strong> ({selectedMachine?.location || 'Floor Bay'})
            </div>
            <button
              type="button"
              id="btn-confirm-step1"
              onClick={handleConfirmStep1}
              style={{
                padding: '14px 28px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
              }}
            >
              <span>Confirm Machine & Unlock CSV Ingestion (Step 2)</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: CSV TELEMETRY & INTERACTIVE MOTOR SCHEMATIC                      */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <section
        id="step-2-section"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: isStep2Done
            ? '2px solid rgba(16, 217, 160, 0.6)'
            : isStep1Confirmed
            ? '2px solid #38bdf8'
            : '1px solid var(--border-subtle)',
          overflow: 'hidden',
          opacity: isStep1Confirmed ? 1 : 0.65,
          pointerEvents: isStep1Confirmed ? 'auto' : 'none',
          transition: 'all 0.25s ease',
          boxShadow: isStep1Confirmed ? '0 8px 32px rgba(0,0,0,0.4)' : 'none'
        }}
      >
        {/* Step 2 Header */}
        <div
          style={{
            padding: '18px 24px',
            background: isStep2Done ? 'rgba(16, 217, 160, 0.08)' : 'var(--bg-surface-raised)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: isStep2Done ? '#10d9a0' : isStep1Confirmed ? '#38bdf8' : 'var(--text-muted)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: isStep2Done ? '0 0 12px rgba(16, 217, 160, 0.4)' : '0 0 12px rgba(56, 189, 248, 0.4)'
              }}
            >
              {isStep2Done ? <CheckCircle2 size={20} /> : isStep1Confirmed ? '02' : <Lock size={16} />}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Step 2: CSV Vibration Telemetry & Interactive Induction Motor Cutaway
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Click bearing nodes on the motor cutaway diagram, ingest 12k/48k accelerometer time-series & inspect spectrum
              </span>
            </div>
          </div>

          {!isStep1Confirmed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
              <Lock size={14} /> Complete Step 1 First
            </div>
          )}
        </div>

        {/* Step 2 Body */}
        <div style={{ padding: '24px' }}>
          
          {/* ── Interactive Induction Motor Cutaway Schematic (SVG) ── */}
          <div
            style={{
              background: 'linear-gradient(180deg, #0b1120 0%, #060a12 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              padding: '20px',
              marginBottom: 24,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                  // INTERACTIVE MECHANICAL SCHEMATIC
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                  3-Phase Induction Motor Bearing Sensor Locations
                </h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Target: <span style={{ color: '#10d9a0', fontWeight: 800 }}>{bearingLocation}</span>
              </div>
            </div>

            {/* SVG Motor Cutaway */}
            <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 760 200" style={{ width: '100%', height: '100%', maxHeight: 180 }}>
                {/* Motor Stator Outer Casing with Fins */}
                <rect x="170" y="30" width="420" height="140" rx="10" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                {/* Cooling Fins */}
                {[...Array(14)].map((_, i) => (
                  <line key={i} x1={200 + i * 28} y1="20" x2={200 + i * 28} y2="30" stroke="#64748b" strokeWidth="3" />
                ))}

                {/* Stator Internal Windings (Laminated Core) */}
                <rect x="240" y="45" width="280" height="110" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <text x="380" y="105" textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800" fontFamily="var(--font-mono)">
                  ROTOR CORE & STATOR WINDINGS (1772 RPM)
                </text>

                {/* Central Rotating Shaft */}
                <rect x="30" y="88" width="700" height="24" rx="3" fill="url(#shaftGrad)" stroke="#94a3b8" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="shaftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="50%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                </defs>

                {/* Cooling Fan at Left (Fan End) */}
                <path d="M 120 40 L 150 55 L 150 145 L 120 160 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                <text x="135" y="185" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">COOLING FAN</text>

                {/* Output Coupling Hub at Right (Drive End) */}
                <rect x="640" y="70" width="70" height="60" rx="4" fill="#334155" stroke="#64748b" strokeWidth="2" />
                <text x="675" y="150" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="var(--font-mono)">OUTPUT SHAFT</text>

                {/* ── FAN END (FE) BEARING NODE ── */}
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={() => setBearingLocation('Fan End (FE)')}
                >
                  <rect
                    x="150"
                    y="65"
                    width="40"
                    height="70"
                    rx="6"
                    fill={bearingLocation === 'Fan End (FE)' ? 'rgba(129, 140, 248, 0.4)' : '#1e293b'}
                    stroke={bearingLocation === 'Fan End (FE)' ? '#818cf8' : '#64748b'}
                    strokeWidth={bearingLocation === 'Fan End (FE)' ? 3 : 1.5}
                  />
                  <circle cx="170" cy="100" r="10" fill={bearingLocation === 'Fan End (FE)' ? '#818cf8' : '#475569'} />
                  <text x="170" y="55" textAnchor="middle" fill={bearingLocation === 'Fan End (FE)' ? '#818cf8' : '#94a3b8'} fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
                    FE BEARING (SKF 6203)
                  </text>
                  {bearingLocation === 'Fan End (FE)' && (
                    <circle cx="170" cy="100" r="18" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 2">
                      <animateTransform attributeName="transform" type="rotate" from="0 170 100" to="360 170 100" dur="4s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>

                {/* ── DRIVE END (DE) BEARING NODE ── */}
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={() => setBearingLocation('Drive End (DE)')}
                >
                  <rect
                    x="570"
                    y="60"
                    width="45"
                    height="80"
                    rx="6"
                    fill={bearingLocation === 'Drive End (DE)' ? 'rgba(56, 189, 248, 0.4)' : '#1e293b'}
                    stroke={bearingLocation === 'Drive End (DE)' ? '#38bdf8' : '#64748b'}
                    strokeWidth={bearingLocation === 'Drive End (DE)' ? 3 : 1.5}
                  />
                  <circle cx="592" cy="100" r="12" fill={bearingLocation === 'Drive End (DE)' ? '#38bdf8' : '#475569'} />
                  <text x="592" y="50" textAnchor="middle" fill={bearingLocation === 'Drive End (DE)' ? '#38bdf8' : '#94a3b8'} fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">
                    DE BEARING (SKF 6205) [ACTIVE]
                  </text>
                  {bearingLocation === 'Drive End (DE)' && (
                    <circle cx="592" cy="100" r="22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2">
                      <animateTransform attributeName="transform" type="rotate" from="0 592 100" to="360 592 100" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              </svg>
            </div>

            {/* Quick Toggle Buttons below cutaway */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10 }}>
              <button
                type="button"
                id="btn-select-de"
                onClick={() => setBearingLocation('Drive End (DE)')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: bearingLocation === 'Drive End (DE)' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                  background: bearingLocation === 'Drive End (DE)' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: bearingLocation === 'Drive End (DE)' ? '#38bdf8' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Crosshair size={14} />
                <span>Drive End (DE) — SKF 6205 [Coupling Load]</span>
              </button>

              <button
                type="button"
                id="btn-select-fe"
                onClick={() => setBearingLocation('Fan End (FE)')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: bearingLocation === 'Fan End (FE)' ? '2px solid #818cf8' : '1px solid var(--border-subtle)',
                  background: bearingLocation === 'Fan End (FE)' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                  color: bearingLocation === 'Fan End (FE)' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Crosshair size={14} />
                <span>Fan End (FE) — SKF 6203 [Cooling Shroud]</span>
              </button>
            </div>
          </div>

          {/* ── CSV Upload Dropzone & Benchmark Loader ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Ingest Vibration Telemetry CSV Data:
              </label>
              <button
                type="button"
                id="btn-load-sample"
                onClick={handleLoadSampleDataset}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
                }}
              >
                <Zap size={14} />
                <span>Load Benchmark CWRU 12kHz Inner Race CSV</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            <div
              id="csv-dropzone"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #38bdf8' : '2px dashed rgba(56, 189, 248, 0.3)',
                background: isDragging ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-lg)',
                padding: '38px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)'
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: parsedCsv ? 'rgba(16, 217, 160, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  color: parsedCsv ? '#10d9a0' : '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: parsedCsv ? '0 0 20px rgba(16, 217, 160, 0.4)' : '0 0 20px rgba(56, 189, 248, 0.3)'
                }}
              >
                {parsedCsv ? <CheckCircle2 size={32} /> : <Upload size={32} />}
              </div>

              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {parsedCsv ? `Loaded File: ${sourceFilename}` : 'Click to Browse or Drag & Drop Vibration CSV File'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto' }}>
                Auto-parser filters out row index counters (<code>Sample_No</code>, <code>Time_s</code>) and extracts acceleration amplitude (<code>Vibration_Acceleration_g</code>).
              </div>
            </div>
          </div>

          {/* ── Telemetry Matrix & Dual Charts (Waveform + Frequency Spectrum) ── */}
          {parsedCsv && (
            <div
              style={{
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                border: '1px solid var(--border-subtle)',
                marginBottom: 22
              }}
            >
              {/* Density Metrics Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
                <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Sampling Rate</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {parsedCsv.detectedSamplingRate ? `${parsedCsv.detectedSamplingRate.toLocaleString()} Hz` : '12,000 Hz'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Channel</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {parsedCsv.columns[selectedColumnIndex]?.columnName || 'Vibration_g'}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Buffer Points</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {parsedCsv.totalDataPoints.toLocaleString()} pts
                  </span>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>DC Offset Drift</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#10d9a0', fontFamily: 'var(--font-mono)' }}>
                    Zeroed (0.000 g)
                  </span>
                </div>

                {parsedCsv.detectedDefectSize && (
                  <div style={{ background: 'var(--bg-base)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Continuous Defect</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#fb923c', fontFamily: 'var(--font-mono)' }}>
                      {parsedCsv.detectedDefectSize}" ({Math.round(parsedCsv.detectedDefectSize * 25.4 * 1000) / 1000} mm)
                    </span>
                  </div>
                )}
              </div>

              {/* Chart Mode Tabs: Waveform vs Frequency Spectrum */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('waveform')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeChartTab === 'waveform' ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                      color: activeChartTab === 'waveform' ? '#060b14' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Time-Domain Waveform (g)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab('spectrum')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeChartTab === 'spectrum' ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                      color: activeChartTab === 'spectrum' ? '#060b14' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Frequency Spectrum FFT (Hz)
                  </button>
                </div>

                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {activeChartTab === 'waveform' ? '150-sample telemetry envelope' : 'Spectral peaks: BPFI ~162.2 Hz | 2X ~324 Hz'}
                </span>
              </div>

              {/* Interactive Telemetry Chart */}
              <div style={{ width: '100%', height: 180, background: 'var(--bg-base)', borderRadius: 8, padding: '10px 0', border: '1px solid rgba(255,255,255,0.04)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'waveform' ? (
                    <LineChart data={waveformPreviewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="g" />
                      <Tooltip
                        contentStyle={{ background: '#0d1525', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val) => [`${val} g`, 'Acceleration']}
                      />
                      <Line type="monotone" dataKey="val" stroke="#38bdf8" dot={false} strokeWidth={2} isAnimationActive={false} />
                    </LineChart>
                  ) : (
                    <AreaChart data={spectrumPreviewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="freq" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="Hz" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip
                        contentStyle={{ background: '#0d1525', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val) => [`${val}`, 'Amplitude']}
                      />
                      <Area type="monotone" dataKey="magnitude" stroke="#818cf8" fill="rgba(129, 140, 248, 0.25)" isAnimationActive={false} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Action Button: Execute AI Diagnosis */}
          <div
            style={{
              paddingTop: 18,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Target: <strong style={{ color: '#38bdf8' }}>{bearingLocation}</strong> on <strong style={{ color: 'var(--text-primary)' }}>{selectedMachine?.name}</strong>
            </div>

            <button
              type="button"
              id="btn-execute-diagnosis"
              disabled={!parsedCsv || isAnalyzing}
              onClick={handleRunDiagnosis}
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius-md)',
                background: parsedCsv ? 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)' : 'var(--bg-surface-raised)',
                color: parsedCsv ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                fontWeight: 900,
                fontSize: 15,
                cursor: parsedCsv && !isAnalyzing ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: parsedCsv ? '0 0 24px rgba(56, 189, 248, 0.4)' : 'none'
              }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={20} className="spin" />
                  <span>Computing Harmonic Envelopes...</span>
                </>
              ) : (
                <>
                  <Activity size={20} />
                  <span>Execute Industrial AI Diagnosis (Step 3)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: DIAGNOSTIC AUDIT & BAR GRAPHS (ON SAME PAGE)                     */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <section
        id="step-3-section"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: isStep2Done ? `2px solid ${faultColor}` : '1px solid var(--border-subtle)',
          overflow: 'hidden',
          opacity: isStep2Done ? 1 : 0.65,
          pointerEvents: isStep2Done ? 'auto' : 'none',
          transition: 'all 0.25s ease',
          boxShadow: isStep2Done ? `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${faultColor}22` : 'none'
        }}
      >
        {/* Step 3 Header */}
        <div
          style={{
            padding: '18px 24px',
            background: isStep2Done ? (isHealthy ? 'rgba(16, 217, 160, 0.08)' : 'rgba(239, 68, 68, 0.08)') : 'var(--bg-surface-raised)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: isStep2Done ? faultColor : 'var(--text-muted)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: isStep2Done ? `0 0 14px ${faultColor}66` : 'none'
              }}
            >
              {isStep2Done ? (isHealthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />) : <Lock size={16} />}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                Step 3: Machine Health Assessment & Vibration Severity (Bar Graphs)
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Simple, readable fault probability distribution & ISO 10816-3 mechanical severity zones
              </span>
            </div>
          </div>

          {!isStep2Done && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
              <Lock size={14} /> Complete Step 2 First
            </div>
          )}
        </div>

        {/* Step 3 Body */}
        {diagnosisResult && (
          <div style={{ padding: '24px' }}>
            
            {/* ── Status Hero Banner with Acoustic Sound Player ── */}
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                background: isHealthy ? 'rgba(16, 217, 160, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `2px solid ${faultColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
                marginBottom: 24,
                boxShadow: `0 0 24px ${faultColor}22`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: faultColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${faultColor}88`
                  }}
                >
                  {isHealthy ? <CheckCircle2 size={36} /> : <AlertTriangle size={36} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: faultColor }}>
                    {isHealthy ? 'System Health Normal' : `${diagnosisResult.severity.toUpperCase()} FAULT DETECTED`}
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                    {diagnosisResult.fault_type === 'Inner Race'
                      ? 'Inner Race Fault (BPFI Harmonic Impact Pattern)'
                      : diagnosisResult.fault_type === 'Ball'
                      ? 'Ball Bearing Element Fault (BSF Impact)'
                      : diagnosisResult.fault_type === 'Outer Race'
                      ? 'Outer Race Fault (BPFO Impact)'
                      : 'Healthy Operation (Baseline Dynamic Balance)'}
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Asset: <strong>{selectedMachine?.name}</strong> • Bearing Housing: <strong>{bearingLocation}</strong>
                  </div>
                </div>
              </div>

              {/* Confidence Score & Audio Signature Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    background: faultColor,
                    color: '#060b14',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: `0 0 16px ${faultColor}66`
                  }}
                >
                  {(diagnosisResult.prediction_probability * 100).toFixed(1)}% AI Confidence
                </div>

                {/* Acoustic Sound Player Button */}
                <button
                  type="button"
                  id="btn-play-sound"
                  onClick={handlePlayAudio}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: audioPlaying ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                    color: audioPlaying ? '#060b14' : 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {audioPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{audioPlaying ? 'Synthesizing Knocking...' : '▶ Listen to Bearing Acoustic Sound'}</span>
                </button>
              </div>
            </div>

            {/* ── TWO PROMINENT BAR CHARTS (RECHARTS) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
              
              {/* Bar Chart 1: Fault Probability Distribution */}
              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Fault Probability Distribution (Bar Chart)
                    </h4>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Neural classification across mechanical defect modes
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 800 }}>
                    100% Total
                  </span>
                </div>

                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={diagnosisResult.probabilities || [
                        { name: 'Normal', value: isHealthy ? 95 : 4, fill: '#10d9a0' },
                        { name: 'Inner Race', value: diagnosisResult.fault_type === 'Inner Race' ? 84 : 4, fill: '#38bdf8' },
                        { name: 'Ball Fault', value: diagnosisResult.fault_type === 'Ball' ? 85 : 3, fill: '#fbbf24' },
                        { name: 'Outer Race', value: diagnosisResult.fault_type === 'Outer Race' ? 85 : 3, fill: '#f43f5e' }
                      ]}
                      margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{ background: '#0d1525', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val) => [`${val}%`, 'Likelihood']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {(diagnosisResult.probabilities || []).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill || '#38bdf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart 2: ISO 10816-3 Vibration Severity Scale */}
              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                      ISO 10816-3 Vibration Severity (Bar Chart)
                    </h4>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Standardized mechanical velocity / acceleration limits
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 4,
                      background: faultColor,
                      color: '#060b14',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    RMS: {diagnosisResult.features?.rms || '0.24'} g
                  </span>
                </div>

                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={diagnosisResult.iso_levels || [
                        { name: 'Zone A', limit: 0.12, fill: '#10d9a0' },
                        { name: 'Zone B', limit: 0.22, fill: '#38bdf8' },
                        { name: 'Zone C', limit: 0.45, fill: '#fbbf24' },
                        { name: 'Zone D', limit: 0.70, fill: '#ef4444' }
                      ]}
                      margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 0.8]} unit="g" />
                      <Tooltip
                        contentStyle={{ background: '#0d1525', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, fontSize: 12 }}
                        formatter={(val) => [`${val} g`, 'Severity Threshold']}
                      />
                      <Bar dataKey="limit" radius={[8, 8, 0, 0]}>
                        {(diagnosisResult.iso_levels || []).map((entry, idx) => (
                          <Cell key={`cell-iso-${idx}`} fill={entry.fill || '#38bdf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── Mechanical Workshop Recommendations ── */}
            <div
              style={{
                background: 'var(--bg-surface-raised)',
                borderRadius: 'var(--radius-md)',
                padding: '22px',
                border: '1px solid var(--border-subtle)',
                marginBottom: 24
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Wrench size={20} style={{ color: '#38bdf8' }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Practical Maintenance Directives for Workshop Mechanics:
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    DEFECT CHARACTERISTICS
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {diagnosisResult.fault_type === 'Inner Race'
                      ? 'Ball Pass Frequency Inner Race (BPFI ~162.2 Hz) harmonics identified. Sharp acceleration spikes indicate localized micro-spalling on the rotating inner ring track.'
                      : diagnosisResult.fault_type === 'Outer Race'
                      ? 'Periodic impacts matching stationary outer ring defect (BPFO ~107.5 Hz). High radial vibration transferred to machine housing.'
                      : diagnosisResult.fault_type === 'Ball'
                      ? 'Ball spin frequency (BSF ~141.2 Hz) detected. Rolling balls display surface pitting or severe grease contamination.'
                      : 'Baseline smooth operation. Hydrodynamic lubrication barrier intact with minimal friction losses.'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    WORKSHOP ACTION REQUIRED
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {diagnosisResult.recommendation ||
                      'Schedule bearing overhaul and grease relubrication within recommended maintenance window.'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    TARGET INTERVENTION TIMELINE
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: faultColor, lineHeight: 1.5 }}>
                    {diagnosisResult.urgency || (isHealthy ? 'Routine 90-Day Inspection' : 'Intervene within 7 Days')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Prevent catastrophic rotor imbalance and thermal shaft seizure.
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════════ */}
            {/* STEP 4: AUDIT REPORTING & MAINTENANCE DISPATCH (BOTTOM OF SAME PAGE)      */}
            {/* ═════════════════════════════════════════════════════════════════════════ */}
            <div
              style={{
                paddingTop: 24,
                borderTop: '2px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900 }}>
                  Step 4: Executive Audit Reporting & Corrective Dispatch
                </h4>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Download official stamped engineering audit PDF or dispatch task directly to workshop schedule
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="btn-download-pdf"
                  onClick={handleDownloadPdf}
                  style={{
                    padding: '13px 22px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid #38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={18} />
                  <span>Download Executive Audit PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-open-dispatch-modal"
                  onClick={() => setDispatchModalOpen(true)}
                  style={{
                    padding: '13px 26px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  <CalendarCheck size={18} />
                  <span>Dispatch Machine to Maintenance</span>
                </button>
              </div>
            </div>

            {/* Dispatch Success Confirmation Banner */}
            {dispatchSuccess && (
              <div
                style={{
                  marginTop: 22,
                  padding: '18px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 217, 160, 0.12)',
                  border: '1.5px solid rgba(16, 217, 160, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  boxShadow: '0 0 20px rgba(16, 217, 160, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <CheckCircle2 size={26} style={{ color: '#10d9a0' }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#10d9a0' }}>
                      Work Order Successfully Dispatched to Workshop Schedule!
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Maintenance task registered for {selectedMachine?.name} with assigned priority.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-view-in-schedule"
                  onClick={onSwitchToSchedule}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#10d9a0',
                    color: '#060b14',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 0 12px rgba(16, 217, 160, 0.4)'
                  }}
                >
                  <span>View in Maintenance Schedule</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* DISPATCH WORK ORDER MODAL                                                */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {dispatchModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              width: '100%',
              maxWidth: 560,
              padding: '26px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: 'var(--text-primary)' }}>
                  Dispatch Corrective Maintenance Order
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Directly queue task into workshop maintenance log
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Machine Target
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedMachine?.name} (${selectedMachine?.location})`}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: 13
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Work Order Task Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={dispatchForm.task_type}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, task_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Priority Level
                    </label>
                    <select
                      value={dispatchForm.priority}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    >
                      <option value="Critical">Critical (Immediate Stop)</option>
                      <option value="High">High (Within 48 Hours)</option>
                      <option value="Medium">Medium (Scheduled Next Overhaul)</option>
                      <option value="Low">Low (Routine Checkup)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Scheduled Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={dispatchForm.due_date}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, due_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Assigned Lead Technician
                  </label>
                  <input
                    type="text"
                    value={dispatchForm.technician}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, technician: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Technical Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Inspect SKF 6205 inner race for micro-spalling. Replace grease pack with Mobil Polyrex EM."
                    value={dispatchForm.notes}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-dispatch-order"
                  style={{
                    padding: '11px 24px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
                  }}
                >
                  Confirm & Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

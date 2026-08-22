import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BearingStepper } from '../components/bearing/BearingStepper';
import { MachineSelector } from '../components/bearing/MachineSelector';
import { SignalUploadCard } from '../components/bearing/SignalUploadCard';
import { SignalPreviewCard } from '../components/bearing/SignalPreviewCard';
import { DemoSamplesDrawer } from '../components/bearing/DemoSamplesDrawer';
import { ProcessingPipeline, PIPELINE_STEPS } from '../components/bearing/ProcessingPipeline';
import { DiagnosisPanel } from '../components/bearing/DiagnosisPanel';
import { MultiWindowDistribution } from '../components/bearing/MultiWindowDistribution';
import { TechnicalAuditSection } from '../components/bearing/TechnicalAuditSection';
import { parseVibrationCSV } from '../utils/csvParser';
import { computeFFT } from '../utils/fft';
import { analyzeBearingSignal, fetchDemoSamples } from '../services/api';
import { RotateCcw, Activity, FileSpreadsheet } from 'lucide-react';

export function BearingAnalysis({ machines = [], showToast, preSelectedMachineId = null }) {
  // Machine Selection
  const [selectedMachineId, setSelectedMachineId] = useState(preSelectedMachineId || (machines[0]?.id || ''));

  // Signal State
  const [sourceFilename, setSourceFilename] = useState('');
  const [sourceType, setSourceType] = useState('csv'); // 'csv' | 'demo'
  const [parsedCsv, setParsedCsv] = useState(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(0);
  const [activeSignal, setActiveSignal] = useState(null);
  const [samplingRateHz, setSamplingRateHz] = useState(48000);
  const [signalUnit, setSignalUnit] = useState('g');

  // Demo Samples Modal
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);
  const [demoSamplesCache, setDemoSamplesCache] = useState(null);

  // Workflow State & Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [useClassicalML, setUseClassicalML] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineStepIndex, setPipelineStepIndex] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  // Update selected machine if prop changes or machine list loads
  useEffect(() => {
    if (preSelectedMachineId) {
      setSelectedMachineId(preSelectedMachineId);
    } else if (!selectedMachineId && machines.length > 0) {
      setSelectedMachineId(machines[0].id);
    }
  }, [preSelectedMachineId, machines, selectedMachineId]);

  // Pre-load demo samples catalog
  useEffect(() => {
    fetchDemoSamples()
      .then(res => {
        if (res.success) setDemoSamplesCache(res.samples);
      })
      .catch(() => {});
  }, []);

  // Compute FFT spectrum for active signal (first 1024 points)
  const spectrumData = useMemo(() => {
    if (!activeSignal || activeSignal.length === 0) return [];
    return computeFFT(activeSignal.slice(0, 1024), samplingRateHz);
  }, [activeSignal, samplingRateHz]);

  // Handle CSV file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name;
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const parsed = parseVibrationCSV(text);

        setParsedCsv(parsed);
        setSourceFilename(filename);
        setSourceType('csv');
        setSelectedColumnIndex(parsed.defaultColumn.columnIndex);
        setActiveSignal(parsed.defaultColumn.data);
        setDiagnosisResult(null);
        setCurrentStep(2); // Progress to preview step

        showToast(
          `Successfully loaded ${parsed.defaultColumn.sampleCount.toLocaleString()} samples from ${filename}`,
          'success'
        );
      } catch (err) {
        showToast(err.message || 'Failed to parse CSV file', 'error');
      }
    };

    reader.readAsText(file);
  }, [showToast]);

  // Handle Column selection change if CSV contains multiple channels
  const handleColumnChange = useCallback((colIdx) => {
    setSelectedColumnIndex(colIdx);
    if (parsedCsv) {
      const col = parsedCsv.columns.find(c => c.columnIndex === colIdx);
      if (col) {
        setActiveSignal(col.data);
        setDiagnosisResult(null);
        setCurrentStep(2);
      }
    }
  }, [parsedCsv]);

  // Load a curated CWRU Demo Sample
  const handleLoadDemo = useCallback((faultKey) => {
    if (!demoSamplesCache || !demoSamplesCache[faultKey]) {
      showToast('Demo sample not found in catalog.', 'error');
      return;
    }

    const sample = demoSamplesCache[faultKey];
    if (!sample.signal || sample.signal.length === 0) {
      showToast('Backend ML service is required for demo telemetry.', 'error');
      return;
    }

    setParsedCsv(null);
    setActiveSignal(sample.signal);
    setSamplingRateHz(sample.sampling_rate_hz || 48000);
    setSignalUnit(sample.signal_unit || 'g');
    setSourceFilename(`cwru_benchmark_${faultKey.toLowerCase()}.csv`);
    setSourceType('demo');
    setDiagnosisResult(null);
    setCurrentStep(2); // Move to Preview

    showToast(`Loaded CWRU Demonstration Sample (${faultKey})`, 'info');
  }, [demoSamplesCache, showToast]);

  // Clear current signal
  const handleClearSignal = useCallback(() => {
    setParsedCsv(null);
    setActiveSignal(null);
    setSourceFilename('');
    setSourceType('csv');
    setDiagnosisResult(null);
    setCurrentStep(1);
  }, []);

  // Execute Bearing Analysis Pipeline
  const handleAnalyze = async () => {
    if (!activeSignal || activeSignal.length < 1024) {
      showToast('At least 1024 vibration samples are required for neural inference.', 'error');
      return;
    }

    setAnalyzing(true);
    setPipelineStepIndex(0);
    setDiagnosisResult(null);

    // Realistic progressive pipeline timer
    const stepInterval = setInterval(() => {
      setPipelineStepIndex(prev => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 220);

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
        setCurrentStep(3); // Move to Diagnosis step
        showToast('Bearing diagnostic analysis completed successfully!', 'success');
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

  const selectedMachine = machines.find(m => String(m.id) === String(selectedMachineId));
  const sampleCount = activeSignal ? activeSignal.length : 0;
  const canGoToStep2 = sampleCount >= 1024;
  const canGoToStep3 = !!diagnosisResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      
      {/* ── Top Stepper ── */}
      <BearingStepper
        currentStep={currentStep}
        setStep={setCurrentStep}
        canGoToStep2={canGoToStep2}
        canGoToStep3={canGoToStep3}
      />

      {/* ── 2-Column Bearing Analysis Workspace ── */}
      <div
        className="bearing-workspace-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 20,
          alignItems: 'start'
        }}
      >
        {/* ── LEFT COLUMN: Equipment Config + Signal Ingestion ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Machine Selection Card */}
          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <MachineSelector
              machines={machines}
              selectedMachineId={selectedMachineId}
              onSelectMachine={setSelectedMachineId}
            />
          </div>

          {/* CSV File Drag & Drop Ingestion Card */}
          <SignalUploadCard
            sourceFilename={sourceFilename}
            sourceType={sourceType}
            sampleCount={sampleCount}
            parsedCsv={parsedCsv}
            selectedColumnIndex={selectedColumnIndex}
            onColumnChange={handleColumnChange}
            samplingRateHz={samplingRateHz}
            onSamplingRateChange={setSamplingRateHz}
            signalUnit={signalUnit}
            onSignalUnitChange={setSignalUnit}
            onFileUpload={handleFileUpload}
            onClearSignal={handleClearSignal}
            onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
          />
        </div>

        {/* ── RIGHT COLUMN: Telemetry Preview, Analysis & Diagnosis Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Active Processing Pipeline Animation (shown while analyzing) */}
          {analyzing && (
            <ProcessingPipeline currentStepIndex={pipelineStepIndex} />
          )}

          {/* Signal Telemetry Preview Card (Waveform + FFT + CTA) */}
          {!analyzing && (
            <SignalPreviewCard
              signal={activeSignal}
              samplingRateHz={samplingRateHz}
              signalUnit={signalUnit}
              sourceFilename={sourceFilename}
              sourceType={sourceType}
              spectrumData={spectrumData}
              useClassicalML={useClassicalML}
              onModelChange={setUseClassicalML}
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
              onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
            />
          )}

          {/* Post-Inference Diagnosis & Recommendations */}
          {!analyzing && diagnosisResult && (
            <>
              {/* Strong Hero Diagnosis Panel */}
              <DiagnosisPanel
                diagnosisResult={diagnosisResult}
                selectedMachine={selectedMachine}
                onReset={handleClearSignal}
              />

              {/* Multi-Window Continuity Aggregation (if multi-window) */}
              <MultiWindowDistribution diagnosisResult={diagnosisResult} />

              {/* Expandable Technical Audit Section */}
              <TechnicalAuditSection diagnosisResult={diagnosisResult} />
            </>
          )}
        </div>
      </div>

      {/* ── Secondary Demo Samples Modal / Drawer ── */}
      <DemoSamplesDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        onLoadDemo={handleLoadDemo}
        activeFilename={sourceFilename}
      />
    </div>
  );
}

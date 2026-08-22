import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  Clock,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { WaveformChart } from '../WaveformChart';
import { SpectrumChart } from '../SpectrumChart';

export function SignalPreviewCard({
  signal,
  samplingRateHz,
  signalUnit,
  sourceFilename,
  sourceType,
  spectrumData,
  useClassicalML,
  onModelChange,
  onAnalyze,
  analyzing,
  onOpenDemoDrawer
}) {
  const [activeTab, setActiveTab] = useState('waveform'); // 'waveform' | 'spectrum'

  const sampleCount = signal ? signal.length : 0;
  const isSignalReady = sampleCount >= 1024;
  const windowCount = Math.floor(sampleCount / 1024);
  const remainderSamples = sampleCount % 1024;

  // Signal duration calculation
  const durationSec = samplingRateHz && samplingRateHz > 0
    ? (sampleCount / samplingRateHz).toFixed(3)
    : null;

  // Nyquist limit
  const nyquistKhz = samplingRateHz && samplingRateHz > 0
    ? (samplingRateHz / 2000).toFixed(1)
    : null;

  if (!signal || signal.length === 0) {
    return (
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center',
          padding: '40px 24px',
          background: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: 16
          }}
        >
          <Activity size={30} />
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          No Signal Telemetry Loaded
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 380, marginTop: 6, lineHeight: 1.5 }}>
          Upload a machine accelerometer CSV or load a CWRU benchmark test sample to visualize time-domain waveforms and frequency spectra.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="button"
            onClick={onOpenDemoDrawer}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            <Sparkles size={14} style={{ color: 'var(--status-mild)' }} />
            Try CWRU Demo Sample
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: 'var(--bg-surface)'
      }}
    >
      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              // TELEMETRY PREVIEW
            </span>
            {sourceType === 'demo' && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--status-mild-bg)',
                  color: 'var(--status-mild)',
                  border: '1px solid var(--status-mild-border)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                CWRU Demo
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: 2 }}>
            Signal Spectrum & Waveform
          </h3>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-sunken)',
            padding: 3,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('waveform')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'waveform' ? 'var(--bg-surface-raised)' : 'transparent',
              color: activeTab === 'waveform' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'waveform' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Activity size={14} />
            Waveform (Time)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spectrum')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'spectrum' ? 'var(--bg-surface-raised)' : 'transparent',
              color: activeTab === 'spectrum' ? 'var(--status-mild)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'spectrum' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={14} />
            FFT Spectrum (Freq)
          </button>
        </div>
      </div>

      {/* Telemetry Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            Total Samples
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isSignalReady ? 'var(--status-healthy)' : 'var(--status-severe)', marginTop: 2 }}>
            {sampleCount.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            1024-Pt Windows
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', marginTop: 2 }}>
            {windowCount} {windowCount === 1 ? 'window' : 'windows'}
          </div>
        </div>

        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            Duration
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
            {durationSec ? `${durationSec} s` : 'N/A'}
          </div>
        </div>

        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
            Nyquist Limit
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
            {nyquistKhz ? `${nyquistKhz} kHz` : 'Normalized'}
          </div>
        </div>
      </div>

      {/* Chart Display Area */}
      <div
        style={{
          background: 'var(--bg-surface-raised)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: activeTab === 'waveform' ? 'var(--accent-primary)' : 'var(--status-mild)', fontFamily: 'var(--font-mono)' }}>
            {activeTab === 'waveform' ? '// TIME DOMAIN ACCELERATION' : '// FREQUENCY SPECTRUM AMPLITUDE'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {activeTab === 'waveform' ? `Showing first 1024 samples (${signalUnit})` : `FFT Resolution: ${samplingRateHz ? `${(samplingRateHz / 1024).toFixed(1)} Hz/bin` : 'Bins'}`}
          </span>
        </div>

        {activeTab === 'waveform' ? (
          <WaveformChart signal={signal.slice(0, 1024)} unit={signalUnit} height={200} />
        ) : (
          <SpectrumChart spectrumData={spectrumData} samplingRateHz={samplingRateHz} height={200} />
        )}
      </div>

      {/* Analysis Control Footer Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        {/* Model Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Model Engine:
          </label>
          <select
            className="select-field"
            style={{ width: 210, padding: '7px 10px', fontSize: 12 }}
            value={useClassicalML ? 'rf' : 'cnn'}
            onChange={e => onModelChange(e.target.value === 'rf')}
          >
            <option value="cnn">1D Deep CNN (99.5% Acc · Recommended)</option>
            <option value="rf">Random Forest (89.9% Acc)</option>
          </select>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing || !isSignalReady}
          className="btn btn-primary"
          style={{
            padding: '11px 28px',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <Activity size={18} />
          <span>Analyze Bearing</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

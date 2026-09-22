import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet,
  Headphones,
  Sliders,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { WaveformChart } from '../WaveformChart';
import { SpectrumChart } from '../SpectrumChart';
import { AcousticStethoscope } from './AcousticStethoscope';
import { calculateFaultFrequencies } from '../../utils/bearingKinematics';

export function SignalPreviewCard({
  signal,
  samplingRateHz,
  signalUnit,
  sourceFilename,
  sourceType,
  spectrumData,
  onAnalyze,
  analyzing,
  onOpenDemoDrawer,
  onOpenSynthesizer
}) {
  const [activeTab, setActiveTab] = useState('waveform'); // 'waveform' | 'spectrum'

  // Interactive Oscilloscope Controls
  const [selectedWindowIdx, setSelectedWindowIdx] = useState(0);
  const [zoomSize, setZoomSize] = useState(1024); // 1024 | 256 | 64
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showRMSLine, setShowRMSLine] = useState(true);

  // Interactive Spectrum Harmonic Overlays
  const [spectrumOverlay, setSpectrumOverlay] = useState('all'); // 'all' | '1x' | 'bpfo' | 'bpfi' | 'bsf' | 'none'

  const sampleCount = signal ? signal.length : 0;
  const isSignalReady = sampleCount >= 1024;
  const totalWindows = Math.floor(sampleCount / 1024);

  // Calculate kinematics based on typical 1797 RPM
  const faultFreqs = useMemo(() => calculateFaultFrequencies(1797), []);

  // Compute active window offset
  const currentOffset = selectedWindowIdx * 1024;

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
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, marginTop: 6, lineHeight: 1.5 }}>
          Upload a machine accelerometer CSV, load a CWRU benchmark recording, or synthesize real-time bearing defect kinematics.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onOpenDemoDrawer}
            className="btn btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            <Sparkles size={14} style={{ color: 'var(--status-mild)' }} />
            Load CWRU Benchmark Sample
          </button>

          {onOpenSynthesizer && (
            <button
              type="button"
              onClick={onOpenSynthesizer}
              className="btn btn-primary"
              style={{ padding: '8px 16px' }}
            >
              <Sliders size={14} />
              Open Kinematic Synthesizer
            </button>
          )}
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
        gap: 16,
        background: 'var(--bg-surface)'
      }}
    >
      {/* Header & Main Mode Tabs */}
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
              // TELEMETRY OSCILLOSCOPE
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
                CWRU Benchmark
              </span>
            )}
            {sourceType === 'simulated' && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-border)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Kinematic Synthesis
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', marginTop: 2 }}>
            Signal Spectrum & Time-Domain Telemetry
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
            Oscilloscope (Time)
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

      {/* Multi-Window Scrubber Strip (Only if multiple windows) */}
      {totalWindows > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-sunken)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              WINDOW SCRUBBER:
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(8, totalWindows) }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedWindowIdx(idx)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: selectedWindowIdx === idx ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedWindowIdx === idx ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: selectedWindowIdx === idx ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)',
                    color: selectedWindowIdx === idx ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Win #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Showing samples [{currentOffset.toLocaleString()} – {(currentOffset + 1024).toLocaleString()}]
          </span>
        </div>
      )}

      {/* Interactive Toolbars for Oscilloscope / Spectrum */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: 'var(--bg-surface-sunken)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {activeTab === 'waveform' ? (
          /* Waveform Controls */
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Zoom presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                ZOOM:
              </span>
              {[
                { size: 1024, label: '1024 (Full)' },
                { size: 256, label: '256 (Zoom)' },
                { size: 64, label: '64 (Micro)' }
              ].map(z => (
                <button
                  key={z.size}
                  type="button"
                  onClick={() => setZoomSize(z.size)}
                  style={{
                    padding: '2px 6px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${zoomSize === z.size ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: zoomSize === z.size ? 'var(--accent-subtle)' : 'transparent',
                    color: zoomSize === z.size ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {z.label}
                </button>
              ))}
            </div>

            {/* Overlay Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowRMSLine(!showRMSLine)}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${showRMSLine ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: showRMSLine ? 'var(--accent-subtle)' : 'transparent',
                  color: showRMSLine ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showRMSLine ? '✓ RMS Line' : '+ RMS Line'}
              </button>

              <button
                type="button"
                onClick={() => setShowEnvelope(!showEnvelope)}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${showEnvelope ? 'var(--status-mild)' : 'var(--border-subtle)'}`,
                  background: showEnvelope ? 'var(--status-mild-bg)' : 'transparent',
                  color: showEnvelope ? 'var(--status-mild)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showEnvelope ? '✓ 3σ Envelope' : '+ 3σ Envelope'}
              </button>
            </div>
          </div>
        ) : (
          /* Spectrum Harmonic Overlay Controls */
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              KINEMATIC CURSORS:
            </span>
            {[
              { id: 'all', label: 'All Harmonics' },
              { id: '1x', label: '1X RPM (30Hz)' },
              { id: 'bpfo', label: 'BPFO (107Hz)' },
              { id: 'bpfi', label: 'BPFI (162Hz)' },
              { id: 'bsf', label: 'BSF (70Hz)' },
              { id: 'none', label: 'Clear' }
            ].map(cur => (
              <button
                key={cur.id}
                type="button"
                onClick={() => setSpectrumOverlay(cur.id === 'none' ? null : cur.id)}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${(spectrumOverlay === cur.id || (cur.id === 'none' && !spectrumOverlay)) ? 'var(--status-mild)' : 'var(--border-subtle)'}`,
                  background: (spectrumOverlay === cur.id || (cur.id === 'none' && !spectrumOverlay)) ? 'var(--status-mild-bg)' : 'transparent',
                  color: (spectrumOverlay === cur.id || (cur.id === 'none' && !spectrumOverlay)) ? 'var(--status-mild)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {cur.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {activeTab === 'waveform'
            ? `SAMPLE RATE: ${samplingRateHz ? (samplingRateHz / 1000).toFixed(0) : 48} kS/s`
            : `RESOLUTION: ${(48000 / 1024).toFixed(1)} Hz/bin`}
        </div>
      </div>

      {/* Chart Display Area */}
      <div
        style={{
          background: 'var(--bg-surface-raised)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {activeTab === 'waveform' ? (
          <WaveformChart
            signal={signal}
            offsetIndex={currentOffset}
            zoomWindow={zoomSize}
            unit={signalUnit}
            height={210}
            showEnvelope={showEnvelope}
            showRMSLine={showRMSLine}
          />
        ) : (
          <SpectrumChart
            spectrumData={spectrumData}
            samplingRateHz={samplingRateHz}
            height={210}
            activeOverlay={spectrumOverlay}
            faultFreqs={faultFreqs}
          />
        )}
      </div>

      {/* Acoustic Stethoscope Sonification Player */}
      <AcousticStethoscope signal={signal.slice(currentOffset, currentOffset + 1024)} />

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
        {/* Autonomous Model Selection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              background: 'var(--bg-surface-raised)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-primary)',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.15)'
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 8px var(--accent-primary)',
                animation: 'pulse 2s infinite'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  System Auto-Fit Inference: Active
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                Self-analyzes signal dynamics &amp; routes to optimal best-fit model
              </div>
            </div>
          </div>
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
          <span>Execute Neural Diagnosis</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

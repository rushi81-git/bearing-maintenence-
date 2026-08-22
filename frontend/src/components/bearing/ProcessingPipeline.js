import React from 'react';
import { RefreshCw, CheckCircle2, Cpu, Activity, Sparkles, ShieldCheck } from 'lucide-react';

export const PIPELINE_STEPS = [
  {
    id: 0,
    title: 'Signal Ingestion & DC Offset Filtering',
    description: 'De-meaning raw vibration series and validating sample continuity'
  },
  {
    id: 1,
    title: 'Continuity & Anomaly Verification',
    description: 'Checking NaN boundaries and evaluating SNR acceleration levels'
  },
  {
    id: 2,
    title: '1024-Point Universal Window Segmentation',
    description: 'Partitioning continuous waveform into standard diagnostic batches'
  },
  {
    id: 3,
    title: 'Time-Domain Feature Extraction',
    description: 'Computing RMS, Kurtosis, Crest Factor, Shape Factor, and Peak-to-Peak'
  },
  {
    id: 4,
    title: '1D Deep Convolutional Inference',
    description: 'Forward pass across multi-layer Conv1D kernels with BatchNorm'
  },
  {
    id: 5,
    title: 'Formulating Actionable Maintenance Recommendation',
    description: 'Mapping fault severity to urgency timelines and inspection rules'
  }
];

export function ProcessingPipeline({ currentStepIndex = 0 }) {
  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / PIPELINE_STEPS.length) * 100));

  return (
    <div
      className="card card-accent animate-fade-in"
      style={{
        padding: '28px 24px',
        background: 'var(--bg-surface)',
        borderColor: 'var(--accent-border)'
      }}
    >
      {/* Header with spinning indicator and progress percentage */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1.5s linear infinite'
            }}
          >
            <RefreshCw size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Executing Diagnostic Inference Pipeline
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              AI model is processing vibration accelerometer telemetry
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
            {progressPercent}%
          </span>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Step {currentStepIndex + 1} of {PIPELINE_STEPS.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'var(--bg-surface-sunken)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: 24
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.25s ease'
          }}
        />
      </div>

      {/* Multi-Step Pipeline List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}
      >
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;
          const isPending = currentStepIndex < idx;

          return (
            <div
              key={step.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: isCurrent
                  ? 'var(--accent-subtle)'
                  : isDone
                  ? 'rgba(16, 217, 160, 0.05)'
                  : 'var(--bg-surface-raised)',
                border: `1px solid ${
                  isCurrent
                    ? 'var(--accent-border)'
                    : isDone
                    ? 'var(--status-healthy-border)'
                    : 'var(--border-subtle)'
                }`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                transition: 'all 0.2s ease',
                opacity: isPending ? 0.5 : 1
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 'var(--radius-full)',
                  background: isCurrent
                    ? 'var(--accent-primary)'
                    : isDone
                    ? 'var(--status-healthy)'
                    : 'var(--bg-surface-sunken)',
                  color: isCurrent || isDone ? '#000000' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 1
                }}
              >
                {isDone ? <CheckCircle2 size={14} /> : isCurrent ? <Activity size={13} style={{ animation: 'pulse 1s infinite' }} /> : idx + 1}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isCurrent
                      ? 'var(--accent-primary)'
                      : isDone
                      ? 'var(--status-healthy)'
                      : 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.3
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  Wrench,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

export function DiagnosisPanel({ diagnosisResult, selectedMachine, onReset }) {
  if (!diagnosisResult) return null;

  const isHealthy = diagnosisResult.bearing_status === 'Healthy' || diagnosisResult.fault_type === 'Normal';
  const severity = diagnosisResult.severity || (isHealthy ? 'Healthy' : 'Moderate');
  const confidencePercent = (diagnosisResult.prediction_probability * 100).toFixed(1);

  // Status-dependent theme colors
  let statusColor = 'var(--status-healthy)';
  let statusBg = 'var(--status-healthy-bg)';
  let statusBorder = 'var(--status-healthy-border)';

  if (severity === 'Mild') {
    statusColor = 'var(--status-mild)';
    statusBg = 'var(--status-mild-bg)';
    statusBorder = 'var(--status-mild-border)';
  } else if (severity === 'Moderate') {
    statusColor = 'var(--status-moderate)';
    statusBg = 'var(--status-moderate-bg)';
    statusBorder = 'var(--status-moderate-border)';
  } else if (severity === 'Severe') {
    statusColor = 'var(--status-severe)';
    statusBg = 'var(--status-severe-bg)';
    statusBorder = 'var(--status-severe-border)';
  }

  // Format fault diameter display
  const faultSizeInches = diagnosisResult.fault_size_inches;
  const faultSizeDisplay = faultSizeInches && faultSizeInches > 0
    ? `${faultSizeInches}" (${diagnosisResult.fault_size_mm} mm)`
    : 'None (Baseline)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
      className="animate-fade-in"
    >
      {/* ── Primary Hero Diagnosis Card ── */}
      <div
        className="card"
        style={{
          borderLeft: `5px solid ${statusColor}`,
          padding: '24px 28px',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          {/* Main Status & Classification Details */}
          <div style={{ flex: '1 1 340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <StatusBadge status={diagnosisResult.bearing_status} size="md" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {diagnosisResult.windows_analyzed} {diagnosisResult.windows_analyzed === 1 ? 'window analyzed' : 'windows evaluated'}
              </span>
              {selectedMachine && (
                <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600, background: 'var(--accent-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  Asset: {selectedMachine.name}
                </span>
              )}
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}
            >
              {isHealthy ? 'Normal Bearing Condition' : `${diagnosisResult.fault_type} Fault Detected`}
            </h2>

            {/* Diagnostic Core Key-Value Attributes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                marginTop: 18
              }}
            >
              {/* Component Location */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Fault Category
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {diagnosisResult.fault_type}
                </div>
              </div>

              {/* Defect Diameter */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Defect Diameter
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {faultSizeDisplay}
                </div>
              </div>

              {/* Severity Level */}
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Severity Level
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: statusColor, textTransform: 'capitalize', marginTop: 2 }}>
                  {severity}
                </div>
              </div>
            </div>
          </div>

          {/* Model Probability Pill Card */}
          <div
            style={{
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 22px',
              textAlign: 'right',
              minWidth: 200,
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Model Probability
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                marginTop: 2,
                letterSpacing: '-0.03em'
              }}
            >
              {confidencePercent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Softmax Output Confidence
            </div>
          </div>
        </div>

        {/* Actionable Maintenance Recommendation Box */}
        <div
          style={{
            marginTop: 22,
            padding: '16px 20px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${statusBorder}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: statusBg,
              color: statusColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2
            }}
          >
            {isHealthy ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Maintenance Directive · {diagnosisResult.urgency || 'Routine'} Urgency
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Interval: {diagnosisResult.check_interval || 'Standard'}
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>
              {diagnosisResult.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

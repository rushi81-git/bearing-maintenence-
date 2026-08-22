import React from 'react';
import { Sparkles, Check, Database, X, Zap, ArrowRight } from 'lucide-react';

const SAMPLES = [
  {
    key: 'Normal',
    label: 'Normal Baseline',
    fault: 'Normal',
    diameter: 'None',
    severity: 'Healthy',
    description: 'Clean bearing vibration baseline at 1797 RPM. No localized structural defects.',
    statusColor: 'var(--status-healthy)'
  },
  {
    key: 'Ball_007',
    label: 'Ball Fault (0.007")',
    fault: 'Ball',
    diameter: '0.007 inch',
    severity: 'Mild',
    description: 'Early-stage microscopic pitting on rolling element ball surface.',
    statusColor: 'var(--status-mild)'
  },
  {
    key: 'Ball_014',
    label: 'Ball Fault (0.014")',
    fault: 'Ball',
    diameter: '0.014 inch',
    severity: 'Moderate',
    description: 'Intermediate spalling defect on rolling element ball body.',
    statusColor: 'var(--status-moderate)'
  },
  {
    key: 'IR_014',
    label: 'Inner Race (0.014")',
    fault: 'Inner Race',
    diameter: '0.014 inch',
    severity: 'Moderate',
    description: 'EDM electro-discharge machined spall located on rotating inner raceway.',
    statusColor: 'var(--status-moderate)'
  },
  {
    key: 'OR_014',
    label: 'Outer Race (0.014")',
    fault: 'Outer Race',
    diameter: '0.014 inch',
    severity: 'Moderate',
    description: 'Centered 6:00 outer raceway defect experiencing direct load zone impact.',
    statusColor: 'var(--status-moderate)'
  },
  {
    key: 'IR_021',
    label: 'Inner Race (0.021")',
    fault: 'Inner Race',
    diameter: '0.021 inch',
    severity: 'Severe',
    description: 'Critical deep fatigue flaking across inner ring surface.',
    statusColor: 'var(--status-severe)'
  }
];

export function DemoSamplesDrawer({ isOpen, onClose, onLoadDemo, activeFilename }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 11, 20, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-modal)',
          padding: 24,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                Curated CWRU Benchmark Demonstration Samples
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Pre-packaged Case Western Reserve University test-split recordings for algorithm sanity verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Samples Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
            overflowY: 'auto',
            paddingRight: 4
          }}
        >
          {SAMPLES.map(sample => {
            const isSelected = activeFilename && activeFilename.includes(sample.key.toLowerCase());

            return (
              <div
                key={sample.key}
                style={{
                  background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)',
                  border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {sample.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: `${sample.statusColor}18`,
                        color: sample.statusColor,
                        border: `1px solid ${sample.statusColor}40`,
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {sample.severity}
                    </span>
                  </div>

                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {sample.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    48,000 Hz · 1024 Samples
                  </span>
                  <button
                    onClick={() => {
                      onLoadDemo(sample.key);
                      onClose();
                    }}
                    className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ padding: '5px 12px', fontSize: 11 }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={13} style={{ color: 'var(--status-healthy)' }} />
                        Active
                      </>
                    ) : (
                      <>
                        Load Sample
                        <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-surface-sunken)',
            borderRadius: 'var(--radius-md)',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>All demonstration samples use standard 12k/48k drive-end accelerometer feeds.</span>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

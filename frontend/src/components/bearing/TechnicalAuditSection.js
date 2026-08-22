import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Binary, Layers, Info, Check } from 'lucide-react';

const FEATURE_LABELS = {
  rms: { label: 'RMS (Root Mean Square)', unit: 'g', desc: 'Overall vibration energy level' },
  kurtosis: { label: 'Kurtosis', unit: 'dimensionless', desc: 'Indicator of transient shock impacts' },
  crest_factor: { label: 'Crest Factor', unit: 'ratio', desc: 'Ratio of peak to RMS acceleration' },
  shape_factor: { label: 'Shape Factor', unit: 'ratio', desc: 'RMS divided by mean absolute value' },
  peak_to_peak: { label: 'Peak-to-Peak (P-P)', unit: 'g', desc: 'Difference between max and min acceleration' },
  peak: { label: 'Peak Amplitude', unit: 'g', desc: 'Maximum absolute acceleration excursion' },
  mean: { label: 'Mean Acceleration', unit: 'g', desc: 'DC bias component' },
  variance: { label: 'Variance', unit: 'g²', desc: 'Dispersion of acceleration values' },
  std: { label: 'Standard Deviation (σ)', unit: 'g', desc: 'AC dynamic fluctuation magnitude' },
  skewness: { label: 'Skewness', unit: 'dimensionless', desc: 'Asymmetry of the probability distribution' },
  impulse_factor: { label: 'Impulse Factor', unit: 'ratio', desc: 'Peak divided by mean absolute amplitude' },
  margin_factor: { label: 'Margin Factor', unit: 'ratio', desc: 'Peak divided by square root amplitude' },
  clearance_factor: { label: 'Clearance Factor', unit: 'ratio', desc: 'Peak divided by clearance mean' }
};

export function TechnicalAuditSection({ diagnosisResult }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!diagnosisResult) return null;

  const features = diagnosisResult.features || {};
  const topPredictions = diagnosisResult.top_predictions || [];

  return (
    <div className="card" style={{ background: 'var(--bg-surface)' }}>
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Binary size={16} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
              // TECHNICAL AUDIT & STATISTICAL METRICS
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Statistical Time-Domain Characteristics & Model Softmax Breakdown
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 12,
            background: 'var(--bg-surface-raised)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <span>{isExpanded ? 'Hide Technical Details' : 'View Technical Details'}</span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {isExpanded && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
          
          {/* 12 Statistical Features Grid */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              Extracted Time-Domain Characteristics (1024-Point Window)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10
              }}
            >
              {Object.entries(features).map(([key, val]) => {
                const meta = FEATURE_LABELS[key] || {
                  label: key.replace(/_/g, ' '),
                  unit: '',
                  desc: ''
                };

                return (
                  <div
                    key={key}
                    style={{
                      background: 'var(--bg-surface-raised)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        {typeof val === 'number' ? val.toFixed(4) : val}
                        {meta.unit && meta.unit !== 'dimensionless' && meta.unit !== 'ratio' && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                            {meta.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    {meta.desc && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>
                        {meta.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Softmax Class Probability Distribution Breakdown */}
          {topPredictions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                Softmax Class Probabilities (Top Classes)
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {topPredictions.map((pred, i) => {
                  const probPct = (pred.probability * 100).toFixed(1);
                  const isTop = i === 0;

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span
                        style={{
                          width: 100,
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isTop ? 700 : 500,
                          color: isTop ? 'var(--accent-primary)' : 'var(--text-primary)'
                        }}
                      >
                        {pred.class}
                      </span>

                      <div style={{ flex: 1, height: 8, background: 'var(--bg-surface-sunken)', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${probPct}%`,
                            background: isTop ? 'var(--accent-gradient)' : 'var(--border-strong)',
                            borderRadius: 4,
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>

                      <span
                        style={{
                          width: 60,
                          textAlign: 'right',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isTop ? 700 : 500,
                          color: isTop ? 'var(--accent-primary)' : 'var(--text-muted)'
                        }}
                      >
                        {probPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Model Architecture & Audit Disclaimer Strip */}
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--bg-surface-sunken)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 4 }}>
              <div>
                <strong>Model Version:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{diagnosisResult.model_version || 'CWRU-1D-CNN-v2.0'}</span>
              </div>
              <div>
                <strong>Sampling Rate:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{diagnosisResult.sampling_rate_hz ? `${diagnosisResult.sampling_rate_hz.toLocaleString()} Hz` : 'Normalized'}</span>
              </div>
              <div>
                <strong>Unit:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{diagnosisResult.signal_unit || 'g (acceleration)'}</span>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {diagnosisResult.disclaimer || 'Analysis conducted via offline-trained 1D Convolutional Neural Network benchmarked on the Case Western Reserve University (CWRU) Bearing Data Center accelerometer dataset.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

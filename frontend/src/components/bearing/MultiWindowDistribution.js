import React, { useState } from 'react';
import { Layers, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { DistributionChart } from '../DistributionChart';

export function MultiWindowDistribution({ diagnosisResult }) {
  const [selectedWindowIdx, setSelectedWindowIdx] = useState(0);

  if (!diagnosisResult || !diagnosisResult.windows_analyzed || diagnosisResult.windows_analyzed <= 1) {
    return null;
  }

  const dominantPercentage = diagnosisResult.windows_analyzed > 0
    ? ((diagnosisResult.dominant_window_count / diagnosisResult.windows_analyzed) * 100).toFixed(0)
    : 100;

  const windowPredictions = diagnosisResult.window_predictions || [];
  const activeWindow = windowPredictions[selectedWindowIdx] || windowPredictions[0];

  return (
    <div className="card animate-fade-in" style={{ padding: '20px 24px', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
              // MULTI-WINDOW CONTINUITY AUDIT
            </span>
          </div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            Window-by-Window Condition Aggregation ({diagnosisResult.windows_analyzed} Windows)
          </h4>
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface-raised)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          Consensus: <strong style={{ color: 'var(--accent-primary)' }}>{diagnosisResult.dominant_window_count}/{diagnosisResult.windows_analyzed}</strong> ({dominantPercentage}%)
        </div>
      </div>

      {/* Interactive Window Timeline Strip */}
      {windowPredictions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Interactive Window Timeline (Click to Inspect Slice):
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {windowPredictions.map((win, idx) => {
              const isSelected = selectedWindowIdx === idx;
              const isNormal = win.predicted_class === 'Normal';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedWindowIdx(idx)}
                  style={{
                    flex: '1 0 130px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      WIN #{idx + 1}
                    </span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isNormal ? 'var(--status-healthy)' : 'var(--status-mild)'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {win.predicted_class}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {(win.probability * 100).toFixed(1)}% conf
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Window Detail Strip */}
          {activeWindow && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-sunken)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 11,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span>
                INSPECTING WINDOW #{selectedWindowIdx + 1} · SAMPLES [{(selectedWindowIdx * 1024).toLocaleString()} – {((selectedWindowIdx + 1) * 1024).toLocaleString()}]
              </span>
              <div style={{ display: 'flex', gap: 14 }}>
                <span>CLASS: <strong style={{ color: 'var(--accent-primary)' }}>{activeWindow.predicted_class}</strong></span>
                <span>CONFIDENCE: <strong style={{ color: 'var(--status-healthy)' }}>{(activeWindow.probability * 100).toFixed(2)}%</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distribution Chart & Summary Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
        <div>
          <DistributionChart distribution={diagnosisResult.prediction_distribution} height={190} />
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Category</th>
                <th>Windows</th>
                <th>Percentage</th>
                <th>Avg Softmax</th>
              </tr>
            </thead>
            <tbody>
              {diagnosisResult.prediction_distribution && diagnosisResult.prediction_distribution.map((dist, idx) => (
                <tr key={idx}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{dist.class}</strong>
                  </td>
                  <td>{dist.fault_type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{dist.count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{dist.percentage}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(dist.avg_probability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

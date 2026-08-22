import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';
import { DistributionChart } from '../DistributionChart';

export function MultiWindowDistribution({ diagnosisResult }) {
  if (!diagnosisResult || !diagnosisResult.windows_analyzed || diagnosisResult.windows_analyzed <= 1) {
    return null;
  }

  const dominantPercentage = diagnosisResult.windows_analyzed > 0
    ? ((diagnosisResult.dominant_window_count / diagnosisResult.windows_analyzed) * 100).toFixed(0)
    : 100;

  return (
    <div className="card animate-fade-in" style={{ padding: '20px 24px', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
              // MULTI-WINDOW VOTING CONTINUITY
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
          Dominant: <strong style={{ color: 'var(--accent-primary)' }}>{diagnosisResult.dominant_window_count}/{diagnosisResult.windows_analyzed}</strong> ({dominantPercentage}%)
        </div>
      </div>

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

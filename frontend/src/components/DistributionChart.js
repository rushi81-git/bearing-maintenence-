import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

export function DistributionChart({ distribution, height = 180 }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        No window distribution data available
      </div>
    );
  }

  const getBarColor = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s.includes('mild')) return 'var(--status-mild)';
    if (s.includes('moderate')) return 'var(--status-moderate)';
    if (s.includes('severe')) return 'var(--status-severe)';
    return 'var(--status-healthy)';
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="class"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            tickLine={false}
            label={{ value: 'Windows', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface-raised)',
              borderColor: 'var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-md)'
            }}
            formatter={(value, name, item) => [
              `${value} windows (${item.payload.percentage}%) · Avg Prob: ${(item.payload.avg_probability * 100).toFixed(1)}%`,
              item.payload.fault_type
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.severity)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

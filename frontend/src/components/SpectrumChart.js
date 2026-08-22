import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function SpectrumChart({ spectrumData, samplingRateHz = null, height = 180 }) {
  if (!spectrumData || spectrumData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        No FFT spectrum available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={spectrumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="freq"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            tickLine={false}
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
            formatter={(value) => [value, 'Magnitude']}
            labelFormatter={(label) => samplingRateHz ? `Frequency: ${label}` : `Frequency Bin: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="amplitude"
            stroke="var(--status-mild)"
            fill="var(--status-mild-bg)"
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

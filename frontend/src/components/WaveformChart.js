import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function WaveformChart({ signal, maxPoints = 512, unit = 'g', height = 180 }) {
  const chartData = useMemo(() => {
    if (!signal || signal.length === 0) return [];
    
    // Downsample if signal is very large for crisp, smooth rendering
    const step = Math.max(1, Math.floor(signal.length / maxPoints));
    const data = [];
    for (let i = 0; i < signal.length; i += step) {
      data.push({
        sample: i,
        val: parseFloat(Number(signal[i]).toFixed(4))
      });
    }
    return data;
  }, [signal, maxPoints]);

  if (!signal || signal.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        No waveform data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="sample"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            stroke="var(--border-subtle)"
            domain={['auto', 'auto']}
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
            formatter={(value) => [`${value} ${unit}`, 'Amplitude']}
            labelFormatter={(label) => `Sample #${label}`}
          />
          <Line
            type="monotone"
            dataKey="val"
            stroke="var(--accent-primary)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

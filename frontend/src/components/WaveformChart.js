import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

/**
 * Resolve a CSS custom property to a concrete color string.
 * Recharts renders inside SVG where CSS vars on SVG attrs are NOT resolved.
 */
function resolveCSSVar(varName, fallback) {
  try {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return val || fallback;
  } catch {
    return fallback;
  }
}

export function WaveformChart({ signal, maxPoints = 512, unit = 'g', height = 180 }) {
  const chartData = useMemo(() => {
    if (!signal || signal.length === 0) return [];

    // Downsample for crisp rendering
    const step = Math.max(1, Math.floor(signal.length / maxPoints));
    const data = [];
    for (let i = 0; i < signal.length; i += step) {
      const v = Number(signal[i]);
      data.push({
        sample: i,
        val: isNaN(v) ? 0 : parseFloat(v.toFixed(4))
      });
    }
    return data;
  }, [signal, maxPoints]);

  // Resolve CSS vars to concrete values (SVG doesn't inherit CSS custom props)
  const accentColor  = resolveCSSVar('--accent-primary',      '#38bdf8');
  const borderColor  = resolveCSSVar('--border-subtle',       'rgba(255,255,255,0.07)');
  const mutedColor   = resolveCSSVar('--text-muted',          '#4a6080');
  const surfaceColor = resolveCSSVar('--bg-surface-raised',   '#111e33');
  const borderStrong = resolveCSSVar('--border-strong',       'rgba(255,255,255,0.13)');
  const textPrimary  = resolveCSSVar('--text-primary',        '#f0f6ff');

  if (!signal || signal.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)'
        }}
      >
        No waveform data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={borderColor}
            vertical={false}
          />
          <XAxis
            dataKey="sample"
            tick={{ fill: mutedColor, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            stroke={borderColor}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: mutedColor, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            stroke={borderColor}
            domain={['auto', 'auto']}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={0} stroke={borderColor} strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              backgroundColor: surfaceColor,
              borderColor: borderStrong,
              borderRadius: '10px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              color: textPrimary,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: accentColor }}
            formatter={(value) => [`${value} ${unit}`, 'Amplitude']}
            labelFormatter={(label) => `Sample #${label}`}
          />
          <Line
            type="monotone"
            dataKey="val"
            stroke={accentColor}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: accentColor, stroke: surfaceColor, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

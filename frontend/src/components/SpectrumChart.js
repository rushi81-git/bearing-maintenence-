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

export function SpectrumChart({ spectrumData, samplingRateHz = null, height = 180 }) {
  // Resolve CSS vars to concrete values for SVG attributes
  const mildColor    = resolveCSSVar('--status-mild',         '#fbbf24');
  const mildBg       = resolveCSSVar('--status-mild-bg',      'rgba(251,191,36,0.1)');
  const borderColor  = resolveCSSVar('--border-subtle',       'rgba(255,255,255,0.07)');
  const mutedColor   = resolveCSSVar('--text-muted',          '#4a6080');
  const surfaceColor = resolveCSSVar('--bg-surface-raised',   '#111e33');
  const borderStrong = resolveCSSVar('--border-strong',       'rgba(255,255,255,0.13)');
  const textPrimary  = resolveCSSVar('--text-primary',        '#f0f6ff');

  if (!spectrumData || spectrumData.length === 0) {
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
        No FFT spectrum available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={spectrumData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mildColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={mildColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} vertical={false} />
          <XAxis
            dataKey="freq"
            tick={{ fill: mutedColor, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            stroke={borderColor}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: mutedColor, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            stroke={borderColor}
            tickLine={false}
            axisLine={false}
          />
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
            itemStyle={{ color: mildColor }}
            formatter={(value) => [value, 'Magnitude']}
            labelFormatter={(label) =>
              samplingRateHz ? `Frequency: ${label}` : `Frequency Bin: ${label}`
            }
          />
          <Area
            type="monotone"
            dataKey="amplitude"
            stroke={mildColor}
            fill="url(#spectrumFill)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
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

export function SpectrumChart({
  spectrumData,
  samplingRateHz = null,
  height = 200,
  activeOverlay = null, // 'all' | 'bpfo' | 'bpfi' | 'bsf' | '1x' | null
  faultFreqs = null
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute top 3 dominant peaks in the spectrum
  const dominantPeaks = useMemo(() => {
    if (!spectrumData || spectrumData.length < 5) return [];
    const sorted = [...spectrumData].sort((a, b) => b.amplitude - a.amplitude);
    // Take distinct top 3
    const peaks = [];
    for (const item of sorted) {
      if (peaks.length >= 3) break;
      // Avoid immediate adjacent bins
      const isTooClose = peaks.some(p => Math.abs(p.freqHz - item.freqHz) < 15);
      if (!isTooClose) {
        peaks.push(item);
      }
    }
    return peaks;
  }, [spectrumData]);

  const mildColor    = resolveCSSVar('--status-mild',         '#fbbf24');
  const borderColor  = resolveCSSVar('--border-subtle',       'rgba(255,255,255,0.07)');
  const mutedColor   = resolveCSSVar('--text-muted',          '#4a6080');
  const surfaceColor = resolveCSSVar('--bg-surface-raised',   '#111e33');
  const borderStrong = resolveCSSVar('--border-strong',       'rgba(255,255,255,0.13)');
  const textPrimary  = resolveCSSVar('--text-primary',        '#f0f6ff');
  const cyanColor    = resolveCSSVar('--accent-primary',      '#38bdf8');
  const severeColor  = resolveCSSVar('--status-severe',        '#f87171');
  const greenColor   = resolveCSSVar('--status-healthy',       '#10d9a0');

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

  // Determine which reference lines to render based on activeOverlay
  const linesToRender = [];
  if (faultFreqs && activeOverlay) {
    if (activeOverlay === '1x' || activeOverlay === 'all') {
      linesToRender.push({
        freq: faultFreqs.fr,
        label: `1X (${faultFreqs.fr}Hz)`,
        color: cyanColor
      });
    }
    if (activeOverlay === 'bpfo' || activeOverlay === 'all') {
      linesToRender.push({
        freq: faultFreqs.bpfo,
        label: `BPFO (${faultFreqs.bpfo}Hz)`,
        color: severeColor
      });
      if (faultFreqs.harmonics?.bpfo2x) {
        linesToRender.push({
          freq: faultFreqs.harmonics.bpfo2x,
          label: `2X BPFO (${faultFreqs.harmonics.bpfo2x}Hz)`,
          color: severeColor
        });
      }
    }
    if (activeOverlay === 'bpfi' || activeOverlay === 'all') {
      linesToRender.push({
        freq: faultFreqs.bpfi,
        label: `BPFI (${faultFreqs.bpfi}Hz)`,
        color: mildColor
      });
      if (faultFreqs.harmonics?.bpfi2x) {
        linesToRender.push({
          freq: faultFreqs.harmonics.bpfi2x,
          label: `2X BPFI (${faultFreqs.harmonics.bpfi2x}Hz)`,
          color: mildColor
        });
      }
    }
    if (activeOverlay === 'bsf' || activeOverlay === 'all') {
      linesToRender.push({
        freq: faultFreqs.bsf,
        label: `BSF (${faultFreqs.bsf}Hz)`,
        color: greenColor
      });
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* HUD Bar for Dominant Peaks & Cursor */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          padding: '2px 4px',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>DOMINANT PEAKS:</span>
          {dominantPeaks.map((peak, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--bg-surface-sunken)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: idx === 0 ? mildColor : 'var(--text-secondary)'
              }}
            >
              #{idx + 1}: <strong>{peak.freqHz} Hz</strong> ({peak.amplitude}g)
            </span>
          ))}
        </div>

        {hoveredPoint && (
          <div style={{ color: mildColor, fontWeight: 600 }}>
            CURSOR: {hoveredPoint.freqHz} Hz → {hoveredPoint.amplitude}g
          </div>
        )}
      </div>

      {/* FFT Area Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={spectrumData}
            margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                setHoveredPoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
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

            {/* Vertical Fault Frequency Overlays */}
            {linesToRender.map((line, idx) => {
              // Find matching or closest data point label for XAxis
              const closestPoint = spectrumData.reduce((prev, curr) =>
                Math.abs(curr.freqHz - line.freq) < Math.abs(prev.freqHz - line.freq) ? curr : prev
              , spectrumData[0]);

              if (!closestPoint) return null;

              return (
                <ReferenceLine
                  key={idx}
                  x={closestPoint.freq}
                  stroke={line.color}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: line.label,
                    fill: line.color,
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    position: 'top',
                    offset: 5
                  }}
                />
              );
            })}

            <Tooltip
              contentStyle={{
                backgroundColor: surfaceColor,
                borderColor: borderStrong,
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: textPrimary,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                padding: '6px 10px'
              }}
              itemStyle={{ color: mildColor }}
              formatter={(value) => [`${value} g`, 'Spectral Magnitude']}
              labelFormatter={(label) => `Frequency: ${label}`}
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
    </div>
  );
}

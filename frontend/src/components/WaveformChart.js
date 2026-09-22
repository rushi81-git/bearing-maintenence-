import React, { useMemo, useState } from 'react';
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

export function WaveformChart({
  signal,
  maxPoints = 512,
  unit = 'g',
  height = 200,
  showEnvelope = false,
  showRMSLine = false,
  zoomWindow = 1024,
  offsetIndex = 0
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Extract the active window slice based on offset & zoom
  const windowSlice = useMemo(() => {
    if (!signal || signal.length === 0) return [];
    const start = Math.max(0, Math.min(signal.length - 1, offsetIndex));
    const end = Math.min(signal.length, start + zoomWindow);
    return signal.slice(start, end);
  }, [signal, offsetIndex, zoomWindow]);

  // Compute stats on active window (RMS, Peak, Mean, Std)
  const stats = useMemo(() => {
    if (!windowSlice || windowSlice.length === 0) return { rms: 0, peak: 0, crest: 0, mean: 0, std: 0 };
    let sum = 0;
    let sumSq = 0;
    let maxVal = -Infinity;
    let minVal = Infinity;

    for (let i = 0; i < windowSlice.length; i++) {
      const v = windowSlice[i];
      sum += v;
      sumSq += v * v;
      if (v > maxVal) maxVal = v;
      if (v < minVal) minVal = v;
    }

    const n = windowSlice.length;
    const mean = sum / n;
    const rms = Math.sqrt(sumSq / n);
    const variance = (sumSq / n) - (mean * mean);
    const std = Math.sqrt(Math.max(0, variance));
    const peak = Math.max(Math.abs(maxVal), Math.abs(minVal));
    const crest = rms > 0 ? (peak / rms) : 0;

    return {
      mean: parseFloat(mean.toFixed(4)),
      rms: parseFloat(rms.toFixed(4)),
      std: parseFloat(std.toFixed(4)),
      peak: parseFloat(peak.toFixed(4)),
      crest: parseFloat(crest.toFixed(2)),
      upper3Sigma: parseFloat((mean + 3 * std).toFixed(4)),
      lower3Sigma: parseFloat((mean - 3 * std).toFixed(4))
    };
  }, [windowSlice]);

  const chartData = useMemo(() => {
    if (!windowSlice || windowSlice.length === 0) return [];
    const step = Math.max(1, Math.floor(windowSlice.length / maxPoints));
    const data = [];
    for (let i = 0; i < windowSlice.length; i += step) {
      const v = Number(windowSlice[i]);
      const globalIdx = offsetIndex + i;
      data.push({
        sample: globalIdx,
        timeMs: parseFloat(((globalIdx / 48000) * 1000).toFixed(2)),
        val: isNaN(v) ? 0 : parseFloat(v.toFixed(4))
      });
    }
    return data;
  }, [windowSlice, maxPoints, offsetIndex]);

  const accentColor  = resolveCSSVar('--accent-primary',      '#38bdf8');
  const borderColor  = resolveCSSVar('--border-subtle',       'rgba(255,255,255,0.07)');
  const mutedColor   = resolveCSSVar('--text-muted',          '#4a6080');
  const surfaceColor = resolveCSSVar('--bg-surface-raised',   '#111e33');
  const borderStrong = resolveCSSVar('--border-strong',       'rgba(255,255,255,0.13)');
  const textPrimary  = resolveCSSVar('--text-primary',        '#f0f6ff');
  const warningColor = resolveCSSVar('--status-mild',          '#fbbf24');
  const severeColor  = resolveCSSVar('--status-severe',        '#f87171');

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
        No waveform telemetry available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Live Telemetry HUD Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          padding: '2px 4px'
        }}
      >
        <div style={{ display: 'flex', gap: 14 }}>
          <span>
            WINDOW RMS: <strong style={{ color: 'var(--accent-primary)' }}>{stats.rms} {unit}</strong>
          </span>
          <span>
            PEAK: <strong style={{ color: stats.peak > 1.0 ? severeColor : 'var(--text-primary)' }}>{stats.peak} {unit}</strong>
          </span>
          <span>
            CREST: <strong style={{ color: stats.crest > 4.5 ? warningColor : 'var(--text-primary)' }}>{stats.crest}</strong>
          </span>
        </div>

        {hoveredPoint && (
          <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            CURSOR: #{hoveredPoint.sample} ({hoveredPoint.timeMs}ms) → {hoveredPoint.val} {unit}
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                setHoveredPoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} vertical={false} />
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

            {/* Zero Baseline */}
            <ReferenceLine y={0} stroke={borderColor} strokeDasharray="4 4" />

            {/* RMS Reference Lines */}
            {showRMSLine && (
              <>
                <ReferenceLine
                  y={stats.rms}
                  stroke={accentColor}
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                  label={{ value: `+RMS (${stats.rms})`, fill: accentColor, fontSize: 9, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={-stats.rms}
                  stroke={accentColor}
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                />
              </>
            )}

            {/* 3-Sigma Envelope Reference Lines */}
            {showEnvelope && (
              <>
                <ReferenceLine
                  y={stats.upper3Sigma}
                  stroke={warningColor}
                  strokeDasharray="4 2"
                  strokeOpacity={0.7}
                  label={{ value: `+3σ Bound`, fill: warningColor, fontSize: 9, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={stats.lower3Sigma}
                  stroke={warningColor}
                  strokeDasharray="4 2"
                  strokeOpacity={0.7}
                />
              </>
            )}

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
              itemStyle={{ color: accentColor }}
              formatter={(value) => [`${value} ${unit}`, 'Amplitude']}
              labelFormatter={(label) => `Sample Index: #${label}`}
            />

            <Line
              type="monotone"
              dataKey="val"
              stroke={accentColor}
              strokeWidth={1.4}
              dot={false}
              activeDot={{ r: 3.5, fill: accentColor, stroke: surfaceColor, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

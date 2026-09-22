import React, { useState } from 'react';
import { Gauge, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export function ISOSeverityGauge({ rmsValue = 0.15, unit = 'g' }) {
  const [machineGroup, setMachineGroup] = useState('Group2_Rigid'); // Group 1 vs 2, Rigid vs Flexible

  // Standard ISO 10816-3 thresholds in g (approximate at 50Hz/3000rpm or 30Hz/1800rpm)
  // Zone A: Good, Zone B: Satisfactory, Zone C: Unsatisfactory, Zone D: Unacceptable
  const thresholds = {
    Group2_Rigid: { aMax: 0.08, bMax: 0.18, cMax: 0.45 },
    Group2_Flex:  { aMax: 0.12, bMax: 0.28, cMax: 0.65 },
    Group1_Rigid: { aMax: 0.14, bMax: 0.32, cMax: 0.75 },
    Group1_Flex:  { aMax: 0.20, bMax: 0.45, cMax: 1.00 }
  }[machineGroup];

  // Determine current Zone
  let currentZone = 'A';
  let zoneLabel = 'Zone A — Good';
  let zoneColor = 'var(--status-healthy)';
  let zoneDesc = 'Newly commissioned or fully refurbished bearing condition.';

  if (rmsValue > thresholds.cMax) {
    currentZone = 'D';
    zoneLabel = 'Zone D — Unacceptable';
    zoneColor = 'var(--status-severe)';
    zoneDesc = 'Vibration severity sufficient to cause mechanical breakdown. Immediate shutdown recommended.';
  } else if (rmsValue > thresholds.bMax) {
    currentZone = 'C';
    zoneLabel = 'Zone C — Unsatisfactory';
    zoneColor = 'var(--status-moderate)';
    zoneDesc = 'Unsuitable for long-term continuous operation. Corrective maintenance required.';
  } else if (rmsValue > thresholds.aMax) {
    currentZone = 'B';
    zoneLabel = 'Zone B — Acceptable';
    zoneColor = 'var(--status-mild)';
    zoneDesc = 'Acceptable for unrestricted industrial operation without immediate repair.';
  }

  // Calculate percentage along a 0 to 1.2 * cMax scale for linear position
  const maxScale = thresholds.cMax * 1.35;
  const clampedPercent = Math.min(100, Math.max(0, (rmsValue / maxScale) * 100));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 18px',
        background: 'var(--bg-surface-raised)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {/* Header with standard badge & Foundation selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gauge size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            ISO 10816-3 Vibration Severity Classification
          </span>
        </div>

        {/* Foundation & Machine Class Selector */}
        <select
          className="select-field"
          style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
          value={machineGroup}
          onChange={e => setMachineGroup(e.target.value)}
        >
          <option value="Group2_Rigid">Medium Motor (15-75kW) · Rigid Base</option>
          <option value="Group2_Flex">Medium Motor (15-75kW) · Flexible Mount</option>
          <option value="Group1_Rigid">Heavy Drive (&gt;75kW) · Rigid Base</option>
          <option value="Group1_Flex">Heavy Drive (&gt;75kW) · Flexible Mount</option>
        </select>
      </div>

      {/* Segmented Linear Meter */}
      <div>
        <div
          style={{
            position: 'relative',
            height: 18,
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            display: 'flex',
            background: 'var(--bg-surface-sunken)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {/* Zone A */}
          <div
            style={{
              width: `${(thresholds.aMax / maxScale) * 100}%`,
              background: 'rgba(16, 217, 160, 0.25)',
              borderRight: '1px solid rgba(16, 217, 160, 0.5)'
            }}
            title={`Zone A: <${thresholds.aMax}g`}
          />
          {/* Zone B */}
          <div
            style={{
              width: `${((thresholds.bMax - thresholds.aMax) / maxScale) * 100}%`,
              background: 'rgba(251, 191, 36, 0.25)',
              borderRight: '1px solid rgba(251, 191, 36, 0.5)'
            }}
            title={`Zone B: ${thresholds.aMax}g - ${thresholds.bMax}g`}
          />
          {/* Zone C */}
          <div
            style={{
              width: `${((thresholds.cMax - thresholds.bMax) / maxScale) * 100}%`,
              background: 'rgba(251, 146, 60, 0.25)',
              borderRight: '1px solid rgba(251, 146, 60, 0.5)'
            }}
            title={`Zone C: ${thresholds.bMax}g - ${thresholds.cMax}g`}
          />
          {/* Zone D */}
          <div
            style={{
              flex: 1,
              background: 'rgba(248, 113, 113, 0.25)'
            }}
            title={`Zone D: >${thresholds.cMax}g`}
          />

          {/* Current Needle Marker */}
          <div
            style={{
              position: 'absolute',
              left: `${clampedPercent}%`,
              top: 0,
              bottom: 0,
              width: 3,
              background: '#ffffff',
              boxShadow: '0 0 8px #ffffff',
              transform: 'translateX(-50%)',
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Labels under meter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4 }}>
          <span>0.0g</span>
          <span style={{ color: 'var(--status-healthy)' }}>A: {thresholds.aMax}g</span>
          <span style={{ color: 'var(--status-mild)' }}>B: {thresholds.bMax}g</span>
          <span style={{ color: 'var(--status-moderate)' }}>C: {thresholds.cMax}g</span>
          <span style={{ color: 'var(--status-severe)' }}>Zone D (Alarm)</span>
        </div>
      </div>

      {/* Result Card Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-sunken)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 'var(--radius-full)',
              background: zoneColor,
              boxShadow: `0 0 8px ${zoneColor}`
            }}
          />
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>
              {zoneLabel}
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
              {zoneDesc}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            MEASURED RMS
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {rmsValue} {unit}
          </div>
        </div>
      </div>
    </div>
  );
}

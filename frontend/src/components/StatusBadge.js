import React from 'react';

export function StatusBadge({ status, size = 'md' }) {
  const s = String(status || '').toLowerCase();
  
  let color = 'var(--text-muted)';
  let bg = 'var(--bg-surface-raised)';
  let border = 'var(--border-subtle)';
  let label = status || 'Unknown';

  if (s.includes('healthy') || s.includes('normal')) {
    color = 'var(--status-healthy)';
    bg = 'var(--status-healthy-bg)';
    border = 'var(--status-healthy-border)';
    label = 'Healthy';
  } else if (s.includes('mild')) {
    color = 'var(--status-mild)';
    bg = 'var(--status-mild-bg)';
    border = 'var(--status-mild-border)';
    label = 'Mild Fault';
  } else if (s.includes('moderate')) {
    color = 'var(--status-moderate)';
    bg = 'var(--status-moderate-bg)';
    border = 'var(--status-moderate-border)';
    label = 'Moderate Fault';
  } else if (s.includes('severe') || s.includes('critical') || s.includes('fault')) {
    color = 'var(--status-severe)';
    bg = 'var(--status-severe-bg)';
    border = 'var(--status-severe-border)';
    label = s.includes('severe') ? 'Severe Fault' : (status || 'Fault Detected');
  }

  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        color,
        background: bg,
        border: `1px solid ${border}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0
        }}
      />
      {label}
    </span>
  );
}

export function SeverityIndicator({ severity }) {
  const s = String(severity || '').toLowerCase();
  let color = 'var(--status-healthy)';
  if (s.includes('mild')) color = 'var(--status-mild)';
  if (s.includes('moderate')) color = 'var(--status-moderate)';
  if (s.includes('severe')) color = 'var(--status-severe)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {severity || 'Healthy'}
      </span>
    </div>
  );
}

import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';

export function MachineSelector({ machines = [], selectedMachineId, onSelectMachine }) {
  const selectedMachine = machines.find(m => String(m.id) === String(selectedMachineId));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)'
          }}
        >
          1. Target Equipment
        </label>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {machines.length} registered assets
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <select
          className="select-field"
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            borderColor: selectedMachineId ? 'var(--accent-border)' : 'var(--border-strong)'
          }}
          value={selectedMachineId || ''}
          onChange={e => onSelectMachine(e.target.value)}
        >
          <option value="">-- Unassigned Equipment / Lab Test --</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.machine_type || m.type || 'Asset'} ({m.status || 'Active'})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Machine Telemetry Strip */}
      {selectedMachine ? (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Cpu size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedMachine.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {selectedMachine.location || 'Workshop Bay 1'} · {selectedMachine.operating_speed_rpm ? `${selectedMachine.operating_speed_rpm} RPM` : '1797 RPM'}
              </div>
            </div>
          </div>

          <StatusBadge status={selectedMachine.status || 'Healthy'} size="sm" />
        </div>
      ) : (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <HelpCircle size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span>Standalone diagnostic mode. Findings will be logged as unassigned.</span>
        </div>
      )}
    </div>
  );
}

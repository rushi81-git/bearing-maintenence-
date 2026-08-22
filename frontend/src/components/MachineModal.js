import React, { useState, useEffect } from 'react';
import { X, Cpu } from 'lucide-react';

const MACHINE_TYPES = [
  'CNC Lathe',
  'CNC Mill',
  'Milling Center',
  'Compressor',
  'Hydraulic Press',
  'Grinding Machine',
  'Drill Press',
  'Conveyor System',
  'General Equipment'
];

export function MachineModal({ machine, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    type: 'CNC Lathe',
    location: 'Bay A',
    temperature: 45.0,
    vibration: 1.2,
    power_usage: 7.5,
    operational_hours: 1200,
    tool_condition: 85.0
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (machine) {
      setForm({
        name: machine.name || '',
        type: machine.machine_type || machine.type || 'CNC Lathe',
        location: machine.location || 'Bay A',
        temperature: machine.temperature != null ? parseFloat(machine.temperature) : 45.0,
        vibration: machine.vibration != null ? parseFloat(machine.vibration) : 1.2,
        power_usage: machine.power_usage != null ? parseFloat(machine.power_usage) : 7.5,
        operational_hours: machine.operational_hours != null ? parseInt(machine.operational_hours, 10) : 1200,
        tool_condition: machine.tool_condition != null ? parseFloat(machine.tool_condition) : ''
      });
    }
  }, [machine]);

  const isCNC = form.type.toLowerCase().includes('cnc') || form.type.toLowerCase().includes('mill') || form.type.toLowerCase().includes('lathe');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setBusy(true);
    try {
      await onSave({
        ...form,
        tool_condition: isCNC && form.tool_condition !== '' ? parseFloat(form.tool_condition) : null
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-strong)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                padding: '8px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <Cpu size={20} />
            </span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
                {machine ? 'Edit Machine' : 'Register New Machine'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Equipment telemetry profile for bearing vibration analysis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Machine Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CNC Spindle Center #1"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Machine Type
              </label>
              <select
                className="select-field"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {MACHINE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Workshop Location
              </label>
              <input
                type="text"
                className="input-field"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Bay A, Spindle Line"
              />
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
              Operational Telemetry Parameters
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Baseline Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={form.temperature}
                  onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Vibration RMS (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={form.vibration}
                  onChange={e => setForm(f => ({ ...f, vibration: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Power Draw (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={form.power_usage}
                  onChange={e => setForm(f => ({ ...f, power_usage: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Operating Hours
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.operational_hours}
                  onChange={e => setForm(f => ({ ...f, operational_hours: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Saving...' : (machine ? 'Update Machine' : 'Create Machine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

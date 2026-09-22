import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  CheckCircle2,
  MapPin,
  Clock,
  Thermometer,
  Activity,
  ArrowRight,
  Search,
  Wrench,
  Gauge
} from 'lucide-react';
import { createMachine } from '../../services/api';

const MACHINE_TYPES = [
  'CNC Lathe',
  'CNC Mill',
  'Milling Center',
  'Hydraulic Press',
  'Air Compressor',
  'Spindle Drive',
  'Industrial Grinder',
  'Gearbox Assembly',
  'General Equipment'
];

const LOCATIONS = ['Bay A', 'Bay B', 'Bay C', 'Workshop Floor', 'Utility Room', 'Toolroom'];

export function MachineStep({
  machines = [],
  selectedMachineId,
  onSelectMachine,
  onMachineAdded,
  onProceed,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('choose'); // 'choose' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Machine Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'CNC Lathe',
    location: 'Bay A',
    temperature: '45.0',
    vibration: '1.2',
    power_usage: '7.5',
    operational_hours: '1200',
    tool_condition: '85'
  });

  // Filtered machines for Choose tab
  const filteredMachines = machines.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.type && m.type.toLowerCase().includes(query)) ||
      (m.machine_type && m.machine_type.toLowerCase().includes(query)) ||
      (m.location && m.location.toLowerCase().includes(query))
    );
  });

  const selectedMachine = machines.find((m) => String(m.id) === String(selectedMachineId));

  // Handle Add Machine Submit
  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Machine name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createMachine({
        name: formData.name.trim(),
        type: formData.type,
        location: formData.location,
        temperature: parseFloat(formData.temperature) || 40.0,
        vibration: parseFloat(formData.vibration) || 1.0,
        power_usage: parseFloat(formData.power_usage) || 5.0,
        operational_hours: parseInt(formData.operational_hours, 10) || 0,
        tool_condition: formData.tool_condition ? parseFloat(formData.tool_condition) : null
      });

      if (res.success) {
        showToast(`Machine "${formData.name.trim()}" successfully registered!`, 'success');
        const newMachineId = res.machine_id;
        if (onMachineAdded) {
          await onMachineAdded();
        }
        if (newMachineId) {
          onSelectMachine(newMachineId);
        }
        // Auto-proceed to step 2 with newly created machine
        onProceed();
      } else {
        showToast(res.message || 'Failed to add machine', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error while registering machine', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* ── Top Header & Tab Toggle ── */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              // Step 1: Equipment Configuration
            </span>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
                marginTop: 2
              }}
            >
              Select or Register Workshop Machine
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Choose a monitored equipment asset from your fleet inventory or register a new workshop machine.
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface-raised)',
              padding: 4,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              gap: 4
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('choose')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'choose' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'choose' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: activeTab === 'choose' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
              }}
            >
              <Cpu size={15} />
              <span>Choose Machine ({machines.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'add' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'add' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: activeTab === 'add' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
              }}
            >
              <Plus size={15} />
              <span>Add New Machine</span>
            </button>
          </div>
        </div>

        {/* Selected Machine Alert Banner */}
        {selectedMachine && activeTab === 'choose' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--accent-subtle)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Selected Asset: <strong>{selectedMachine.name}</strong> ({selectedMachine.machine_type || selectedMachine.type})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Location: {selectedMachine.location || 'Workshop Floor'} · Operational Hours: {selectedMachine.operational_hours || 0} hrs
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceed}
              className="btn btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <span>Proceed to CSV Upload</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: CHOOSE EXISTING MACHINE ── */}
      {activeTab === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search bar */}
          <div
            style={{
              position: 'relative',
              maxWidth: 420
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search by machine name, type, or bay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: 38,
                width: '100%',
                fontSize: 13
              }}
            />
          </div>

          {/* Machine Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16
            }}
          >
            {filteredMachines.map((m) => {
              const isSelected = String(m.id) === String(selectedMachineId);

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMachine(m.id)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-surface)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'var(--shadow-card)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  {/* Top Row: Icon & Status */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--accent-primary)' : 'var(--accent-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Cpu size={20} />
                      </div>

                      {isSelected && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            background: 'var(--accent-primary)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            letterSpacing: '0.04em'
                          }}
                        >
                          SELECTED
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      {m.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{m.location || 'Workshop Floor'}</span>
                      <span>·</span>
                      <span>{m.machine_type || m.type || 'Equipment'}</span>
                    </div>
                  </div>

                  {/* Machine Telemetry Attributes */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      padding: '10px 12px',
                      background: 'var(--bg-surface-raised)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Temp
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {m.temperature ? `${parseFloat(m.temperature).toFixed(1)}°C` : '42°C'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Vibration
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {m.vibration ? `${parseFloat(m.vibration).toFixed(1)} mm/s` : '1.2'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Hours
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        {m.operational_hours ? `${parseInt(m.operational_hours, 10)}h` : '1200h'}
                      </div>
                    </div>
                  </div>

                  {/* Selection Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMachine(m.id);
                      onProceed();
                    }}
                    className={isSelected ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>{isSelected ? 'Proceed with this Machine' : 'Select Machine'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}

            {filteredMachines.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)'
                }}
              >
                <Cpu size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>No matching machines found</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Switch to the "Add New Machine" tab to register a new machine.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ADD NEW MACHINE ── */}
      {activeTab === 'add' && (
        <form
          onSubmit={handleAddMachine}
          className="card"
          style={{
            background: 'var(--bg-surface)',
            padding: '28px 32px',
            maxWidth: 680,
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              Machine Registration Form
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Enter equipment metadata. Once saved, it will be automatically selected for telemetry reading.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Machine Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Machine Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spindle Drive Mill #4"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Equipment Type */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Equipment Category *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                {MACHINE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Workshop Location / Bay
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Operational Hours */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Operational Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.operational_hours}
                onChange={(e) => setFormData({ ...formData, operational_hours: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Base Temperature */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Baseline Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Base Vibration */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Baseline Vibration (mm/s)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.vibration}
                onChange={(e) => setFormData({ ...formData, vibration: e.target.value })}
                className="input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setActiveTab('choose')}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Registering...' : 'Register Machine & Proceed'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Cpu, MapPin, Gauge, Activity } from 'lucide-react';
import { MachineModal } from '../components/MachineModal';
import { createMachine, updateMachine, deleteMachine } from '../services/api';

export function Machines({ machines, onRefresh, showToast, onDiagnoseMachine }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleSave = async (formData) => {
    try {
      let res;
      if (editingMachine) {
        res = await updateMachine(editingMachine.id, formData);
      } else {
        res = await createMachine(formData);
      }
      if (res.success) {
        showToast(editingMachine ? 'Machine updated' : 'Machine added', 'success');
        setModalOpen(false);
        setEditingMachine(null);
        onRefresh();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteMachine(id);
      if (res.success) {
        showToast('Machine deleted successfully', 'success');
        setDeleteConfirmId(null);
        onRefresh();
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            // EQUIPMENT INVENTORY
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>
            Monitored Workshop Machinery ({machines.length})
          </h3>
        </div>
        <button
          onClick={() => { setEditingMachine(null); setModalOpen(true); }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          Register Machine
        </button>
      </div>

      {/* Machine Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {machines.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
                      {m.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <MapPin size={12} />
                      <span>{m.location || 'Workshop Floor'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => { setEditingMachine(m); setModalOpen(true); }}
                    className="btn btn-outline"
                    style={{ padding: '6px', color: 'var(--text-muted)' }}
                    title="Edit Machine"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(m.id)}
                    className="btn btn-outline"
                    style={{ padding: '6px', color: 'var(--status-severe)' }}
                    title="Delete Machine"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Machine Parameters Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 16,
                  padding: 12,
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                  <strong>{m.machine_type || m.type}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Hours: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{m.operational_hours || 0} hrs</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Baseline Temp: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{m.temperature || 40}°C</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Baseline Vib: </span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{m.vibration || 1.0} mm/s</strong>
                </div>
              </div>
            </div>

            {/* Diagnose CTA for this machine */}
            <button
              onClick={() => onDiagnoseMachine(m.id)}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: 12 }}
            >
              <Activity size={14} />
              Diagnose Bearing Vibration
            </button>
          </div>
        ))}
      </div>

      {/* Machine Modal */}
      {modalOpen && (
        <MachineModal
          machine={editingMachine}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingMachine(null); }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
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
          <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Delete Machine?
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              This will delete the machine and disassociate historical bearing diagnoses.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="btn btn-danger">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

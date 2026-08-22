import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, CheckCircle2, Clock, AlertTriangle, X, Wrench } from 'lucide-react';
import { fetchSchedule, updateScheduleStatus, createScheduleEntry } from '../services/api';

const STATUS_STYLES = {
  pending: { color: 'var(--status-moderate)', bg: 'var(--status-moderate-bg)', border: 'var(--status-moderate-border)' },
  in_progress: { color: 'var(--status-mild)', bg: 'var(--status-mild-bg)', border: 'var(--status-mild-border)' },
  completed: { color: 'var(--status-healthy)', bg: 'var(--status-healthy-bg)', border: 'var(--status-healthy-border)' },
  overdue: { color: 'var(--status-severe)', bg: 'var(--status-severe-bg)', border: 'var(--status-severe-border)' }
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.color }} />
      {status.replace('_', ' ')}
    </span>
  );
}

export function Maintenance({ machines, showToast }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    machine_id: '',
    task_type: 'Bearing Inspection',
    priority: 'Medium',
    due_date: '',
    notes: ''
  });

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSchedule();
      if (res.success) setSchedule(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateScheduleStatus(id, newStatus);
      if (res.success) {
        setSchedule(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        showToast('Task status updated', 'success');
      }
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEntry.machine_id || !newEntry.due_date) {
      showToast('Machine and due date are required', 'error');
      return;
    }
    try {
      const res = await createScheduleEntry(newEntry);
      if (res.success) {
        showToast('Maintenance task created', 'success');
        setAddModalOpen(false);
        setNewEntry({ machine_id: '', task_type: 'Bearing Inspection', priority: 'Medium', due_date: '', notes: '' });
        loadSchedule();
      } else {
        showToast(res.message || 'Failed to create task', 'error');
      }
    } catch (err) { showToast(err.message, 'error'); }
  };

  const pendingCount = schedule.filter(s => s.status === 'pending').length;
  const overdueCount = schedule.filter(s => s.status === 'overdue').length;
  const completedCount = schedule.filter(s => s.status === 'completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            // MAINTENANCE SCHEDULER
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>
            Workshop Maintenance Schedule
          </h3>
        </div>
        <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          Schedule Task
        </button>
      </div>

      {/* Summary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Pending Tasks', value: pendingCount, color: 'var(--status-moderate)', icon: <Clock size={20} /> },
          { label: 'Overdue', value: overdueCount, color: 'var(--status-severe)', icon: <AlertTriangle size={20} /> },
          { label: 'Completed', value: completedCount, color: 'var(--status-healthy)', icon: <CheckCircle2 size={20} /> }
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 10, borderRadius: 'var(--radius-md)', background: `${color}22`, color }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Table */}
      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            // ACTIVE WORK ORDERS
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
            Upcoming & Active Maintenance
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading schedule...</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Task Type</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0' }}>
                      No maintenance tasks scheduled. Click "Schedule Task" to add one.
                    </td>
                  </tr>
                ) : (
                  schedule.map(task => (
                    <tr key={task.id}>
                      <td><strong>{task.machine_name || `Machine #${task.machine_id}`}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Wrench size={13} style={{ color: 'var(--text-muted)' }} />
                          {task.task_type}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: task.priority === 'High' || task.priority === 'Critical'
                            ? 'var(--status-severe-bg)'
                            : task.priority === 'Medium'
                            ? 'var(--status-moderate-bg)'
                            : 'var(--status-healthy-bg)',
                          color: task.priority === 'High' || task.priority === 'Critical'
                            ? 'var(--status-severe)'
                            : task.priority === 'Medium'
                            ? 'var(--status-moderate)'
                            : 'var(--status-healthy)'
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td><StatusPill status={task.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>
                        {task.notes || '—'}
                      </td>
                      <td>
                        <select
                          className="select-field"
                          style={{ padding: '5px 8px', fontSize: 11, width: 130 }}
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {addModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 480, background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>Schedule Maintenance Task</h3>
              <button onClick={() => setAddModalOpen(false)} className="btn btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Machine *</label>
                <select className="select-field" value={newEntry.machine_id} onChange={e => setNewEntry(f => ({ ...f, machine_id: e.target.value }))} required>
                  <option value="">Select Machine...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Task Type</label>
                  <select className="select-field" value={newEntry.task_type} onChange={e => setNewEntry(f => ({ ...f, task_type: e.target.value }))}>
                    {['Bearing Inspection', 'Bearing Replacement', 'Lubrication', 'Vibration Analysis', 'Full Service', 'Tool Change', 'Alignment Check'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Priority</label>
                  <select className="select-field" value={newEntry.priority} onChange={e => setNewEntry(f => ({ ...f, priority: e.target.value }))}>
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Due Date *</label>
                <input type="date" required className="input-field" value={newEntry.due_date} onChange={e => setNewEntry(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Notes / Instructions</label>
                <textarea
                  className="input-field"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="Specific maintenance instructions or observations..."
                  value={newEntry.notes}
                  onChange={e => setNewEntry(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

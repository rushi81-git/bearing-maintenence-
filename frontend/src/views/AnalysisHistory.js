import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { fetchBearingHistory } from '../services/api';

const SEVERITY_OPTIONS = ['', 'Healthy', 'Mild', 'Moderate', 'Severe'];
const FAULT_OPTIONS = ['', 'Normal', 'Ball', 'Inner Race', 'Outer Race'];

export function AnalysisHistory({ machines, showToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ machine_id: '', severity: '', fault_type: '', search: '' });
  const [inspectedItem, setInspectedItem] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBearingHistory(filters);
      if (res.success) setHistory(res.data);
      else showToast(res.message || 'Failed to load history', 'error');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const clearFilters = () => setFilters({ machine_id: '', severity: '', fault_type: '', search: '' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      {/* Filter Bar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Search
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: 32 }}
              placeholder="Search by machine or fault type..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ flex: '0 1 180px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Machine
          </label>
          <select
            className="select-field"
            value={filters.machine_id}
            onChange={e => setFilters(f => ({ ...f, machine_id: e.target.value }))}
          >
            <option value="">All Machines</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 160px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Severity
          </label>
          <select
            className="select-field"
            value={filters.severity}
            onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          >
            {SEVERITY_OPTIONS.map(s => (
              <option key={s} value={s}>{s || 'All Severities'}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 160px' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Fault Type
          </label>
          <select
            className="select-field"
            value={filters.fault_type}
            onChange={e => setFilters(f => ({ ...f, fault_type: e.target.value }))}
          >
            {FAULT_OPTIONS.map(f => (
              <option key={f} value={f}>{f || 'All Fault Types'}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadHistory} className="btn btn-primary" style={{ padding: '9px 16px' }}>
            <Filter size={15} />
            Apply
          </button>
          <button onClick={clearFilters} className="btn btn-outline" style={{ padding: '9px 12px' }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              // DIAGNOSIS AUDIT LOG
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
              Bearing Vibration Analysis History
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                ({history.length} records)
              </span>
            </h3>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            Loading history...
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Machine</th>
                  <th>Condition</th>
                  <th>Fault Type</th>
                  <th>Defect Size</th>
                  <th>Probability</th>
                  <th>Model</th>
                  <th>Windows</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0' }}>
                      No bearing diagnosis records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  history.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(item.created_at).toLocaleDateString()}<br />
                        <span style={{ fontSize: 10 }}>
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <strong>{item.machine_name || `Machine #${item.machine_id}`}</strong>
                      </td>
                      <td>
                        <StatusBadge status={item.severity || item.bearing_status} size="sm" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.fault_type}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {item.fault_size_inches > 0 ? `${item.fault_size_inches}"` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {(item.prediction_probability * 100).toFixed(1)}%
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {item.model_version || 'cnn_v1'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {item.windows_analyzed || 1}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => setInspectedItem(item)}
                        >
                          <Eye size={13} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {inspectedItem && (
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
              maxWidth: 560,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-modal)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
                Diagnosis Inspection Record
              </h3>
              <button onClick={() => setInspectedItem(null)} className="btn btn-outline" style={{ padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <StatusBadge status={inspectedItem.severity || inspectedItem.bearing_status} />
                <strong style={{ fontSize: 16 }}>{inspectedItem.fault_type}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                {[
                  ['Machine', inspectedItem.machine_name || `Machine #${inspectedItem.machine_id}`],
                  ['Fault Type', inspectedItem.fault_type],
                  ['Defect Size', inspectedItem.fault_size_inches > 0 ? `${inspectedItem.fault_size_inches}" (${inspectedItem.fault_size_mm} mm)` : 'None (Normal)'],
                  ['Model Probability', `${(inspectedItem.prediction_probability * 100).toFixed(2)}%`],
                  ['Windows Analyzed', inspectedItem.windows_analyzed || 1],
                  ['Model Version', inspectedItem.model_version || 'cnn_v1'],
                  ['Source File', inspectedItem.source_filename || '—'],
                  ['Sampling Rate', inspectedItem.sampling_rate_hz ? `${inspectedItem.sampling_rate_hz.toLocaleString()} Hz` : '—'],
                  ['Check Interval', inspectedItem.check_interval || '—'],
                  ['Urgency', inspectedItem.urgency || '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>

              {inspectedItem.recommendation && (
                <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Maintenance Recommendation:</strong><br />
                  {inspectedItem.recommendation}
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Recorded at: {new Date(inspectedItem.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { fetchStats, fetchBearingHistory, fetchBearingModels } from '../services/api';

export function Overview({ machines, onNavigate }) {
  const [stats, setStats] = useState({
    total_machines: 4,
    total_diagnoses: 2,
    fault_diagnoses: 1,
    pending_maintenance: 1
  });
  const [recentHistory, setRecentHistory] = useState([]);
  const [benchmarkModels, setBenchmarkModels] = useState([]);

  useEffect(() => {
    fetchStats().then(res => {
      if (res.success) setStats(res.data);
    }).catch(() => {});

    fetchBearingHistory({ limit: 5 }).then(res => {
      if (res.success) setRecentHistory(res.data);
    }).catch(() => {});

    fetchBearingModels().then(res => {
      if (res.success && res.data?.results) setBenchmarkModels(res.data.results);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      
      {/* ── Metric Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Monitored Machines
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginTop: 2 }}>
              {stats.total_machines}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--status-healthy-bg)', color: 'var(--status-healthy)' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Bearing Analyses
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginTop: 2 }}>
              {stats.total_diagnoses}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--status-mild-bg)', color: 'var(--status-mild)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Identified Faults
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginTop: 2 }}>
              {stats.fault_diagnoses}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--status-moderate-bg)', color: 'var(--status-moderate)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Pending Tasks
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, marginTop: 2 }}>
              {stats.pending_maintenance}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Hero Banner ── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface-raised) 0%, var(--bg-surface) 100%)',
          border: '1px solid var(--accent-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '24px 28px'
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            // HERO CAPABILITY
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            AI-Driven Bearing Fault Diagnosis
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 620 }}>
            Upload raw vibration recordings from workshop machines to detect fault signatures, identify bearing component damage (Ball, Inner Race, Outer Race), and quantify experimental defect severity with 1024-window 1D Deep CNN.
          </p>
        </div>
        <button
          onClick={() => onNavigate('bearing')}
          className="btn btn-primary"
          style={{ padding: '11px 22px', fontSize: 14 }}
        >
          <Activity size={16} />
          Launch Bearing Diagnosis
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* ── Recent Bearing Diagnoses Table ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              // PERSISTENT HISTORY
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
              Recent Bearing Vibration Diagnoses
            </h3>
          </div>
          <button onClick={() => onNavigate('history')} className="btn btn-outline" style={{ fontSize: 12 }}>
            View Full History
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Machine</th>
                <th>Condition</th>
                <th>Fault Type</th>
                <th>Defect Size</th>
                <th>Model Probability</th>
                <th>Windows</th>
              </tr>
            </thead>
            <tbody>
              {recentHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                    No bearing analyses recorded yet.
                  </td>
                </tr>
              ) : (
                recentHistory.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <strong>{item.machine_name || `Machine #${item.machine_id}`}</strong>
                    </td>
                    <td>
                      <StatusBadge status={item.severity || item.bearing_status} size="sm" />
                    </td>
                    <td>{item.fault_type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {item.fault_size_inches > 0 ? `${item.fault_size_inches}" (${item.fault_size_mm} mm)` : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {(item.prediction_probability * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {item.windows_analyzed || 1}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Offline Trained CWRU Model Benchmark Comparison ── */}
      {benchmarkModels.length > 0 && (
        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              // BENCHMARK EVALUATION (LEAKAGE-SAFE HELD-OUT TEST)
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>
              Algorithm Comparison on 1024-Sample Universal Windows
            </h3>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Input Representation</th>
                  <th>5-Fold CV Accuracy</th>
                  <th>Test Accuracy</th>
                  <th>Macro F1</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkModels.map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{m.model_name}</strong>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {m.model_name === '1D CNN' ? '1024-Point Raw Signal' : '12 Statistical Features'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {(m.cv_mean * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: m.test_accuracy > 0.95 ? 'var(--status-healthy)' : 'var(--text-primary)' }}>
                      {(m.test_accuracy * 100).toFixed(2)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {(m.macro_f1 * 100).toFixed(2)}%
                    </td>
                    <td>
                      {m.model_name === '1D CNN' ? (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--status-healthy-bg)', color: 'var(--status-healthy)', fontWeight: 700 }}>
                          Selected Production
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface-raised)', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Benchmarked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

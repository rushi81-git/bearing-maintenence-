import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CalendarPlus,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Clock,
  MapPin,
  Sparkles,
  Download,
  Printer,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { ISOSeverityGauge } from '../../components/bearing/ISOSeverityGauge';
import { generateDiagnosticPDF } from '../../utils/pdfReportGenerator';
import { createScheduleEntry } from '../../services/api';

export function DiagnosisStep({
  diagnosisResult,
  selectedMachine,
  sourceFilename,
  onResetWorkflow,
  onBackToSignal,
  showToast
}) {
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedTask, setDispatchedTask] = useState(null);

  // Dispatch work order form state
  const [dispatchData, setDispatchData] = useState(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const isHealthy = diagnosisResult?.bearing_status === 'Healthy' || diagnosisResult?.fault_type === 'Normal';

    return {
      task_type: isHealthy ? 'Routine Inspection' : 'Bearing Overhaul',
      priority: diagnosisResult?.severity === 'Severe' ? 'High' : 'Medium',
      due_date: targetDate.toISOString().split('T')[0],
      notes: isHealthy
        ? `Routine periodic bearing inspection for ${selectedMachine?.name || 'Machine'}. Baseline parameters healthy.`
        : `Bearing Overhaul: Inspect for ${diagnosisResult?.fault_type} defect (${diagnosisResult?.fault_size_inches || 0.014}"). ${diagnosisResult?.recommendation || ''}`
    };
  });

  if (!diagnosisResult) return null;

  const isHealthy = diagnosisResult.bearing_status === 'Healthy' || diagnosisResult.fault_type === 'Normal';
  const severity = diagnosisResult.severity || (isHealthy ? 'Healthy' : 'Moderate');
  const confidencePercent = (diagnosisResult.prediction_probability * 100).toFixed(1);

  // Status-dependent theme colors
  let statusColor = 'var(--status-healthy)';
  let statusBg = 'var(--status-healthy-bg)';
  let statusBorder = 'var(--status-healthy-border)';

  if (severity === 'Mild') {
    statusColor = 'var(--status-mild)';
    statusBg = 'var(--status-mild-bg)';
    statusBorder = 'var(--status-mild-border)';
  } else if (severity === 'Moderate') {
    statusColor = 'var(--status-moderate)';
    statusBg = 'var(--status-moderate-bg)';
    statusBorder = 'var(--status-moderate-border)';
  } else if (severity === 'Severe') {
    statusColor = 'var(--status-severe)';
    statusBg = 'var(--status-severe-bg)';
    statusBorder = 'var(--status-severe-border)';
  }

  const faultSizeDisplay =
    diagnosisResult.fault_size_inches && diagnosisResult.fault_size_inches > 0
      ? `${diagnosisResult.fault_size_inches}" (${diagnosisResult.fault_size_mm} mm)`
      : 'None (Baseline)';

  const measuredRms = diagnosisResult.features?.rms ?? diagnosisResult.rms ?? 0.15;

  // Handle PDF Generation
  const handleGeneratePdf = () => {
    try {
      generateDiagnosticPDF({
        diagnosis: diagnosisResult,
        machine: selectedMachine,
        filename: sourceFilename
      });
      showToast('Diagnostic audit PDF report generated and downloaded!', 'success');
    } catch (err) {
      showToast('Failed to generate PDF: ' + err.message, 'error');
    }
  };

  // Handle Dispatch to Maintenance Schedule
  const handleDispatchWorkOrder = async (e) => {
    e.preventDefault();
    if (!selectedMachine?.id) {
      showToast('Machine ID is required for maintenance dispatch', 'error');
      return;
    }

    setIsDispatching(true);
    try {
      const payload = {
        machine_id: selectedMachine.id,
        task_type: dispatchData.task_type,
        due_date: dispatchData.due_date,
        priority: dispatchData.priority,
        notes: dispatchData.notes,
        estimated_duration_hours: severity === 'Severe' ? 4.0 : 2.0
      };

      const res = await createScheduleEntry(payload);
      if (res.success) {
        showToast(`Dispatched work order for ${selectedMachine.name} to Maintenance Scheduler!`, 'success');
        setDispatchedTask({
          id: res.id,
          date: dispatchData.due_date,
          priority: dispatchData.priority,
          task_type: dispatchData.task_type
        });
        setDispatchModalOpen(false);
      } else {
        showToast(res.message || 'Failed to dispatch work order', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error while dispatching work order', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* ── Top Navigation Bar ── */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onBackToSignal}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Signal Details</span>
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
            // Step 3: Diagnostic Report &amp; Maintenance Dispatch
          </span>
        </div>

        <button
          type="button"
          onClick={onResetWorkflow}
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCcw size={13} />
          <span>New Diagnosis Run</span>
        </button>
      </div>

      {/* ── Main Diagnostic Hero Card (Machine Name + Fault Information) ── */}
      <div
        className="card"
        style={{
          borderLeft: `5px solid ${statusColor}`,
          padding: '28px 32px',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          {/* Machine & Fault Details */}
          <div style={{ flex: '1 1 380px' }}>
            {/* Machine Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <StatusBadge status={diagnosisResult.bearing_status} size="md" />
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  background: 'var(--accent-subtle)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Cpu size={13} />
                <span>Machine Asset: {selectedMachine?.name || 'Monitored Unit'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} />
                <span>{selectedMachine?.location || 'Floor Bay A'}</span>
              </div>
            </div>

            {/* Fault Title */}
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}
            >
              {isHealthy ? 'Normal Healthy Bearing Condition' : `${diagnosisResult.fault_type} Fault Detected`}
            </h1>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
              Evaluated on {new Date().toLocaleDateString()} via {diagnosisResult.model_version || '1D Deep CNN'} architecture.
            </p>

            {/* Diagnostic Attribute Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginTop: 20
              }}
            >
              <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Fault Category
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                  {diagnosisResult.fault_type}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Defect Diameter
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {faultSizeDisplay}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Severity Level
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: statusColor, textTransform: 'capitalize', marginTop: 2 }}>
                  {severity}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Urgency
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                  {diagnosisResult.urgency || (isHealthy ? 'Routine' : 'High')}
                </div>
              </div>
            </div>
          </div>

          {/* Model Confidence Card */}
          <div
            style={{
              background: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              textAlign: 'center',
              minWidth: 200,
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Confidence Rating
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono)',
                marginTop: 4,
                letterSpacing: '-0.03em'
              }}
            >
              {confidencePercent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Softmax Probability
            </div>
          </div>
        </div>

        {/* ── ISO 10816-3 Gauge ── */}
        <div style={{ marginTop: 20 }}>
          <ISOSeverityGauge rmsValue={measuredRms} unit="g" />
        </div>

        {/* ── Maintenance Directive & Engineering Recommendations ── */}
        <div
          style={{
            marginTop: 18,
            padding: '16px 20px',
            background: 'var(--bg-surface-raised)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${statusBorder}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              background: statusBg,
              color: statusColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2
            }}
          >
            {isHealthy ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Maintenance Directive · {diagnosisResult.urgency || 'Routine'} Urgency
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.6 }}>
              {diagnosisResult.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* ── TWO PRIMARY OUTCOME OPTIONS: REPORT & DISPATCH (From User Diagram) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {/* OPTION 1: GENERATE PDF REPORT */}
        <div
          className="card"
          style={{
            background: 'var(--bg-surface)',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Outcome Option 1
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  Diagnostic PDF Report
                </h3>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generate an official, high-resolution audit PDF report containing full machinery profiles, fault dimensions, ISO 10816 vibration features, and engineering maintenance directives.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGeneratePdf}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Download size={16} />
            <span>Generate &amp; Download PDF Report</span>
          </button>
        </div>

        {/* OPTION 2: DISPATCH MACHINE TO MAINTENANCE SCHEDULE */}
        <div
          className="card"
          style={{
            background: 'var(--bg-surface)',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
            border: dispatchedTask ? '1px solid var(--status-healthy-border)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: dispatchedTask ? 'var(--status-healthy-bg)' : 'rgba(245, 158, 11, 0.12)',
                  color: dispatchedTask ? 'var(--status-healthy)' : 'var(--status-moderate)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {dispatchedTask ? <CheckCircle2 size={22} /> : <CalendarPlus size={22} />}
              </div>
              <div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: dispatchedTask ? 'var(--status-healthy)' : 'var(--status-moderate)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Outcome Option 2
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  Dispatch to Scheduler
                </h3>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Dispatch this machine and fault work order directly into the workshop maintenance scheduler to notify technicians and track corrective work.
            </p>

            {/* Dispatched Confirmation Pill */}
            {dispatchedTask && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'var(--status-healthy-bg)',
                  border: '1px solid var(--status-healthy-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--status-healthy)' }} />
                <div style={{ fontSize: 12, color: 'var(--status-healthy)', fontWeight: 600 }}>
                  Work Order #{dispatchedTask.id} scheduled for {dispatchedTask.date} ({dispatchedTask.priority} priority)
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDispatchModalOpen(true)}
            disabled={!!dispatchedTask}
            className={dispatchedTask ? 'btn btn-outline' : 'btn btn-primary'}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: dispatchedTask ? 'transparent' : 'var(--status-moderate)',
              borderColor: dispatchedTask ? 'var(--status-healthy-border)' : 'var(--status-moderate)',
              color: dispatchedTask ? 'var(--status-healthy)' : '#ffffff'
            }}
          >
            <CalendarPlus size={16} />
            <span>{dispatchedTask ? 'Work Order Dispatched' : 'Dispatch Machine to Maintenance'}</span>
          </button>
        </div>
      </div>

      {/* ── DISPATCH MODAL ── */}
      {dispatchModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          className="animate-fade-in"
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-surface)',
              padding: '28px 32px',
              maxWidth: 540,
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}
          >
            <div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                // Work Order Dispatch
              </span>
              <h3 style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: 2 }}>
                Dispatch Maintenance: {selectedMachine?.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Review and finalize the maintenance work order to be dispatched to the shopfloor.
              </p>
            </div>

            <form onSubmit={handleDispatchWorkOrder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Task Type
                </label>
                <input
                  type="text"
                  required
                  value={dispatchData.task_type}
                  onChange={(e) => setDispatchData({ ...dispatchData, task_type: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Priority
                  </label>
                  <select
                    value={dispatchData.priority}
                    onChange={(e) => setDispatchData({ ...dispatchData, priority: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="High">High (Immediate Action)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Low">Low (Routine)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dispatchData.due_date}
                    onChange={(e) => setDispatchData({ ...dispatchData, due_date: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Corrective Directive &amp; Notes
                </label>
                <textarea
                  rows={3}
                  value={dispatchData.notes}
                  onChange={(e) => setDispatchData({ ...dispatchData, notes: e.target.value })}
                  className="input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 20px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <CalendarPlus size={15} />
                  <span>{isDispatching ? 'Dispatching...' : 'Confirm Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Cpu, FileSpreadsheet, Activity, CheckCircle2 } from 'lucide-react';

export function StepIndicator({ currentStep, setStep, canGoToStep2, canGoToStep3 }) {
  const steps = [
    {
      id: 1,
      title: 'Machine Selection',
      subtitle: 'Choose or Add Machine',
      icon: Cpu,
      isAccessible: true
    },
    {
      id: 2,
      title: 'Signal Telemetry',
      subtitle: 'Upload CSV & Graphs',
      icon: FileSpreadsheet,
      isAccessible: canGoToStep2
    },
    {
      id: 3,
      title: 'Diagnosis & Actions',
      subtitle: 'PDF Report & Dispatch',
      icon: Activity,
      isAccessible: canGoToStep3
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 20px',
        gap: 12,
        boxShadow: 'var(--shadow-card)',
        position: 'relative'
      }}
    >
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isClickable = step.isAccessible;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setStep(step.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'transparent',
                border: 'none',
                cursor: isClickable ? 'pointer' : 'not-allowed',
                opacity: isClickable ? 1 : 0.45,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s ease',
                outline: 'none',
                textAlign: 'left'
              }}
              className={`step-button ${isActive ? 'step-active' : ''}`}
            >
              {/* Step Icon Badge */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'all 0.25s ease',
                  background: isCompleted
                    ? 'var(--status-healthy-bg)'
                    : isActive
                    ? 'var(--accent-primary)'
                    : 'var(--bg-surface-raised)',
                  color: isCompleted
                    ? 'var(--status-healthy)'
                    : isActive
                    ? '#ffffff'
                    : 'var(--text-muted)',
                  border: isCompleted
                    ? '1px solid var(--status-healthy-border)'
                    : isActive
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isActive ? '0 0 14px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>

              {/* Step Text Info */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isActive ? 'var(--accent-primary)' : isCompleted ? 'var(--status-healthy)' : 'var(--text-muted)'
                  }}
                >
                  Step 0{step.id}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {step.title}
                </div>
              </div>
            </button>

            {/* Separator Line */}
            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: currentStep > idx + 1 ? 'var(--status-healthy)' : 'var(--border-subtle)',
                  transition: 'background 0.3s ease',
                  margin: '0 8px'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

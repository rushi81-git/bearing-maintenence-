import React from 'react';
import { UploadCloud, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

export function BearingStepper({ currentStep, setStep, canGoToStep2, canGoToStep3 }) {
  const steps = [
    {
      id: 1,
      title: '1. Ingestion & Config',
      subtitle: 'Machine selection & CSV upload',
      icon: UploadCloud,
      available: true
    },
    {
      id: 2,
      title: '2. Telemetry & Preview',
      subtitle: 'Waveform & FFT spectrum',
      icon: Activity,
      available: canGoToStep2
    },
    {
      id: 3,
      title: '3. AI Diagnosis & Plan',
      subtitle: 'Fault classification & actions',
      icon: CheckCircle2,
      available: canGoToStep3
    }
  ];

  return (
    <div
      className="card"
      style={{
        padding: '12px 18px',
        marginBottom: 20,
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id || (step.id === 2 && canGoToStep3);
          const isClickable = step.available;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (isClickable) setStep(step.id);
                }}
                disabled={!isClickable}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: isActive
                    ? 'var(--accent-subtle)'
                    : isCompleted
                    ? 'rgba(16, 217, 160, 0.06)'
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? 'var(--accent-border)'
                      : isCompleted
                      ? 'var(--status-healthy-border)'
                      : 'transparent'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  opacity: isClickable ? 1 : 0.45,
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  flex: '1 1 200px'
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive
                      ? 'var(--accent-primary)'
                      : isCompleted
                      ? 'var(--status-healthy)'
                      : 'var(--bg-surface-raised)',
                    color: isActive || isCompleted ? '#000000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isActive
                        ? 'var(--accent-primary)'
                        : isCompleted
                        ? 'var(--status-healthy)'
                        : 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {step.subtitle}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div
                  style={{
                    height: 1,
                    flex: '0 1 30px',
                    background: isCompleted ? 'var(--status-healthy)' : 'var(--border-strong)',
                    opacity: 0.5,
                    display: 'none' // Hidden on mobile, shown on desktop via CSS or flex
                  }}
                  className="stepper-connector"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-raised)',
        border: `1px solid ${isError ? 'var(--status-severe)' : isSuccess ? 'var(--status-healthy)' : 'var(--border-strong)'}`,
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
        fontSize: 13,
        fontWeight: 500,
        animation: 'fadeIn 0.2s ease forwards'
      }}
    >
      {isSuccess && <CheckCircle2 size={18} style={{ color: 'var(--status-healthy)', flexShrink: 0 }} />}
      {isError && <AlertCircle size={18} style={{ color: 'var(--status-severe)', flexShrink: 0 }} />}
      {!isSuccess && !isError && <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}

      <span style={{ flex: 1 }}>{toast.message}</span>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

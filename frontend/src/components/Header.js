import React from 'react';
import { Sun, Moon, Menu, Layers, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function Header({ title, subtitle, onOpenMobile }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '20px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 16,
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="btn btn-outline"
            style={{ padding: '8px', display: 'none' }}
          >
            <Menu size={18} />
          </button>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              // WORKSHOP AI SYSTEM
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* ML Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--status-healthy)' }} />
          <span>1024-Window CNN Active</span>
        </div>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="btn btn-outline"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} style={{ color: 'var(--status-mild)' }} />
              <span style={{ fontSize: 12 }}>Light</span>
            </>
          ) : (
            <>
              <Moon size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 12 }}>Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

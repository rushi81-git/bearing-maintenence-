import React from 'react';
import {
  Activity,
  LayoutDashboard,
  Cpu,
  History,
  Wrench,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'bearing', label: 'Bearing Analysis', icon: Activity, hero: true },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'machines', label: 'Machines', icon: Cpu },
  { id: 'history', label: 'Analysis History', icon: History },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
];

export function Sidebar({ currentTab, setTab, mobileOpen, closeMobile }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside
        style={{
          width: 250,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          flexShrink: 0,
          transition: 'transform 0.25s ease'
        }}
      >
        {/* App Branding */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} />
            </span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                Bearing AI Diagnostics
              </h1>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                v3.0 · CWRU Offline Trained
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '6px 12px 4px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Diagnostics
          </div>

          {NAV_ITEMS.map(({ id, label, icon: Icon, hero }) => {
            const isActive = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  if (closeMobile) closeMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: hero ? '12px 14px' : '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: hero && isActive
                    ? '1px solid var(--accent-border)'
                    : '1px solid transparent',
                  background: isActive
                    ? (hero ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)')
                    : 'transparent',
                  color: isActive
                    ? (hero ? 'var(--accent-primary)' : 'var(--text-primary)')
                    : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon
                  size={hero ? 18 : 16}
                  style={{
                    color: isActive ? (hero ? 'var(--accent-primary)' : 'var(--text-primary)') : 'var(--text-muted)',
                    flexShrink: 0
                  }}
                />
                <span style={{ flex: 1 }}>{label}</span>
                {hero && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-primary)',
                      color: '#000000',
                      letterSpacing: '0.04em'
                    }}
                  >
                    Hero
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6
          }}
        >
          <div>ADCET Mech Engg Minor Project</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>CWRU 1024-Window Model</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-healthy)' }} />
            <span style={{ fontSize: 10 }}>Inference Engine Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}

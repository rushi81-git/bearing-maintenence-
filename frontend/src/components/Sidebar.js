import React from 'react';
import { LayoutDashboard, CalendarClock, ShieldCheck } from 'lucide-react';

export function Sidebar({
  viewMode,
  setViewMode,
  mobileOpen,
  closeMobile,
  pendingCount = 0
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sub: '4-Step Sequential Diagnostic Pipeline',
      icon: LayoutDashboard
    },
    {
      id: 'schedule',
      label: 'Maintenance Schedule',
      sub: 'Dispatched Work Orders & Tasks',
      icon: CalendarClock,
      badge: pendingCount > 0 ? pendingCount : null
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 40,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside
        style={{
          width: 280,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          flexShrink: 0,
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)'
        }}
      >
        {/* App Industrial Branding */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-surface)',
                width: 42,
                height: 42,
                borderRadius: 0,
                border: '2px solid var(--card-border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2
                }}
              >
                Smart Workshop
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 2
                }}
              >
                Induction Motor Monitor
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Exactly 2 Options: Dashboard & Maintenance Schedule) */}
        <nav style={{ flex: 1, padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            System Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = viewMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                id={`nav-${item.id}`}
                onClick={() => {
                  setViewMode(item.id);
                  if (closeMobile) closeMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 0,
                  border: isActive
                    ? '2px solid var(--card-border-color)'
                    : '2px solid transparent',
                  background: isActive
                    ? 'var(--bg-surface-raised)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  boxShadow: isActive ? 'var(--shadow-xs)' : 'none'
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 0,
                    border: '1px solid var(--card-border-color)',
                    background: isActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--bg-surface)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.18s ease'
                  }}
                >
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--text-primary)' : 'inherit',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2
                    }}
                  >
                    {item.sub}
                  </div>
                </div>

                {item.badge && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--status-moderate)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Industrial System Telemetry Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
            background: 'var(--bg-surface-raised)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>ISO 10816-3 & CWRU</span>
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-base)', borderRadius: 4 }}>v3.4</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-healthy)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dual-Bearing DE/FE Engine Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}

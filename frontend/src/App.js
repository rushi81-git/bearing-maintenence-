import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { IndustrialDashboard } from './views/workflow/IndustrialDashboard';
import { Maintenance } from './views/Maintenance';
import { fetchMachines, fetchSchedule } from './services/api';

function AppContent() {
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'schedule'
  const [machines, setMachines] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load machines
  const loadMachines = useCallback(async () => {
    try {
      const res = await fetchMachines();
      if (res.success && res.data) {
        setMachines(res.data);
      }
    } catch (_) {}
  }, []);

  // Load pending maintenance count for sidebar badge
  const loadScheduleCount = useCallback(async () => {
    try {
      const res = await fetchSchedule();
      if (res.success && res.data) {
        const pending = res.data.filter(
          (s) => (s.status || '').toLowerCase() === 'pending' || (s.status || '').toLowerCase() === 'in_progress'
        ).length;
        setPendingCount(pending);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadMachines();
    loadScheduleCount();
  }, [loadMachines, loadScheduleCount]);

  // Toast notification helper
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const metaTitles = {
    dashboard: {
      title: 'Workshop Machinery Diagnostics',
      subtitle: 'Single-Page 4-Step Sequential Inspection Pipeline (ISO 10816-3 & CWRU Neural Analysis)'
    },
    schedule: {
      title: 'Maintenance Schedule & Work Orders',
      subtitle: 'Track dispatched inspection, overhaul, and bearing replacement tasks'
    }
  };

  const currentMeta = metaTitles[viewMode] || metaTitles.dashboard;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)'
      }}
    >
      {/* 2-Option Left Navigation Bar */}
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
        pendingCount={pendingCount}
      />

      {/* Main Content Workspace */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          gap: 20
        }}
      >
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* View Mode: Dashboard (Strict Sequential In-Page 4-Step Pipeline) */}
        {viewMode === 'dashboard' && (
          <IndustrialDashboard
            machines={machines}
            onRefreshMachines={loadMachines}
            onSwitchToSchedule={() => {
              loadScheduleCount();
              setViewMode('schedule');
            }}
            showToast={showToast}
          />
        )}

        {/* View Mode: Maintenance Schedule */}
        {viewMode === 'schedule' && (
          <Maintenance
            machines={machines}
            showToast={showToast}
          />
        )}
      </main>

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
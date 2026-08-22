import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { BearingAnalysis } from './views/BearingAnalysis';
import { Overview } from './views/Overview';
import { Machines } from './views/Machines';
import { AnalysisHistory } from './views/AnalysisHistory';
import { Maintenance } from './views/Maintenance';
import { fetchMachines } from './services/api';

const VIEW_TITLES = {
  bearing: {
    title: 'Bearing Vibration Analysis',
    subtitle: 'Upload CSV signals from operating machines for AI-driven fault classification and maintenance recommendations'
  },
  overview: {
    title: 'Fleet Overview',
    subtitle: 'High-level status of monitored equipment, recent diagnoses, and model benchmarks'
  },
  machines: {
    title: 'Workshop Machines',
    subtitle: 'Manage monitored equipment profiles and operational telemetry parameters'
  },
  history: {
    title: 'Analysis History',
    subtitle: 'Audit log of all bearing vibration diagnoses with filterable search'
  },
  maintenance: {
    title: 'Maintenance Scheduler',
    subtitle: 'Create, track, and complete bearing inspection and replacement work orders'
  }
};

function AppContent() {
  const [currentTab, setCurrentTab] = useState('bearing');
  const [machines, setMachines] = useState([]);
  const [toast, setToast] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedMachineForDiagnosis, setSelectedMachineForDiagnosis] = useState(null);

  // Load machines on mount
  const loadMachines = useCallback(async () => {
    try {
      const res = await fetchMachines();
      if (res.success) setMachines(res.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  // Toast handler with type support
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Navigate to bearing analysis with pre-selected machine
  const handleDiagnoseMachine = useCallback((machineId) => {
    setSelectedMachineForDiagnosis(machineId);
    setCurrentTab('bearing');
  }, []);

  const meta = VIEW_TITLES[currentTab] || VIEW_TITLES.bearing;

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
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
          setSelectedMachineForDiagnosis(null);
        }}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* View Routing */}
        {currentTab === 'bearing' && (
          <BearingAnalysis
            machines={machines}
            showToast={showToast}
            preSelectedMachineId={selectedMachineForDiagnosis}
          />
        )}
        {currentTab === 'overview' && (
          <Overview
            machines={machines}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'machines' && (
          <Machines
            machines={machines}
            onRefresh={loadMachines}
            showToast={showToast}
            onDiagnoseMachine={handleDiagnoseMachine}
          />
        )}
        {currentTab === 'history' && (
          <AnalysisHistory
            machines={machines}
            showToast={showToast}
          />
        )}
        {currentTab === 'maintenance' && (
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
import React, { useState, useMemo } from 'react';
import { Sliders, Zap, Activity, Gauge, Disc, Play, ShieldAlert } from 'lucide-react';
import { calculateFaultFrequencies, synthesizeBearingSignal, BEARING_SPECS } from '../../utils/bearingKinematics';

export function SignalSynthesizerCard({ onSynthesizeSignal }) {
  const [faultType, setFaultType] = useState('IR'); // 'Normal' | 'IR' | 'OR' | 'Ball'
  const [faultSizeInches, setFaultSizeInches] = useState(0.014);
  const [rpm, setRpm] = useState(1797);
  const [loadHp, setLoadHp] = useState(1);
  const [snrDb, setSnrDb] = useState(25);
  const [sampleCount, setSampleCount] = useState(2048);

  // Compute live kinematic frequencies
  const kinematics = useMemo(() => calculateFaultFrequencies(rpm), [rpm]);

  const handleGenerate = () => {
    const signal = synthesizeBearingSignal({
      faultType,
      faultSizeInches: faultType === 'Normal' ? 0 : faultSizeInches,
      rpm,
      loadHp,
      snrDb,
      sampleCount,
      samplingRateHz: 48000
    });

    const faultLabel = faultType === 'Normal' 
      ? 'Normal_Baseline' 
      : `${faultType}_0${Math.round(faultSizeInches * 1000)}`;

    onSynthesizeSignal({
      signal,
      filename: `simulated_${faultLabel.toLowerCase()}_${rpm}rpm.csv`,
      samplingRateHz: 48000,
      signalUnit: 'g',
      faultKey: faultLabel,
      meta: {
        rpm,
        loadHp,
        snrDb,
        faultType,
        faultSizeInches,
        kinematics
      }
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '16px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sliders size={15} />
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Kinematic Vibration Synthesizer
            </h4>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Model physical impact ringdown & race kinematics
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface-raised)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          SKF 6205-2RS
        </span>
      </div>

      {/* Defect Location Selector Pills */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Defect Injection Target:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { id: 'Normal', label: 'Healthy', desc: 'No fault' },
            { id: 'IR', label: 'Inner Race', desc: 'BPFI impact' },
            { id: 'OR', label: 'Outer Race', desc: 'BPFO impact' },
            { id: 'Ball', label: 'Ball Element', desc: 'BSF impact' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFaultType(opt.id)}
              style={{
                padding: '7px 4px',
                textAlign: 'center',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${faultType === opt.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: faultType === opt.id ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)',
                color: faultType === opt.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700 }}>{opt.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Defect Size & Load Selection (only if defect present) */}
      {faultType !== 'Normal' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Defect Depth:
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0.007, 0.014, 0.021].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFaultSizeInches(size)}
                  style={{
                    flex: 1,
                    padding: '5px 2px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: faultSizeInches === size ? 700 : 500,
                    border: `1px solid ${faultSizeInches === size ? 'var(--status-mild)' : 'var(--border-subtle)'}`,
                    background: faultSizeInches === size ? 'var(--status-mild-bg)' : 'var(--bg-surface-raised)',
                    color: faultSizeInches === size ? 'var(--status-mild)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  {size}"
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Motor Load:
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2, 3].map(hp => (
                <button
                  key={hp}
                  type="button"
                  onClick={() => setLoadHp(hp)}
                  style={{
                    flex: 1,
                    padding: '5px 2px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: loadHp === hp ? 700 : 500,
                    border: `1px solid ${loadHp === hp ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: loadHp === hp ? 'var(--accent-subtle)' : 'var(--bg-surface-raised)',
                    color: loadHp === hp ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  {hp} HP
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shaft RPM Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Shaft Operating Speed:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
            {rpm} RPM ({kinematics.fr} Hz)
          </span>
        </div>
        <input
          type="range"
          min="1720"
          max="1800"
          step="5"
          value={rpm}
          onChange={e => setRpm(parseInt(e.target.value, 10))}
          style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>1720 RPM (3 HP full load)</span>
          <span>1797 RPM (0 HP no load)</span>
        </div>
      </div>

      {/* Live Calculated Kinematic Fault Frequencies Strip */}
      <div
        style={{
          background: 'var(--bg-surface-sunken)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>1X SHAFT</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {kinematics.fr} Hz
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BPFO (Outer)</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: faultType === 'OR' ? 'var(--status-severe)' : 'var(--text-primary)' }}>
            {kinematics.bpfo} Hz
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BPFI (Inner)</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: faultType === 'IR' ? 'var(--status-mild)' : 'var(--text-primary)' }}>
            {kinematics.bpfi} Hz
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BSF (Ball)</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: faultType === 'Ball' ? 'var(--status-healthy)' : 'var(--text-primary)' }}>
            {kinematics.bsf} Hz
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '9px 16px',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        <Zap size={14} />
        <span>Synthesize & Load Telemetry</span>
      </button>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Sparkles,
  Sliders,
  FileText
} from 'lucide-react';

export function SignalUploadCard({
  sourceFilename,
  sourceType,
  sampleCount,
  parsedCsv,
  selectedColumnIndex,
  onColumnChange,
  samplingRateHz,
  onSamplingRateChange,
  signalUnit,
  onSignalUnitChange,
  onFileUpload,
  onClearSignal,
  onOpenDemoDrawer
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        // synthesize event or pass directly
        onFileUpload({ target: { files: [file] } });
      }
    }
  };

  const isSignalValid = sampleCount >= 1024;
  const isDemo = sourceType === 'demo';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)'
          }}
        >
          2. Vibration Signal Ingestion
        </label>

        {/* Secondary Try Demo Data Button */}
        <button
          type="button"
          onClick={onOpenDemoDrawer}
          className="btn btn-ghost"
          style={{
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--accent-primary)',
            background: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Sparkles size={13} />
          Try Demo Data
        </button>
      </div>

      {/* Drag & Drop Upload Zone (if no file or to replace) */}
      {!sourceFilename || sourceFilename === 'machine_vibration.csv' && sampleCount === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px 20px',
            textAlign: 'center',
            background: isDragging ? 'var(--accent-subtle)' : 'var(--bg-surface-sunken)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={onFileUpload}
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}
          >
            <UploadCloud size={24} />
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isDragging ? 'Drop CSV File Here' : 'Click or Drag Vibration CSV'}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Supports single or multi-channel time-series data (.csv, .txt)
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-primary)',
              background: 'var(--bg-surface)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Minimum 1024 numeric samples required
          </div>
        </div>
      ) : (
        /* Uploaded File Details Card */
        <div
          style={{
            background: 'var(--bg-surface-raised)',
            border: `1px solid ${isSignalValid ? 'var(--status-healthy-border)' : 'var(--status-mild-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {/* File Name & Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: isDemo ? 'rgba(251, 191, 36, 0.12)' : 'var(--accent-subtle)',
                  color: isDemo ? 'var(--status-mild)' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isDemo ? <Sparkles size={18} /> : <FileSpreadsheet size={18} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={sourceFilename}
                >
                  {sourceFilename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{isDemo ? 'CWRU Demonstration Sample' : 'Custom Upload'}</span>
                  <span>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: isSignalValid ? 'var(--status-healthy)' : 'var(--status-severe)', fontWeight: 600 }}>
                    {sampleCount.toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: 11 }}
                title="Replace CSV File"
              >
                <RefreshCw size={12} />
                Change
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={onFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={onClearSignal}
                className="btn btn-ghost"
                style={{ padding: '6px', color: 'var(--status-severe)' }}
                title="Clear File"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Validation Alert */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: isSignalValid ? 'var(--status-healthy-bg)' : 'var(--status-severe-bg)',
              border: `1px solid ${isSignalValid ? 'var(--status-healthy-border)' : 'var(--status-severe-border)'}`,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: isSignalValid ? 'var(--status-healthy)' : 'var(--status-severe)'
            }}
          >
            {isSignalValid ? (
              <>
                <CheckCircle2 size={14} />
                <span>
                  <strong>Signal Valid:</strong> {Math.floor(sampleCount / 1024)} window(s) ready for 1D CNN inference.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>
                  <strong>Insufficient Data:</strong> CSV contains {sampleCount} samples. Minimum 1024 required.
                </span>
              </>
            )}
          </div>

          {/* Multi-Column Selector (if CSV has > 1 column) */}
          {parsedCsv && parsedCsv.columns && parsedCsv.columns.length > 1 && (
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Selected Vibration Channel:
              </label>
              <select
                className="select-field"
                value={selectedColumnIndex}
                onChange={e => onColumnChange(parseInt(e.target.value, 10))}
                style={{ fontSize: 12, padding: '7px 10px' }}
              >
                {parsedCsv.columns.map(col => (
                  <option key={col.columnIndex} value={col.columnIndex}>
                    {col.columnName} ({col.sampleCount.toLocaleString()} samples)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Acquisition Settings Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                Sampling Rate (Fs)
              </label>
              <select
                className="select-field"
                value={samplingRateHz}
                onChange={e => onSamplingRateChange(parseInt(e.target.value, 10))}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value={48000}>48,000 Hz (CWRU)</option>
                <option value={12000}>12,000 Hz</option>
                <option value={20000}>20,000 Hz</option>
                <option value={25600}>25,600 Hz</option>
                <option value={0}>Normalized / Raw</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                Acceleration Unit
              </label>
              <select
                className="select-field"
                value={signalUnit}
                onChange={e => onSignalUnitChange(e.target.value)}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value="g">g (standard)</option>
                <option value="m/s²">m/s²</option>
                <option value="mm/s">mm/s (velocity)</option>
                <option value="V">V (raw voltage)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

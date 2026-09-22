import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, FastForward, Sliders, Headphones } from 'lucide-react';
import { playVibrationAudio, stopVibrationAudio, setAudioVolume } from '../../utils/audioStethoscope';

export function AcousticStethoscope({ signal, samplingRateHz = 48000, title = 'Acoustic Stethoscope' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0); // 1.0 or 0.5
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);

  // Stop playback when signal unmounts or changes
  useEffect(() => {
    return () => {
      stopVibrationAudio();
    };
  }, [signal]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopVibrationAudio();
      setIsPlaying(false);
    } else {
      if (!signal || signal.length === 0) return;
      playVibrationAudio(signal, {
        playbackRate,
        volume: isMuted ? 0 : volume,
        loop: true,
        onEnd: () => setIsPlaying(false)
      });
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    if (isPlaying) {
      stopVibrationAudio();
      playVibrationAudio(signal, {
        playbackRate: rate,
        volume: isMuted ? 0 : volume,
        loop: true
      });
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (!isMuted) {
      setAudioVolume(val);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setAudioVolume(nextMuted ? 0 : volume);
  };

  if (!signal || signal.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--bg-surface-raised)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {/* Title & Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: isPlaying ? 'var(--status-healthy-bg)' : 'var(--bg-surface-sunken)',
            border: `1px solid ${isPlaying ? 'var(--status-healthy-border)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPlaying ? 'var(--status-healthy)' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <Headphones size={16} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </span>
            {isPlaying && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--status-healthy)',
                  background: 'var(--status-healthy-bg)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700
                }}
              >
                SONIFYING
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Audibly inspect race impact frequency & friction
          </p>
        </div>
      </div>

      {/* Controls: Play/Stop, Speed, Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Speed toggle pills */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-sunken)',
            padding: 2,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => handleRateChange(1.0)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: playbackRate === 1.0 ? 'var(--bg-surface-raised)' : 'transparent',
              color: playbackRate === 1.0 ? 'var(--accent-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            1.0x Real
          </button>
          <button
            type="button"
            onClick={() => handleRateChange(0.5)}
            title="0.5x Slow Motion lets you clearly hear individual defect impact clicks"
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: playbackRate === 0.5 ? 'var(--bg-surface-raised)' : 'transparent',
              color: playbackRate === 0.5 ? 'var(--status-mild)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            0.5x Slow-Mo
          </button>
        </div>

        {/* Volume slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleToggleMute}
            style={{
              background: 'none',
              border: 'none',
              color: isMuted ? 'var(--status-severe)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 2
            }}
          >
            {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: 60, height: 4, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
          />
        </div>

        {/* Primary Play/Pause Button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {isPlaying ? (
            <>
              <Square size={13} fill="currentColor" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

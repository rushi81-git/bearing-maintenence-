/**
 * Acoustic Stethoscope — Web Audio API Vibration Sonifier
 * Converts machine accelerometer vibration time-series into audible acoustic sound.
 * Allows engineers to audibly detect periodic race knocking, cage friction, and spalling.
 */

let audioCtx = null;
let currentSource = null;
let currentGain = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Stop any ongoing vibration playback
 */
export function stopVibrationAudio() {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch (_) {}
    currentSource = null;
  }
}

/**
 * Play a vibration signal through the browser audio output
 * @param {Array<number>} signal - Vibration samples array
 * @param {Object} options - Playback options
 * @returns {Function} stop callback
 */
export function playVibrationAudio(signal, {
  playbackRate = 1.0,
  volume = 0.5,
  loop = true,
  onEnd = null
} = {}) {
  if (!signal || signal.length === 0) return () => {};

  stopVibrationAudio();

  const ctx = getAudioContext();
  if (!ctx) return () => {};

  // Normalize vibration samples to -1.0 .. +1.0 for audio buffer
  let maxAbs = 0.001;
  for (let i = 0; i < signal.length; i++) {
    const abs = Math.abs(signal[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  // Create audio buffer (repeat short windows so it sounds continuous if looped)
  const targetLen = Math.max(signal.length, 4096);
  const audioBuffer = ctx.createBuffer(1, targetLen, 44100);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < targetLen; i++) {
    const sampleVal = signal[i % signal.length] / maxAbs;
    // Apply soft tanh compression to prevent harsh clipping
    channelData[i] = Math.tanh(sampleVal * 0.9);
  }

  // Create nodes
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = loop;
  source.playbackRate.value = Math.max(0.2, Math.min(2.0, playbackRate));

  // Bandpass filter to isolate audible bearing rumble & defect clicks (120 Hz - 3500 Hz)
  const biquad = ctx.createBiquadFilter();
  biquad.type = 'bandpass';
  biquad.frequency.value = 1200;
  biquad.Q.value = 0.8;

  // Master Gain with gentle limiter
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(Math.max(0, Math.min(1.0, volume)), ctx.currentTime);

  source.connect(biquad);
  biquad.connect(gainNode);
  gainNode.connect(ctx.destination);

  currentSource = source;
  currentGain = gainNode;

  source.onended = () => {
    if (currentSource === source) {
      currentSource = null;
    }
    if (onEnd) onEnd();
  };

  source.start(0);

  return stopVibrationAudio;
}

/**
 * Adjust volume on the fly
 */
export function setAudioVolume(vol) {
  if (currentGain && audioCtx) {
    currentGain.gain.setValueAtTime(Math.max(0, Math.min(1.0, vol)), audioCtx.currentTime);
  }
}

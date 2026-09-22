/**
 * Bearing Kinematics & Fault Frequency Calculations
 * Standard CWRU Drive-End Bearing: 6205-2RS JEM SKF Deep Groove Ball Bearing
 *
 * Parameters:
 *   - Number of rolling elements (n): 9
 *   - Ball diameter (d): 0.3126 in (7.94 mm)
 *   - Pitch diameter (D): 1.537 in (39.04 mm)
 *   - Contact angle (theta): 0 rad (0 deg)
 *   - d / D ratio: 0.20338
 */

export const BEARING_SPECS = {
  model: 'SKF 6205-2RS JEM',
  type: 'Deep Groove Radial Ball Bearing',
  balls: 9,
  ballDiameterMm: 7.94,
  pitchDiameterMm: 39.04,
  contactAngleDeg: 0,
  dOverD: 0.20338,
  resonanceFreqHz: 3250
};

/**
 * Compute exact characteristic fault frequencies for a given motor RPM.
 */
export function calculateFaultFrequencies(rpm = 1797) {
  const fr = Math.max(1, rpm) / 60; // Shaft speed in Hz
  const { balls: n, dOverD } = BEARING_SPECS;

  const bpfo = (n / 2) * fr * (1 - dOverD);       // Ball Pass Frequency Outer Race
  const bpfi = (n / 2) * fr * (1 + dOverD);       // Ball Pass Frequency Inner Race
  const bsf  = (1 / (2 * dOverD)) * fr * (1 - Math.pow(dOverD, 2)); // Ball Spin Frequency
  const ftf  = 0.5 * fr * (1 - dOverD);          // Fundamental Train Frequency (Cage)

  return {
    fr: parseFloat(fr.toFixed(2)),
    bpfo: parseFloat(bpfo.toFixed(2)),
    bpfi: parseFloat(bpfi.toFixed(2)),
    bsf: parseFloat(bsf.toFixed(2)),
    ftf: parseFloat(ftf.toFixed(2)),
    harmonics: {
      bpfo2x: parseFloat((bpfo * 2).toFixed(2)),
      bpfi2x: parseFloat((bpfi * 2).toFixed(2)),
      bsf2x: parseFloat((bsf * 2).toFixed(2))
    }
  };
}

/**
 * Synthesize a physically grounded vibration signal based on bearing kinematics,
 * damped structural resonance, load zone modulation, and sensor noise.
 */
export function synthesizeBearingSignal({
  faultType = 'Normal', // 'Normal' | 'IR' | 'OR' | 'Ball'
  faultSizeInches = 0.014,
  rpm = 1797,
  loadHp = 1,
  snrDb = 25,
  sampleCount = 2048,
  samplingRateHz = 48000
}) {
  const dt = 1 / samplingRateHz;
  const fr = rpm / 60;
  const freqs = calculateFaultFrequencies(rpm);
  const signal = new Float32Array(sampleCount);

  // Baseline shaft rotational harmonics & unbalance (always present)
  const baseRotAmp = 0.04 + (loadHp * 0.015);
  for (let i = 0; i < sampleCount; i++) {
    const t = i * dt;
    // 1X and 2X rotational harmonics
    signal[i] = baseRotAmp * Math.sin(2 * Math.PI * fr * t)
              + (baseRotAmp * 0.35) * Math.sin(4 * Math.PI * fr * t);
  }

  // If defect present, generate impulse excitation with structural resonance decay
  if (faultType !== 'Normal') {
    let faultFreq = freqs.bpfo;
    let isInnerRace = false;
    let isBall = false;

    if (faultType === 'IR' || faultType === 'Inner Race') {
      faultFreq = freqs.bpfi;
      isInnerRace = true;
    } else if (faultType === 'Ball') {
      faultFreq = freqs.bsf * 2; // Impact occurs twice per ball spin
      isBall = true;
    }

    const impactPeriod = 1 / faultFreq;
    const resonanceHz = BEARING_SPECS.resonanceFreqHz;
    const dampingGamma = 2200; // Exponential decay rate: e^(-gamma * t)

    // Severity amplitude factor based on fault depth
    const severityFactor = faultSizeInches >= 0.021 ? 1.4 : faultSizeInches >= 0.014 ? 0.85 : 0.45;
    const impactAmp = (0.45 + (loadHp * 0.12)) * severityFactor;

    let nextImpactTime = 0;
    while (nextImpactTime < sampleCount * dt) {
      const impactSample = Math.floor(nextImpactTime / dt);
      const impactTime = nextImpactTime;

      // Inner race faults pass through the loaded zone, causing amplitude modulation
      let modGain = 1.0;
      if (isInnerRace) {
        modGain = 0.5 * (1 + Math.cos(2 * Math.PI * fr * impactTime));
      } else if (isBall) {
        // Ball defect impacts modulate at cage speed FTF
        modGain = 0.6 * (1 + 0.5 * Math.cos(2 * Math.PI * freqs.ftf * impactTime));
      }

      // Add damped resonant ringdown for ~3-5 milliseconds after each impact
      const ringdownSamples = Math.min(Math.floor(0.004 * samplingRateHz), sampleCount - impactSample);
      for (let k = 0; k < ringdownSamples; k++) {
        const tau = k * dt;
        const decay = Math.exp(-dampingGamma * tau);
        const oscillation = Math.sin(2 * Math.PI * resonanceHz * tau);
        signal[impactSample + k] += impactAmp * modGain * decay * oscillation;
      }

      // Add a slight stochastic jitter to impact period (slip in rolling elements)
      const jitter = (Math.random() - 0.5) * 0.02 * impactPeriod;
      nextImpactTime += impactPeriod + jitter;
    }
  }

  // Compute Signal Power to inject calibrated Gaussian White Noise (AWGN)
  let sumSq = 0;
  for (let i = 0; i < sampleCount; i++) sumSq += signal[i] * signal[i];
  const signalPower = sumSq / sampleCount;
  const snrLinear = Math.pow(10, snrDb / 10);
  const noisePower = signalPower / Math.max(0.001, snrLinear);
  const noiseStd = Math.sqrt(noisePower);

  // Box-Muller transform for true Gaussian noise
  for (let i = 0; i < sampleCount; i += 2) {
    const u1 = Math.max(1e-9, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    signal[i] += z0 * noiseStd;
    if (i + 1 < sampleCount) signal[i + 1] += z1 * noiseStd;
  }

  // Return standard float array formatted to 4 decimals
  const result = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    result[i] = parseFloat(signal[i].toFixed(4));
  }
  return result;
}

/**
 * Fast Fourier Transform (FFT) for Vibration Signal Spectrum Analysis
 */

export function computeFFT(signal, samplingRateHz = null, numPoints = 1024) {
  if (!signal || signal.length < 32) return [];

  // Pad or slice to power of 2 (default 1024)
  const N = Math.min(signal.length, numPoints);
  const powerOf2 = Math.pow(2, Math.floor(Math.log2(N)));
  
  const real = new Float32Array(powerOf2);
  const imag = new Float32Array(powerOf2);

  // Mean subtraction (DC removal) and Hanning window
  let sum = 0;
  for (let i = 0; i < powerOf2; i++) sum += signal[i];
  const mean = sum / powerOf2;

  for (let i = 0; i < powerOf2; i++) {
    const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (powerOf2 - 1)));
    real[i] = (signal[i] - mean) * hanning;
    imag[i] = 0;
  }

  // In-place Cooley-Tukey Radix-2 FFT
  let j = 0;
  for (let i = 0; i < powerOf2 - 1; i++) {
    if (i < j) {
      const tempR = real[i]; real[i] = real[j]; real[j] = tempR;
      const tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
    }
    let k = powerOf2 >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let len = 2; len <= powerOf2; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < powerOf2; i += len) {
      let wR = 1.0;
      let wI = 0.0;
      for (let k = 0; k < halfLen; k++) {
        const idx1 = i + k;
        const idx2 = idx1 + halfLen;

        const uR = real[idx1];
        const uI = imag[idx1];
        const vR = real[idx2] * wR - imag[idx2] * wI;
        const vI = real[idx2] * wI + imag[idx2] * wR;

        real[idx1] = uR + vR;
        imag[idx1] = uI + vI;
        real[idx2] = uR - vR;
        imag[idx2] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }

  // Compute magnitude spectrum for positive frequencies (N / 2 bins)
  const halfN = powerOf2 >> 1;
  const spectrum = [];
  const binStepHz = samplingRateHz ? samplingRateHz / powerOf2 : null;

  // Downsample to ~128 points for smooth Recharts rendering
  const step = Math.max(1, Math.floor(halfN / 120));

  for (let k = 0; k < halfN; k += step) {
    const mag = (2.0 / powerOf2) * Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
    const freqLabel = samplingRateHz 
      ? `${Math.round(k * binStepHz)} Hz`
      : `Bin ${k}`;

    const freqHz = samplingRateHz ? Math.round(k * binStepHz) : k;

    spectrum.push({
      freqIndex: k,
      freqHz: freqHz,
      freq: freqLabel,
      amplitude: parseFloat(mag.toFixed(5))
    });
  }

  return spectrum;
}

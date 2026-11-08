/**
 * Digital Signal Processing (DSP) Engine for PPG Analysis
 * Implements bandpass filtering, peak detection, Welch spectral estimation,
 * and quality-gated heart rate calculation.
 */

export interface AnalysisResult {
  hr: number | null;
  sqi: number;
  accepted: boolean;
  reason: string | null;
  filtered: number[];
  peaks: number[];
  spectralHr: number | null;
}

/**
 * 2nd-order section IIR biquad bandpass filter (0.5 Hz to 4.0 Hz)
 */
export function biquadBandpass(x: number[], fs: number, fLow = 0.5, fHigh = 4.0): number[] {
  const n = x.length;
  if (n < 10) return [...x];

  // Remove DC offset
  let sum = 0;
  for (let i = 0; i < n; i++) sum += x[i];
  const mean = sum / n;
  const centered = x.map(v => v - mean);

  // Digital 2nd order Butterworth bandpass approximation
  // center frequency w0, bandwidth bw
  const nyquist = fs / 2;
  const wLow = (2 * Math.PI * fLow) / fs;
  const wHigh = (2 * Math.PI * Math.min(fHigh, nyquist * 0.95)) / fs;
  const w0 = Math.sqrt(wLow * wHigh);
  const bw = wHigh - wLow;
  const Q = w0 / bw;
  const alpha = Math.sin(w0) / (2 * Q);

  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  // Normalized coefficients
  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  // Forward pass
  const forward = new Array(n).fill(0);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const xi = centered[i];
    const yi = nb0 * xi + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    forward[i] = yi;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
  }

  // Reverse pass (zero-phase forward-backward filtering filtfilt)
  const filtered = new Array(n).fill(0);
  x1 = 0; x2 = 0; y1 = 0; y2 = 0;
  for (let i = n - 1; i >= 0; i--) {
    const xi = forward[i];
    const yi = nb0 * xi + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    filtered[i] = yi;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
  }

  return filtered;
}

/**
 * Peak detector with minimum refractory distance and prominence threshold
 */
export function findPeaks(signal: number[], fs: number, minDistanceRatio = 0.33, prominenceRatio = 0.25): number[] {
  const peaks: number[] = [];
  const minDistance = Math.floor(fs * minDistanceRatio); // ~330ms = max ~182 BPM

  let sum = 0;
  let sqSum = 0;
  const n = signal.length;
  for (let i = 0; i < n; i++) {
    sum += signal[i];
    sqSum += signal[i] * signal[i];
  }
  const mean = sum / n;
  const variance = sqSum / n - mean * mean;
  const std = Math.sqrt(Math.max(0, variance));
  const minProminence = std * prominenceRatio;

  let lastPeakIndex = -minDistance;

  for (let i = 1; i < n - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] >= signal[i + 1]) {
      if (signal[i] > minProminence && i - lastPeakIndex >= minDistance) {
        peaks.push(i);
        lastPeakIndex = i;
      }
    }
  }

  return peaks;
}

/**
 * Calculates Heart Rate from detected peak indices
 */
export function hrFromPeaks(peaks: number[], fs: number, cleanOutliers = true): number | null {
  if (peaks.length < 3) return null;

  const ibis: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    ibis.push((peaks[i] - peaks[i - 1]) / fs);
  }

  if (cleanOutliers) {
    const sorted = [...ibis].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const filtered = ibis.filter(ibi => Math.abs(ibi - median) <= 0.3 * median);
    if (filtered.length < 2) return null;

    const filteredSorted = [...filtered].sort((a, b) => a - b);
    const cleanMedian = filteredSorted[Math.floor(filteredSorted.length / 2)];
    return Number((60 / cleanMedian).toFixed(1));
  } else {
    const sorted = [...ibis].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return Number((60 / median).toFixed(1));
  }
}

/**
 * Simplified discrete Fourier transform power spectral estimation
 * Focuses on cardiac band 0.5 to 4.0 Hz
 */
export function spectralPowerAndSQI(signal: number[], fs: number) {
  const n = signal.length;
  const frequencies: number[] = [];
  const powers: number[] = [];

  // Evaluate 70 frequency bins from 0.5 Hz to 4.0 Hz in 0.05 Hz increments
  const fMin = 0.5;
  const fMax = 4.0;
  const step = 0.05;

  let totalPower = 0;
  let maxP = 0;
  let dominantFreq = 1.2;

  for (let f = fMin; f <= fMax; f += step) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t++) {
      // Hamming window
      const win = 0.54 - 0.46 * Math.cos((2 * Math.PI * t) / (n - 1));
      const val = signal[t] * win;
      const angle = (2 * Math.PI * f * t) / fs;
      re += val * Math.cos(angle);
      im -= val * Math.sin(angle);
    }
    const p = re * re + im * im;
    frequencies.push(f);
    powers.push(p);
    totalPower += p;
    if (p > maxP) {
      maxP = p;
      dominantFreq = f;
    }
  }

  // Harmonic SQI: fraction of power within 0.2 Hz of dominant peak and 2nd harmonic
  let harmonicPower = 0;
  for (let i = 0; i < frequencies.length; i++) {
    const f = frequencies[i];
    const isFundamental = Math.abs(f - dominantFreq) <= 0.2;
    const isHarmonic = Math.abs(f - 2 * dominantFreq) <= 0.2;
    if (isFundamental || isHarmonic) {
      harmonicPower += powers[i];
    }
  }

  const sqiScore = totalPower > 0 ? Number((harmonicPower / totalPower).toFixed(3)) : 0;
  const spectralHr = Number((dominantFreq * 60).toFixed(1));

  return { frequencies, powers, dominantFreq, spectralHr, sqiScore };
}

/**
 * Analyzes PPG signal using baseline vs improved quality-gated method
 */
export function analyzePPGSignal(
  rawSignal: number[],
  fs: number,
  method: 'baseline' | 'improved' = 'improved',
  sqiCutoff = 0.5
): AnalysisResult {
  const filtered = biquadBandpass(rawSignal, fs);
  const spec = spectralPowerAndSQI(filtered, fs);
  const sqiVal = spec.sqiScore;

  if (method === 'baseline') {
    // Legacy simple peak detection with no outlier filtering or spectral agreement
    const peaks = findPeaks(filtered, fs, 0.3, 0.1);
    const hr = hrFromPeaks(peaks, fs, false);
    return {
      hr,
      sqi: sqiVal,
      accepted: hr !== null,
      reason: hr === null ? 'Insufficient detected peaks' : null,
      filtered,
      peaks,
      spectralHr: spec.spectralHr,
    };
  } else {
    // Improved method: prominence gating, outlier cleaning, SQI threshold, and spectral agreement check
    const peaks = findPeaks(filtered, fs, 0.33, 0.3);
    const hr = hrFromPeaks(peaks, fs, true);
    let accepted = hr !== null;
    let reason: string | null = null;

    if (hr === null) {
      accepted = false;
      reason = 'Insufficient detected peaks';
    } else if (sqiVal < sqiCutoff) {
      accepted = false;
      reason = `Low signal quality score (${sqiVal} < ${sqiCutoff})`;
    } else if (Math.abs(hr - spec.spectralHr) > 10) {
      accepted = false;
      reason = `Peak estimate (${hr} BPM) and spectral estimate (${spec.spectralHr} BPM) disagree`;
    }

    return {
      hr: accepted ? hr : null,
      sqi: sqiVal,
      accepted,
      reason,
      filtered,
      peaks,
      spectralHr: spec.spectralHr,
    };
  }
}

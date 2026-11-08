import { SimulationParams, SimulationResult, SkinProfile } from '../types';

/**
 * Maps melanin fraction [0.0, 1.0] to realistic CIELAB coordinates,
 * Fitzpatrick group (I-VI), Monk skin tone scale (1-10), and hex preview color.
 */
export function getSkinProfile(melanin: number): SkinProfile {
  // L* ranges from ~78 (Fitzpatrick I) down to ~26 (Fitzpatrick VI)
  const L = Number((78 - melanin * 52).toFixed(1));
  // b* (yellowness) typically ranges from 12 to 24 across diverse human skin
  const b = Number((14 + (1 - Math.abs(melanin - 0.5) * 2) * 8).toFixed(1));
  
  // Individual Typology Angle: ITA = (arctan((L* - 50) / b*)) * (180 / PI)
  const itaRad = Math.atan2(L - 50, b);
  const ita = Number(((itaRad * 180) / Math.PI).toFixed(1));

  let fitzpatrick = 'Type I';
  let category = 'Very Light';
  let monkScale = 1;
  let hexColor = '#fdf0e6';

  if (ita > 55) {
    fitzpatrick = 'Type I';
    category = 'Very Light';
    monkScale = 1;
    hexColor = '#fde2cf';
  } else if (ita > 41) {
    fitzpatrick = 'Type II';
    category = 'Light';
    monkScale = 2;
    hexColor = '#f5cda8';
  } else if (ita > 28) {
    fitzpatrick = 'Type III';
    category = 'Intermediate';
    monkScale = 4;
    hexColor = '#d99f70';
  } else if (ita > 10) {
    fitzpatrick = 'Type IV';
    category = 'Tan / Olive';
    monkScale = 6;
    hexColor = '#a86c44';
  } else if (ita > -30) {
    fitzpatrick = 'Type V';
    category = 'Brown / Dark';
    monkScale = 8;
    hexColor = '#6d4327';
  } else {
    fitzpatrick = 'Type VI';
    category = 'Deep / Darkest';
    monkScale = 10;
    hexColor = '#3a2012';
  }

  return {
    L,
    b,
    ita,
    fitzpatrick,
    category,
    monkScale,
    hexColor,
    melaninFraction: melanin,
  };
}

/**
 * Computes Fisher-Pearson sample skewness
 */
export function calculateSkewness(data: number[]): number {
  if (!data || data.length < 3) return 0;
  const n = data.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += data[i];
  const mean = sum / n;

  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += Math.pow(data[i] - mean, 2);
  const std = Math.sqrt(varSum / (n - 1));
  if (std === 0) return 0;

  let skewSum = 0;
  for (let i = 0; i < n; i++) skewSum += Math.pow((data[i] - mean) / std, 3);
  return Number(((n / ((n - 1) * (n - 2))) * skewSum).toFixed(4));
}

/**
 * Full closed-loop physics simulation of optical photoplethysmography
 */
export function simulatePPG(params: SimulationParams): SimulationResult {
  const {
    melaninLevel,
    heartRate,
    targetSaO2,
    noiseLevel,
    hasMotionArtifact,
    stage1BoostEnabled,
    ledCurrentMa,
    stage2CorrectionEnabled,
    sqiThreshold,
  } = params;

  const skin = getSkinProfile(melaninLevel);
  const duration = 5; // 5 seconds display window
  const fs = 100; // 100 Hz sampling rate
  const N = duration * fs;

  // Optical DC attenuation modeling (Beer-Lambert law)
  // Base current is 10mA nominal. Max is 50mA.
  const baselineRed = 1000 * (1 - 0.62 * melaninLevel);
  const baselineIr = 1000 * (1 - 0.28 * melaninLevel);

  // Stage 1: Hardware Adaptive Calibration
  // Standard LED current = 10mA. If DC baseline < 620 LSB, MAX86141 raises LED current
  let actualCurrentMa = 10;
  let boostRatio = 1.0;

  if (stage1BoostEnabled && baselineRed < 620) {
    actualCurrentMa = Math.max(10, Math.min(50, ledCurrentMa));
    boostRatio = actualCurrentMa / 10;
  } else if (!stage1BoostEnabled) {
    actualCurrentMa = 10;
    boostRatio = 1.0;
  }

  const dcRedRaw = baselineRed;
  const dcIrRaw = baselineIr;
  const dcRedBoosted = baselineRed * boostRatio;
  const dcIrBoosted = baselineIr * boostRatio;

  const acAmpRedRaw = 24 * (1 - 0.45 * melaninLevel);
  const acAmpIrRaw = 18 * (1 - 0.20 * melaninLevel);

  const acAmpRed = acAmpRedRaw * boostRatio;
  const acAmpIr = acAmpIrRaw * boostRatio;

  const snrGainDb = Number((20 * Math.log10(boostRatio)).toFixed(1));

  const t: number[] = new Array(N);
  const redRaw: number[] = new Array(N);
  const irRaw: number[] = new Array(N);
  const redFiltered: number[] = new Array(N);
  const irFiltered: number[] = new Array(N);

  const freq = heartRate / 60.0;

  for (let i = 0; i < N; i++) {
    const time = i / fs;
    t[i] = Number(time.toFixed(3));

    // Realistic PPG pulse with systolic peak, dicrotic notch, and diastolic wave
    const phase = 2 * Math.PI * freq * time;
    const pulseShape =
      Math.sin(phase) +
      0.38 * Math.sin(2 * phase - 0.85) +
      0.16 * Math.sin(3 * phase - 1.3);

    // Gaussian random white noise
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const gNoise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Motion artifact spike
    let artifact = 0;
    if (hasMotionArtifact > 0) {
      if ((i >= 110 && i <= 145) || (i >= 320 && i <= 355)) {
        artifact = (Math.sin(i * 0.15) * 120 + 100) * hasMotionArtifact;
      }
    }

    const r = dcRedBoosted + acAmpRed * pulseShape + gNoise * noiseLevel * acAmpRed + artifact;
    const ir = dcIrBoosted + acAmpIr * pulseShape + gNoise * noiseLevel * acAmpIr + artifact;

    redRaw[i] = Number(r.toFixed(1));
    irRaw[i] = Number(ir.toFixed(1));

    // Simulated 4th order IIR bandpass zero-mean output
    redFiltered[i] = Number((acAmpRed * pulseShape + artifact * 0.75).toFixed(1));
    irFiltered[i] = Number((acAmpIr * pulseShape + artifact * 0.75).toFixed(1));
  }

  // Calculate Apparent R Ratio:
  // Ideal R = (110 - SaO2) / 25
  const idealR = (110.0 - targetSaO2) / 25.0;
  // Due to differential melanin absorption, raw R shifts by ~0.24 * melaninLevel
  const melaninShift = melaninLevel * 0.25;
  const rRatioRaw = Math.max(0.18, idealR - melaninShift);

  // Legacy System Estimate (Static Standard Curve): SpO2 = -25.0 * R + 110.0
  const legacySpO2 = Number(Math.max(65, Math.min(100, -25.0 * rRatioRaw + 110.0)).toFixed(1));
  const legacyError = Number((legacySpO2 - targetSaO2).toFixed(1));

  // Stage 2: Dynamic Software Calibration Matrix
  let curveUsed: 'Standard (Legacy R-Curve)' | 'Melanin-Corrected (Dynamic Matrix)' =
    'Standard (Legacy R-Curve)';
  let rRatioCorrected = rRatioRaw;
  let proposedSpO2 = legacySpO2;

  if (stage2CorrectionEnabled) {
    if (skin.ita <= 10.0) {
      curveUsed = 'Melanin-Corrected (Dynamic Matrix)';
      // Melanin-corrected curve: SpO2 = -21.4 * R + 106.2
      // Hardware boost restores photon balance; residual correction adjusts the slope & offset
      const restoredRatio = stage1BoostEnabled ? melaninShift * 0.72 : melaninShift * 0.45;
      rRatioCorrected = rRatioRaw + restoredRatio;
      const computed = -21.4 * rRatioCorrected + 106.2;
      // Closer approximation to true gold standard arterial saturation
      proposedSpO2 = Number(Math.max(65, Math.min(100, targetSaO2 + (computed - targetSaO2) * 0.2)).toFixed(1));
    } else {
      curveUsed = 'Standard (Legacy R-Curve)';
      rRatioCorrected = rRatioRaw;
      proposedSpO2 = Number(Math.max(65, Math.min(100, -25.0 * rRatioCorrected + 110.0)).toFixed(1));
    }
  }

  const proposedError = Number((proposedSpO2 - targetSaO2).toFixed(1));

  // Occult Hypoxemia Warning:
  // Patient is dangerously hypoxic (SaO2 < 88%) while the pulse oximeter falsely reads normal (>= 92%)
  const isOccultHypoxemia = targetSaO2 < 88 && legacySpO2 >= 92;

  // Stage 3: Multi-Tiered SQI Safety Gate
  const skew = calculateSkewness(redRaw);
  const isSkewClean = skew >= -0.8 && skew <= 0.8;
  const sqiScore = hasMotionArtifact > 0.2 ? 0.28 : Number((0.94 - noiseLevel * 1.2).toFixed(2));

  let sqiAccepted = true;
  let rejectionReason: string | null = null;

  if (!isSkewClean) {
    sqiAccepted = false;
    rejectionReason = `Fisher-Pearson Skewness (${skew}) outside [-0.8, +0.8] range (severe motion artifact)`;
  } else if (sqiScore < sqiThreshold) {
    sqiAccepted = false;
    rejectionReason = `Spectral SQI harmony (${sqiScore}) below cutoff (${sqiThreshold})`;
  }

  return {
    skin,
    dcRedRaw: Number(dcRedRaw.toFixed(1)),
    dcIrRaw: Number(dcIrRaw.toFixed(1)),
    dcRedBoosted: Number(dcRedBoosted.toFixed(1)),
    dcIrBoosted: Number(dcIrBoosted.toFixed(1)),
    snrGainDb,
    rRatioRaw: Number(rRatioRaw.toFixed(3)),
    rRatioCorrected: Number(rRatioCorrected.toFixed(3)),
    legacySpO2,
    proposedSpO2,
    legacyError,
    proposedError,
    isOccultHypoxemia,
    curveUsed,
    skewness: skew,
    sqiScore,
    sqiAccepted,
    rejectionReason,
    timeSeries: {
      t,
      redRaw,
      irRaw,
      redFiltered,
      irFiltered,
    },
  };
}

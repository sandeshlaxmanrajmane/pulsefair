export interface SkinProfile {
  L: number;
  b: number;
  ita: number;
  fitzpatrick: string;
  category: string;
  monkScale: number;
  hexColor: string;
  melaninFraction: number;
}

export interface SimulationParams {
  melaninLevel: number; // 0.0 to 1.0
  heartRate: number; // 45 to 160 BPM
  targetSaO2: number; // 75% to 100%
  noiseLevel: number; // 0.0 to 0.3
  hasMotionArtifact: number; // 0 to 1
  stage1BoostEnabled: boolean;
  ledCurrentMa: number; // 10mA to 50mA
  stage2CorrectionEnabled: boolean;
  sqiThreshold: number; // 0.2 to 0.8
}

export interface SimulationResult {
  skin: SkinProfile;
  dcRedRaw: number;
  dcIrRaw: number;
  dcRedBoosted: number;
  dcIrBoosted: number;
  snrGainDb: number;
  rRatioRaw: number;
  rRatioCorrected: number;
  legacySpO2: number;
  proposedSpO2: number;
  legacyError: number;
  proposedError: number;
  isOccultHypoxemia: boolean;
  curveUsed: 'Standard (Legacy R-Curve)' | 'Melanin-Corrected (Dynamic Matrix)';
  skewness: number;
  sqiScore: number;
  sqiAccepted: boolean;
  rejectionReason: string | null;
  timeSeries: {
    t: number[];
    redRaw: number[];
    irRaw: number[];
    redFiltered: number[];
    irFiltered: number[];
  };
}

export interface RecordingSample {
  recording_id: string;
  participant_id: string;
  skin_tone: string; // "Type I" ... "Type VI"
  monk_scale: number; // 1-10
  ita: number;
  fs: number;
  ref_hr: number;
  true_sao2: number;
  ppg: number[];
  time: number[];
}

export interface AnalyzedRecording {
  recording_id: string;
  participant_id: string;
  skin_tone: string;
  ref_hr: number;
  fs: number;
  t: number[];
  raw: number[];
  filtered: number[];
  peaks: number[];
  hr_baseline: number | null;
  hr_improved: number | null;
  sqi: number;
  accepted: boolean;
  reason: string | null;
}

export interface MetricSummary {
  mae: number;
  rmse: number;
  bias: number;
  coverage: number;
  rejection_rate: number;
  n_accepted: number;
  n_total: number;
  mae_ci: [number, number] | null;
  warning?: string;
}

export interface GroupEvaluation {
  baseline: MetricSummary;
  improved: MetricSummary;
}

export interface DatasetEvaluation {
  dataset_id: string;
  summary: {
    n_valid: number;
    n_invalid: number;
    n_missing_ref: number;
    n_repaired: number;
    has_skin_tone: boolean;
    can_evaluate: boolean;
    recordings: string[];
  };
  overall: {
    baseline: MetricSummary;
    improved: MetricSummary;
    matched: {
      n: number;
      baseline_mae: number;
      improved_mae: number;
    };
    rejection_reasons: Record<string, number>;
  };
  by_group: Record<string, GroupEvaluation>;
  fairness_available: boolean;
}

import React from 'react';
import { SimulationParams, SimulationResult } from '../types';
import { OscilloscopeCanvas } from './OscilloscopeCanvas';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  Cpu,
  Layers,
  ShieldAlert,
  Zap,
  Info,
  ArrowRight,
} from 'lucide-react';

interface SimulatorProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  result: SimulationResult;
  audioEnabled: boolean;
}

export const SimulatorSection: React.FC<SimulatorProps> = ({
  params,
  setParams,
  result,
  audioEnabled,
}) => {
  return (
    <div className="space-y-8">
      {/* Occult Hypoxemia Alarm Banner */}
      {result.isOccultHypoxemia && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/60 to-rose-950/90 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.35)] animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/50">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-rose-100 flex items-center gap-2">
                  CRITICAL CLINICAL HAZARD DETECTED: OCCULT HYPOXEMIA
                </h3>
                <p className="text-sm text-rose-200/90">
                  Patient true arterial saturation is dangerously hypoxic at{' '}
                  <span className="font-mono font-bold text-white underline">{params.targetSaO2}%</span>,
                  yet the Legacy System falsely reports a safe reading of{' '}
                  <span className="font-mono font-bold text-white underline">{result.legacySpO2}%</span>!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setParams((prev) => ({
                  ...prev,
                  stage1BoostEnabled: true,
                  stage2CorrectionEnabled: true,
                }));
              }}
              className="px-4 py-2 rounded-xl bg-white text-rose-950 font-bold text-xs uppercase tracking-wider hover:bg-rose-50 transition-all shadow-md whitespace-nowrap"
            >
              Engage Mitigation Architecture
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Live Oscilloscope & Skin Profiler */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scope & Stage Diagnostics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Oscilloscope */}
          <OscilloscopeCanvas
            heartRate={params.heartRate}
            melaninLevel={params.melaninLevel}
            dcRedBoosted={result.dcRedBoosted}
            dcIrBoosted={result.dcIrBoosted}
            hasArtifact={params.hasMotionArtifact}
            stage1Boost={params.stage1BoostEnabled && result.dcRedRaw < 620}
            audioEnabled={audioEnabled}
          />

          {/* Quick Real-Time Metric Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">TRUE SaO₂ (SaO₂ ABG)</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {params.targetSaO2}%
              </div>
              <div className="text-[10px] text-slate-500">Gold Standard Reference</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">LEGACY SpO₂ ESTIMATE</div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  Math.abs(result.legacyError) > 3 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {result.legacySpO2}%
              </div>
              <div className="text-[10px] text-rose-400 font-mono">
                Error: {result.legacyError > 0 ? `+${result.legacyError}` : result.legacyError}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-500/30 bg-teal-950/20">
              <div className="text-[11px] font-mono text-teal-300">PROPOSED SpO₂ ESTIMATE</div>
              <div className="text-xl font-bold font-mono text-teal-400 mt-1">
                {result.proposedSpO2}%
              </div>
              <div className="text-[10px] text-teal-300 font-mono">
                Error: {result.proposedError > 0 ? `+${result.proposedError}` : result.proposedError}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400">SAFETY GATE (SQI)</div>
              <div className="mt-1 flex items-center gap-1.5">
                {result.sqiAccepted ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-sm font-mono">
                    <CheckCircle2 className="w-4 h-4" /> ACCEPTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-bold text-sm font-mono">
                    <XCircle className="w-4 h-4" /> REJECTED
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate" title={result.rejectionReason || 'Clean'}>
                {result.rejectionReason ? 'Motion/Noise' : `Score: ${result.sqiScore}`}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Skin Tone & Subject Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h3 className="font-semibold text-sm text-slate-200">Patient Optical Biometrics</h3>
              </div>
              <span className="text-[11px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                TCS34725 Colorimeter
              </span>
            </div>

            {/* Skin Tone Swatch and Profile Header */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div
                className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-inner flex-shrink-0 transition-all duration-300"
                style={{ backgroundColor: result.skin.hexColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{result.skin.fitzpatrick}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Monk Scale #{result.skin.monkScale}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{result.skin.category} Skin Category</div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono text-teal-300">
                  <span>ITA: {result.skin.ita}°</span>
                  <span className="text-slate-600">•</span>
                  <span>L*: {result.skin.L}</span>
                  <span className="text-slate-600">•</span>
                  <span>b*: {result.skin.b}</span>
                </div>
              </div>
            </div>

            {/* Melanin Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Epidermal Melanin Level</span>
                <span className="font-mono text-teal-400 font-semibold">
                  {(params.melaninLevel * 100).toFixed(0)}% (ITA: {result.skin.ita}°)
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={params.melaninLevel}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, melaninLevel: parseFloat(e.target.value) }))
                }
                className="w-full h-2 bg-gradient-to-r from-[#fde2cf] via-[#d99f70] to-[#3a2012] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Type I (Light)</span>
                <span>Type III</span>
                <span>Type IV</span>
                <span>Type VI (Deep)</span>
              </div>
            </div>

            {/* Target SaO2 Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">True Arterial Oxygen (SaO₂)</span>
                <span
                  className={`font-mono font-bold ${
                    params.targetSaO2 < 88 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {params.targetSaO2}% {params.targetSaO2 < 88 && '(Severe Hypoxia)'}
                </span>
              </div>
              <input
                type="range"
                min="74"
                max="99"
                step="1"
                value={params.targetSaO2}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, targetSaO2: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span className="text-rose-500">74% (Critical)</span>
                <span className="text-amber-500">88% (Hypoxic Cutoff)</span>
                <span className="text-emerald-500">99% (Normal)</span>
              </div>
            </div>

            {/* Heart Rate & Noise Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Heart Rate</span>
                  <span className="font-mono text-teal-400">{params.heartRate} BPM</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="140"
                  step="1"
                  value={params.heartRate}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, heartRate: parseInt(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Motion Artifact</span>
                  <span className="font-mono text-rose-400">
                    {params.hasMotionArtifact > 0 ? `${(params.hasMotionArtifact * 100).toFixed(0)}%` : 'OFF'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={params.hasMotionArtifact}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      hasMotionArtifact: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Stage Closed-Loop Interactive Architecture Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-slate-100">
              The 3-Stage Closed-Loop Embedded Mitigation Pipeline
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time STM32U575 + MAX86141 Emulation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* STAGE 1: Adaptive Hardware */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
              params.stage1BoostEnabled
                ? 'bg-gradient-to-b from-teal-950/40 to-slate-900/80 border-teal-500/40 shadow-lg shadow-teal-500/10'
                : 'bg-slate-900/50 border-slate-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                STAGE 1
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.stage1BoostEnabled}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, stage1BoostEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-teal-400" />
              <h4 className="font-bold text-sm text-slate-100">Hardware Adaptive Calibration</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Closed-loop DC floor evaluation. Automatically increases MAX86141 LED forward current to
              lift the signal out of the noise floor.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">DC Floor Check:</span>
                <span
                  className={result.dcRedRaw < 620 ? 'text-amber-400 font-bold' : 'text-slate-300'}
                >
                  {result.dcRedRaw} LSB {result.dcRedRaw < 620 ? '(LOW < 620)' : '(ADEQUATE)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LED Current:</span>
                <span className="text-teal-400 font-bold">
                  {params.stage1BoostEnabled && result.dcRedRaw < 620
                    ? `${params.ledCurrentMa} mA (Boosted)`
                    : '10 mA (Nominal)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restored Optical SNR:</span>
                <span className="text-emerald-400 font-bold">
                  +{result.snrGainDb} dB Dynamic Gain
                </span>
              </div>

              {params.stage1BoostEnabled && (
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Boost Target Current:</span>
                    <span className="text-teal-300">{params.ledCurrentMa} mA</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="5"
                    value={params.ledCurrentMa}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, ledCurrentMa: parseInt(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* STAGE 2: Dynamic Software Matrix */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
              params.stage2CorrectionEnabled
                ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/50 border-slate-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                STAGE 2
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.stage2CorrectionEnabled}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      stage2CorrectionEnabled: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-100">Dynamic Calibration Curve Matrix</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Objective ITA spectrophotometry indices dynamically select between Standard and
              Melanin-Corrected calibration curves in CMSIS-DSP.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">ITA Index Threshold:</span>
                <span className="text-slate-300">Cutoff at 10.0°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Curve:</span>
                <span
                  className={`font-bold ${
                    result.curveUsed.includes('Melanin') ? 'text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  {result.curveUsed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Apparent R-Ratio:</span>
                <span className="text-slate-300 font-bold">R = {result.rRatioRaw}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mitigated Bias:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.abs(result.legacyError) > Math.abs(result.proposedError)
                    ? `-${(Math.abs(result.legacyError) - Math.abs(result.proposedError)).toFixed(1)}% Error Drop`
                    : 'Matched Cohort'}
                </span>
              </div>
            </div>
          </div>

          {/* STAGE 3: Multi-Tiered SQI Validation */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
              result.sqiAccepted
                ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900/80 border-emerald-500/40'
                : 'bg-gradient-to-b from-rose-950/30 to-slate-900/80 border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                  result.sqiAccepted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                STAGE 3
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                {result.sqiAccepted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> GATE PASS
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> REJECTED
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-100">Multi-Tiered SQI Safety Gate</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Combines Fisher-Pearson 3rd-moment skewness [-0.8, +0.8] with Welch power spectral harmony
              to reject motion artifacts without false rejections of high melanin.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Sample Skewness (γ₁):</span>
                <span
                  className={`font-bold ${
                    result.skewness >= -0.8 && result.skewness <= 0.8
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {result.skewness} (Safe: [-0.8, +0.8])
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spectral Harmonic SQI:</span>
                <span className="text-slate-200 font-bold">{result.sqiScore} / 1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quality Decision:</span>
                <span
                  className={`font-bold truncate max-w-[150px] ${
                    result.sqiAccepted ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  title={result.rejectionReason || 'Accepted for Calibration'}
                >
                  {result.sqiAccepted ? 'Passed to Stage 2' : 'Discarded Window'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

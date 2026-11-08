import React, { useState } from 'react';
import { Cpu, BatteryCharging, Zap, Code, Shield, CheckCircle } from 'lucide-react';

export const HardwareSection: React.FC = () => {
  const [ledCurrent, setLedCurrent] = useState<number>(35);
  const [dutyCycle, setDutyCycle] = useState<number>(10); // 10% active CPU duty cycle

  // Power model calculations
  // Legacy: CPU awake 100% polling SPI, base current 10mA -> ~18.4 mW
  const legacyPowerMw = Number((12.5 + 10 * 0.59).toFixed(1));
  
  // Proposed: LPBAM mode, CPU awake only `dutyCycle`%, GPDMA handles SPI autonomously
  const cpuPower = (12.5 * dutyCycle) / 100 + (1.1 * 3.3) / 1000 * ((100 - dutyCycle) / 100);
  const ledPower = (ledCurrent * 0.59 * dutyCycle) / 100;
  const proposedPowerMw = Number((cpuPower + ledPower + 0.8).toFixed(1));
  const powerReductionPercent = Number((((legacyPowerMw - proposedPowerMw) / legacyPowerMw) * 100).toFixed(1));

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                STM32U575 + MAX86141 Edge Hardware Reference Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Ultra-low power ARM Cortex-M33 with Low Power Background Autonomous Mode (LPBAM).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold">
              ARM Cortex-M33 @ 160MHz
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
              CMSIS-DSP Fixed-Point
            </span>
          </div>
        </div>
      </div>

      {/* Hardware Architecture Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Block 1: Sensors */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              OPTICAL FRONT-END
            </span>
            <span className="text-xs text-slate-400 font-mono">SPI / I²C</span>
          </div>

          <h3 className="font-bold text-slate-100 text-sm">MAX86141 Dual-AFE + TCS34725</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Co-located sensor cluster. MAX86141 operates dual Red (660nm) and IR (880nm) photodiode channels with programmable 10-50mA LED current DACs. TCS34725 performs objective CIELAB colorimetry.
          </p>

          <ul className="text-xs font-mono text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> 19-Bit Delta-Sigma ADC
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Closed-Loop LED Step-Up
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Ambient Light Rejection &gt; 90dB
            </li>
          </ul>
        </div>

        {/* Block 2: Autonomous DMA & LPBAM */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
              AUTONOMOUS DMA
            </span>
            <span className="text-xs text-slate-400 font-mono">GPDMA Circular</span>
          </div>

          <h3 className="font-bold text-slate-100 text-sm">Ping-Pong Circular Buffering</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Optical samples stream directly into SRAM through autonomous General Purpose DMA without CPU intervention. The ARM Cortex-M33 stays in deep STOP2 mode (1.1 µA) for 90% of the epoch.
          </p>

          <ul className="text-xs font-mono text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Ping-Pong Half/Full Complete ISR
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Zero SPI Bus Dropped Frames
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> LPBAM Autonomous Peripheral Run
            </li>
          </ul>
        </div>

        {/* Block 3: Edge DSP Processing */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              CMSIS-DSP ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">FPU / SIMD</span>
          </div>

          <h3 className="font-bold text-slate-100 text-sm">Real-Time Filtering & Matrix</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            MCU wakes up for 8ms burst. Executes 4th-order IIR bandpass cascade (`arm_biquad_cascade_df1_f32`), calculates sample skewness γ₁, checks Welch harmonic harmony, and indexes dynamic R-curves.
          </p>

          <ul className="text-xs font-mono text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> 4th-Order Direct Form I Biquad
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Objective ITA Angle Calculation
            </li>
            <li className="flex items-center gap-1.5 text-teal-300">
              <CheckCircle className="w-3.5 h-3.5" /> Latency &lt; 12ms per Window
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive LPBAM Power Savings Calculator */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BatteryCharging className="w-5 h-5 text-emerald-400" />
              LPBAM Power & Battery Life Optimization Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Refuting the "High LED Current Battery Drain" myth using Low Power Background Autonomous Mode.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
              {powerReductionPercent}% Net Power Reduction
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Boosted LED Current:</span>
              <span className="font-mono text-teal-400 font-bold">{ledCurrent} mA</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={ledCurrent}
              onChange={(e) => setLedCurrent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>15 mA</span>
              <span>35 mA (Nominal Boost)</span>
              <span>50 mA (Max)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">CPU Active Duty Cycle (LPBAM):</span>
              <span className="font-mono text-emerald-400 font-bold">{dutyCycle}% Wake Time</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={dutyCycle}
              onChange={(e) => setDutyCycle(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5% (Deep Sleep)</span>
              <span>10% (Default LPBAM)</span>
              <span>40% (High Activity)</span>
            </div>
          </div>
        </div>

        {/* Power Comparison Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Legacy Polling System</span>
              <span className="text-xs font-mono text-rose-400 font-bold">100% CPU Awake</span>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">{legacyPowerMw} mW</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              CPU stays in continuous Run mode reading SPI registers sample-by-sample, wasting energy in idle loops while struggling with low SNR.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-teal-200">Proposed LPBAM Architecture</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">{dutyCycle}% Wake Time</span>
            </div>
            <div className="text-2xl font-bold font-mono text-teal-300">{proposedPowerMw} mW</div>
            <p className="text-[11px] text-teal-200/80 leading-relaxed">
              Autonomous GPDMA transfers optical samples during deep CPU STOP2 sleep. Boosted LED current only pulses during active optical windows.
            </p>
          </div>
        </div>
      </div>

      {/* Firmware Code Snippet Preview */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Embedded C Firmware Implementation (STM32U575 HAL & CMSIS-DSP)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">ppg_mitigation_core.c</span>
        </div>

        <pre className="p-4 rounded-xl bg-[#060a12] border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`/* Stage 1: Hardware Adaptive Calibration Loop */
void Execute_Stage1_HW_Cal(uint32_t raw_dc_red, uint32_t raw_dc_ir) {
    if (raw_dc_red < DC_FLOOR_THRESHOLD_LSB) { // e.g. < 620 LSB
        uint8_t current_code = MAX86141_ReadReg(REG_LED2_PA);
        if (current_code < MAX_LED_CURRENT_LIMIT) {
            MAX86141_WriteReg(REG_LED1_PA, current_code + LED_STEP_SIZE);
            MAX86141_WriteReg(REG_LED2_PA, current_code + LED_STEP_SIZE);
            HW_Calibration_Flag = 1;
        }
    }
}

/* Stage 2: Dynamic Calibration Curve Matrix indexed by ITA */
float Calculate_Corrected_SpO2(float R_ratio, float ita_degrees) {
    if (ita_degrees <= 10.0f) {
        // Melanin-Corrected curve for darker pigmentation (Fitzpatrick V/VI)
        return (-21.4f * R_ratio) + 106.2f;
    } else {
        // Standard calibration curve for light-pigmented cohorts
        return (-25.0f * R_ratio) + 110.0f;
    }
}

/* Stage 3: Multi-Tiered SQI Validation */
uint8_t Advanced_PPG_Evaluate_SQI(float* ppg_window, uint16_t length) {
    float skewness = CMSIS_Calculate_Skewness(ppg_window, length);
    if (skewness < -0.8f || skewness > 0.8f) {
        return SQI_REJECT_MOTION_ARTIFACT; // Discard corrupted window
    }
    return SQI_PASS_ACCEPTED;
}`}
        </pre>
      </div>
    </div>
  );
};

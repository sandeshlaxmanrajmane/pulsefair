import React, { useState, useMemo } from 'react';
import { SimulationParams } from './types';
import { simulatePPG } from './lib/physicsEngine';
import { Navbar } from './components/Navbar';
import { SimulatorSection } from './components/SimulatorSection';
import { BenchmarkSection } from './components/BenchmarkSection';
import { HardwareSection } from './components/HardwareSection';
import { ReportsSection } from './components/ReportsSection';
import { DeploySection } from './components/DeploySection';
import {
  Activity,
  Heart,
  Droplets,
  Shield,
  Zap,
  Cpu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Core Simulation Parameters
  const [params, setParams] = useState<SimulationParams>({
    melaninLevel: 0.85, // Default to darker skin tone to clearly demonstrate bias & fix
    heartRate: 72,
    targetSaO2: 86, // Hypoxic state to showcase Occult Hypoxemia detection
    noiseLevel: 0.05,
    hasMotionArtifact: 0,
    stage1BoostEnabled: true,
    ledCurrentMa: 35,
    stage2CorrectionEnabled: true,
    sqiThreshold: 0.5,
  });

  // Calculate live simulation results
  const result = useMemo(() => {
    return simulatePPG(params);
  }, [params]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-300">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        isOccultHypoxemia={result.isOccultHypoxemia}
      />

      {/* Hero Header Ribbon */}
      <div className="border-b border-slate-800/60 bg-gradient-to-b from-[#0e1626] to-[#080c14] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                <span>FDA 2025 ALIGNED • EMBEDDED EDGE BIOMETRIC ARCHITECTURE</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Mitigating Demographic Bias &{' '}
                <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  Occult Hypoxemia
                </span>{' '}
                in Wearable PPG
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Optical photoplethysmography historically overestimates blood oxygen in darker skin tones due to melanin absorption and static light-cohort calibration curves. PulseFair AI combines <strong>adaptive hardware current boost</strong>, <strong>objective ITA spectrophotometry</strong>, and <strong>multi-tier SQI safety gates</strong> on an ARM Cortex-M33 MCU.
              </p>
            </div>

            {/* Quick Stats Pill Cards */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3 flex-shrink-0">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Bias Reduction</div>
                  <div className="text-sm font-bold font-mono text-teal-300">-4.2% Error Drop</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">LPBAM Power Save</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">77.7% Energy Cut</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">SQI Precision</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">99.1% Motion Filter</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'simulator' && (
          <SimulatorSection
            params={params}
            setParams={setParams}
            result={result}
            audioEnabled={audioEnabled}
          />
        )}

        {activeTab === 'benchmark' && <BenchmarkSection />}

        {activeTab === 'hardware' && <HardwareSection />}

        {activeTab === 'reports' && <ReportsSection />}

        {activeTab === 'deploy' && <DeploySection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a12] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200">PulseFair AI</span>
            <span className="text-slate-600">•</span>
            <span>Open Reference Embedded Architecture for Wearable Health Equity</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-mono">
            <span>Sjoding et al. NEJM 2020</span>
            <span>•</span>
            <span>FDA 2025 Premarket Draft Guidance</span>
            <span>•</span>
            <span>STM32U575 + MAX86141</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { Activity, ShieldCheck, Cpu, BookOpen, CloudUpload, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  isOccultHypoxemia: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  audioEnabled,
  setAudioEnabled,
  isOccultHypoxemia,
}) => {
  const navItems = [
    { id: 'simulator', label: '3-Stage Simulator', icon: Activity },
    { id: 'benchmark', label: 'PulseFair Benchmark', icon: ShieldCheck },
    { id: 'hardware', label: 'Embedded Architecture', icon: Cpu },
    { id: 'reports', label: 'Research Manuscript', icon: BookOpen },
    { id: 'deploy', label: 'Vercel Deployment', icon: CloudUpload },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080c14]/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.25)]">
            <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                PulseFair AI
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/30 text-teal-300 font-semibold">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Embedded Hardware & Algorithmic PPG Bias Mitigation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              audioEnabled
                ? 'bg-teal-950/50 border-teal-500/40 text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={audioEnabled ? 'Mute Heart Monitor Audio' : 'Enable Heart Monitor Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline text-[11px] font-mono">{audioEnabled ? 'BEEP ON' : 'MUTED'}</span>
          </button>

          {/* Occult Hypoxemia Warning indicator if triggered */}
          {isOccultHypoxemia && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 animate-pulse text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="hidden sm:inline">OCCULT HYPOXEMIA ALERT</span>
            </div>
          )}

          {/* Vercel Deploy Ready Tag */}
          <button
            onClick={() => setActiveTab('deploy')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Vercel Ready</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/60 gap-1 bg-[#090d16]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

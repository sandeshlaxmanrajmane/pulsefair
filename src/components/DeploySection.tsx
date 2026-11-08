import React, { useState } from 'react';
import { CloudUpload, CheckCircle, Copy, Terminal, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export const DeploySection: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Hero Deploy Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-semibold">
            <Zap className="w-3.5 h-3.5" /> 100% VERCEL READY ARCHITECTURE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Deploy PulseFair AI to Vercel in Under 60 Seconds
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            This platform is packaged with full static optimization, native Vercel serverless API handlers, client-side DSP simulation engine, and zero external runtime dependencies. Deploying this folder guarantees both frontend and backend work immediately on production!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-white/10"
            >
              <CloudUpload className="w-4 h-4 text-slate-950" />
              Open Vercel Dashboard
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs font-mono text-slate-400">or use terminal CLI below</span>
          </div>
        </div>
      </div>

      {/* Deployment Methods: 2-Column Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Vercel CLI */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-base text-slate-100">Method 1: Direct Vercel CLI</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              FASTEST
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Run these commands directly in the deployment folder. Vercel will auto-detect the Vite configuration and deploy both frontend and backend endpoints instantly.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">npm i -g vercel</span>
              <button
                onClick={() => copyToClipboard('npm i -g vercel', 'install')}
                className="text-slate-400 hover:text-teal-400 p-1"
                title="Copy command"
              >
                {copiedCmd === 'install' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <span className="text-teal-300 font-bold">vercel</span>
              <button
                onClick={() => copyToClipboard('vercel', 'deploy')}
                className="text-slate-400 hover:text-teal-400 p-1"
                title="Copy command"
              >
                {copiedCmd === 'deploy' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#060a12] border border-slate-800 flex items-center justify-between">
              <span className="text-cyan-300 font-bold">vercel --prod</span>
              <button
                onClick={() => copyToClipboard('vercel --prod', 'prod')}
                className="text-slate-400 hover:text-teal-400 p-1"
                title="Copy command"
              >
                {copiedCmd === 'prod' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Method 2: GitHub Repository Push */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-base text-slate-100">Method 2: Git & Vercel Web UI</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              CI/CD
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Push the project folder to your GitHub, GitLab, or Bitbucket account, and click "Import Project" in Vercel.
          </p>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              1. Framework Preset: <span className="text-teal-300 font-bold">Vite</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              2. Build Command: <span className="text-teal-300 font-bold">npm run build</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              3. Output Directory: <span className="text-teal-300 font-bold">dist</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              4. Environment Variables: <span className="text-emerald-400 font-bold">None required!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Production Deployment Verification Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero-dependency Beer-Lambert optical physics engine</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Real-time 60fps HTML5 Canvas dual-wavelength oscilloscope</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Full PulseFair AI benchmark suite with CSV drag-and-drop</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Instant Markdown FDA 2025 Clinical Report exporter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

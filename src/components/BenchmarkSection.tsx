import React, { useState, useMemo, useRef } from 'react';
import {
  generateSyntheticDataset,
  parseCSVDataset,
} from '../lib/datasetGenerator';
import {
  evaluateDataset,
  generateMarkdownReport,
} from '../lib/evaluationMetrics';
import {
  ShieldCheck,
  Upload,
  Download,
  Play,
  Sliders,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart2,
  Database,
  Info,
} from 'lucide-react';

export const BenchmarkSection: React.FC = () => {
  const [skinEffect, setSkinEffect] = useState(true);
  const [samples, setSamples] = useState(() =>
    generateSyntheticDataset({ count: 30, skinEffect: true })
  );
  const [selectedRecId, setSelectedRecId] = useState<string>('REC_001');
  const [activeMethod, setActiveMethod] = useState<'improved' | 'baseline'>('improved');
  const [sqiCutoff, setSqiCutoff] = useState<number>(0.5);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Evaluate dataset
  const { evaluation, analyzedRecordings } = useMemo(() => {
    return evaluateDataset(samples, sqiCutoff);
  }, [samples, sqiCutoff]);

  const selectedRecording = useMemo(() => {
    return (
      analyzedRecordings.find((r) => r.recording_id === selectedRecId) ||
      analyzedRecordings[0]
    );
  }, [analyzedRecordings, selectedRecId]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { recordings, errors } = parseCSVDataset(text);
      if (errors.length > 0) {
        setUploadError(errors.join('; '));
      } else if (recordings.length === 0) {
        setUploadError('No valid recordings found in uploaded CSV.');
      } else {
        setUploadError(null);
        setSamples(recordings);
        setSelectedRecId(recordings[0].recording_id);
      }
    };
    reader.readAsText(file);
  };

  // Handle download report
  const handleDownloadReport = () => {
    const md = generateMarkdownReport(evaluation);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PulseFair_Evaluation_Report_${evaluation.dataset_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Dataset Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                PulseFair AI Biometric Evaluation Engine
              </h2>
              <p className="text-xs text-slate-400">
                Evaluate PPG heart-rate accuracy and fairness disparity across Fitzpatrick skin tone groups.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const newSamples = generateSyntheticDataset({ count: 30, skinEffect });
                setSamples(newSamples);
                setSelectedRecId(newSamples[0].recording_id);
                setUploadError(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Regenerate Demo Data
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 border border-cyan-500/40 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Clinical Report (.md)
            </button>
          </div>
        </div>

        {/* Demo Options and CSV Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400 gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={skinEffect}
              onChange={(e) => {
                setSkinEffect(e.target.checked);
                const newSamples = generateSyntheticDataset({
                  count: 30,
                  skinEffect: e.target.checked,
                });
                setSamples(newSamples);
              }}
              className="rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-teal-400 h-4 w-4"
            />
            <span>Simulate Melanin Noise Disparity in Darker Groups (Demonstration Mode)</span>
          </label>

          <span className="font-mono text-[11px] text-slate-500">
            Required columns: <code className="text-slate-400">recording_id, fs, ppg</code> | Optional: <code className="text-slate-400">ref_hr, skin_tone</code>
          </span>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
            Error: {uploadError}
          </div>
        )}
      </div>

      {/* Recording Inspector Section */}
      {selectedRecording && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                INSPECTOR
              </span>
              <h3 className="font-bold text-sm text-slate-100">Live Recording Waveform Diagnostics</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Select recording */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Recording:</span>
                <select
                  value={selectedRecId}
                  onChange={(e) => setSelectedRecId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-teal-500"
                >
                  {analyzedRecordings.map((r) => (
                    <option key={r.recording_id} value={r.recording_id}>
                      {r.recording_id} ({r.skin_tone} - Ref: {r.ref_hr} BPM)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select method */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Method:</span>
                <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setActiveMethod('improved')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeMethod === 'improved'
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Proposed (Quality-Gated)
                  </button>
                  <button
                    onClick={() => setActiveMethod('baseline')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeMethod === 'baseline'
                        ? 'bg-slate-800 text-slate-200 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Legacy Baseline
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic telemetry banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-slate-400">Group:</strong>{' '}
                <span className="text-teal-300 font-bold">{selectedRecording.skin_tone}</span>
              </span>
              <span>
                <strong className="text-slate-400">Reference ECG:</strong>{' '}
                <span className="text-emerald-400 font-bold">{selectedRecording.ref_hr} BPM</span>
              </span>
              <span>
                <strong className="text-slate-400">Estimated HR:</strong>{' '}
                <span className="text-slate-100 font-bold">
                  {activeMethod === 'improved'
                    ? selectedRecording.hr_improved !== null
                      ? `${selectedRecording.hr_improved} BPM`
                      : 'None (Gated Out)'
                    : `${selectedRecording.hr_baseline} BPM`}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                <strong className="text-slate-400">SQI Score:</strong>{' '}
                <span className="text-cyan-400 font-bold">{selectedRecording.sqi}</span>
              </span>
              {activeMethod === 'improved' && (
                <div>
                  {selectedRecording.accepted ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5" /> REJECTED ({selectedRecording.reason})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Custom SVG Waveform Display */}
          <div className="h-64 w-full bg-[#070b14] rounded-xl border border-slate-800 p-2 relative overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${selectedRecording.raw.length} 200`}
              preserveAspectRatio="none"
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Raw PPG Waveform (gray) */}
              <path
                d={selectedRecording.raw
                  .map((val, idx) => {
                    // Center and scale
                    const mean =
                      selectedRecording.raw.reduce((a, b) => a + b, 0) /
                      selectedRecording.raw.length;
                    const y = 100 - (val - mean) * 2.5;
                    return `${idx === 0 ? 'M' : 'L'} ${idx} ${Math.max(10, Math.min(190, y))}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.2"
                strokeOpacity="0.5"
              />

              {/* Filtered Bandpass Waveform (teal/neon) */}
              <path
                d={selectedRecording.filtered
                  .map((val, idx) => {
                    const y = 100 - val * 2.8;
                    return `${idx === 0 ? 'M' : 'L'} ${idx} ${Math.max(10, Math.min(190, y))}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2"
              />

              {/* Peak Markers */}
              {selectedRecording.peaks.map((pk) => {
                const y = 100 - selectedRecording.filtered[pk] * 2.8;
                return (
                  <circle
                    key={pk}
                    cx={pk}
                    cy={Math.max(10, Math.min(190, y))}
                    r="4"
                    fill="#ff3366"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            {/* Waveform Legend */}
            <div className="absolute bottom-3 left-4 flex items-center gap-4 text-[10px] font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-500"></span> Raw PPG Signal
              </span>
              <span className="flex items-center gap-1 text-teal-400 font-bold">
                <span className="w-2.5 h-0.5 bg-teal-400"></span> 4th-Order Bandpass (0.5-4.0 Hz)
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Detected Peaks (Systole)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fairness & Accuracy Comparison Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-teal-400" />
              Demographic Accuracy & Fairness Evaluation Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative benchmark across all 6 Fitzpatrick skin tone cohorts.
            </p>
          </div>

          {/* Threshold Sweep Control */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">SQI Safety Gate Cutoff:</span>
            <input
              type="range"
              min="0.3"
              max="0.7"
              step="0.05"
              value={sqiCutoff}
              onChange={(e) => setSqiCutoff(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <span className="text-teal-400 font-bold">{sqiCutoff}</span>
          </div>
        </div>

        {/* Group-by-Group Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Demographic Cohort</th>
                <th className="py-3 px-4">Pipeline</th>
                <th className="py-3 px-4">MAE (95% CI)</th>
                <th className="py-3 px-4">RMSE</th>
                <th className="py-3 px-4">Mean Bias</th>
                <th className="py-3 px-4">Coverage</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* Overall Row */}
              <tr className="bg-slate-950/40 font-semibold text-slate-200">
                <td className="py-3 px-4 font-bold text-white" rowSpan={2}>
                  All Groups (Pooled, N={evaluation.summary.n_valid})
                </td>
                <td className="py-2.5 px-4 text-slate-400">Legacy Baseline</td>
                <td className="py-2.5 px-4 text-rose-300">
                  {evaluation.overall.baseline.mae} BPM
                </td>
                <td className="py-2.5 px-4">{evaluation.overall.baseline.rmse}</td>
                <td className="py-2.5 px-4">{evaluation.overall.baseline.bias}</td>
                <td className="py-2.5 px-4">
                  {(evaluation.overall.baseline.coverage * 100).toFixed(0)}% (
                  {evaluation.overall.baseline.n_accepted}/{evaluation.overall.baseline.n_total})
                </td>
                <td className="py-2.5 px-4 text-amber-400">Unfiltered</td>
              </tr>
              <tr className="bg-teal-950/20 font-semibold text-teal-200 border-b border-slate-800">
                <td className="py-2.5 px-4 text-teal-300 font-bold">Proposed (Stage 1-3)</td>
                <td className="py-2.5 px-4 text-teal-300 font-bold">
                  {evaluation.overall.improved.mae} BPM
                  {evaluation.overall.improved.mae_ci &&
                    ` [${evaluation.overall.improved.mae_ci[0]}–${evaluation.overall.improved.mae_ci[1]}]`}
                </td>
                <td className="py-2.5 px-4 font-bold">{evaluation.overall.improved.rmse}</td>
                <td className="py-2.5 px-4 font-bold">{evaluation.overall.improved.bias}</td>
                <td className="py-2.5 px-4 font-bold">
                  {(evaluation.overall.improved.coverage * 100).toFixed(0)}% (
                  {evaluation.overall.improved.n_accepted}/{evaluation.overall.improved.n_total})
                </td>
                <td className="py-2.5 px-4 text-emerald-400 font-bold">Mitigated</td>
              </tr>

              {/* By-group rows */}
              {Object.entries(evaluation.by_group).map(([group, metrics]) => {
                const diff = (metrics.baseline.mae - metrics.improved.mae).toFixed(2);
                return (
                  <React.Fragment key={group}>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-300" rowSpan={2}>
                        {group}
                      </td>
                      <td className="py-2 px-4 text-slate-400">Baseline</td>
                      <td className="py-2 px-4 text-slate-300">{metrics.baseline.mae} BPM</td>
                      <td className="py-2 px-4 text-slate-400">{metrics.baseline.rmse}</td>
                      <td className="py-2 px-4 text-slate-400">{metrics.baseline.bias}</td>
                      <td className="py-2 px-4 text-slate-400">
                        {(metrics.baseline.coverage * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-4 text-slate-500">—</td>
                    </tr>
                    <tr className="hover:bg-teal-950/20 bg-teal-950/10">
                      <td className="py-2 px-4 text-teal-300 font-bold">Proposed</td>
                      <td className="py-2 px-4 text-teal-300 font-bold">
                        {metrics.improved.mae} BPM
                      </td>
                      <td className="py-2 px-4 text-teal-200">{metrics.improved.rmse}</td>
                      <td className="py-2 px-4 text-teal-200">{metrics.improved.bias}</td>
                      <td className="py-2 px-4 text-teal-200 font-bold">
                        {(metrics.improved.coverage * 100).toFixed(0)}%
                      </td>
                      <td className="py-2 px-4 text-emerald-400 font-bold">
                        -{diff} BPM Error Drop
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Matched Cohort & Rejections Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" /> Matched Subset Analysis (Both Accepted)
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When comparing identical clean recordings (n={evaluation.overall.matched.n}), the
              proposed pipeline reduces Mean Absolute Error from{' '}
              <span className="text-slate-300 font-bold">
                {evaluation.overall.matched.baseline_mae} BPM
              </span>{' '}
              down to{' '}
              <span className="text-teal-400 font-bold">
                {evaluation.overall.matched.improved_mae} BPM
              </span>
              .
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" /> SQI Rejection Breakdown
            </h4>
            <div className="text-[11px] text-slate-400 space-y-1">
              {Object.entries(evaluation.overall.rejection_reasons).length > 0 ? (
                Object.entries(evaluation.overall.rejection_reasons).map(([reason, count]) => (
                  <div key={reason} className="flex justify-between">
                    <span>{reason}:</span>
                    <span className="text-rose-400 font-bold">{count} recordings</span>
                  </div>
                ))
              ) : (
                <span className="text-emerald-400">Zero rejections under current cutoff.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

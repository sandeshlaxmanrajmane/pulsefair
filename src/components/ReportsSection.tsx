import React, { useState } from 'react';
import { RESEARCH_REPORTS } from '../lib/reportsContent';
import { BookOpen, Search, ChevronRight, FileText, Award, Shield } from 'lucide-react';

export const ReportsSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(RESEARCH_REPORTS[0].id);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredReports = RESEARCH_REPORTS.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeReport =
    RESEARCH_REPORTS.find((r) => r.id === selectedId) || RESEARCH_REPORTS[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Technical Manuscript & Scientific Reports Library
            </h2>
            <p className="text-xs text-slate-400">
              Comprehensive peer-reviewed documentation, clinical theory, and FDA 2025 validation protocols.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manuscript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Main Layout: Left Sidebar + Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {filteredReports.map((report) => {
            const isSelected = report.id === activeReport.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedId(report.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-teal-950/40 border-teal-500/50 shadow-md shadow-teal-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {report.badge}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-teal-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </div>
                <h4
                  className={`font-semibold text-xs leading-snug ${
                    isSelected ? 'text-teal-200' : 'text-slate-300'
                  }`}
                >
                  {report.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {report.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Content Viewer (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {activeReport.badge}
              </span>
              <span className="text-xs font-mono text-slate-500">Document Ref: SE-TECH-2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{activeReport.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              {activeReport.summary}
            </p>
          </div>

          {/* Render Document Content */}
          <div className="prose prose-invert prose-teal max-w-none text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
            {activeReport.content
              .trim()
              .split('\n\n')
              .map((block, idx) => {
                if (block.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-base sm:text-lg font-bold text-teal-300 pt-3 border-t border-slate-800/80"
                    >
                      {block.replace('### ', '')}
                    </h3>
                  );
                }
                if (block.startsWith('#### ')) {
                  return (
                    <h4 key={idx} className="text-sm sm:text-base font-bold text-cyan-200 pt-2">
                      {block.replace('#### ', '')}
                    </h4>
                  );
                }
                if (block.startsWith('```')) {
                  const code = block.replace(/```[a-z]*\n?/g, '').trim();
                  return (
                    <pre
                      key={idx}
                      className="p-4 rounded-xl bg-[#060a12] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto my-3"
                    >
                      {code}
                    </pre>
                  );
                }
                if (block.startsWith('|')) {
                  // Table rendering
                  const rows = block.trim().split('\n');
                  const headerRow = rows[0].split('|').filter((c) => c.trim().length > 0);
                  const dataRows = rows.slice(2).map((r) =>
                    r.split('|').filter((c) => c.trim().length > 0)
                  );

                  return (
                    <div key={idx} className="overflow-x-auto my-4 rounded-xl border border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-300 font-mono text-[11px] border-b border-slate-800">
                          <tr>
                            {headerRow.map((h, hIdx) => (
                              <th key={hIdx} className="py-2.5 px-3">
                                {h.trim()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                          {dataRows.map((dr, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/30">
                              {dr.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 text-slate-300">
                                  {cell.trim()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                if (block.startsWith('---')) {
                  return <hr key={idx} className="border-slate-800 my-4" />;
                }
                return (
                  <p key={idx} className="leading-relaxed">
                    {block}
                  </p>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Printer, Star, Calendar, ShieldCheck } from 'lucide-react';
import type { Analysis } from '../types';

interface ReportViewerProps {
  analysis: Analysis;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  analysis,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const { companyName, recommendation, confidenceScore, createdAt, reportContent } = analysis;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Premium Dashboard Metrics Summary */}
      <div className="p-6 rounded-2xl glass-panel border-indigo-500/10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
              recommendation === 'INVEST'
                ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{companyName} Research</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Rating and Confidence Widget */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              Fund Rating
            </span>
            <span
              className={`text-2xl font-black px-4 py-1.5 rounded-xl tracking-wider text-glow-${
                recommendation === 'INVEST' ? 'teal' : 'indigo'
              } ${
                recommendation === 'INVEST'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {recommendation}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              {/* Simple Circular Progress Bar */}
              <svg className="w-14 h-14">
                <circle
                  className="text-slate-800"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="24"
                  cx="28"
                  cy="28"
                />
                <circle
                  className={recommendation === 'INVEST' ? 'text-teal-400' : 'text-indigo-400'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - confidenceScore / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="24"
                  cx="28"
                  cy="28"
                />
              </svg>
              <div className="absolute text-sm font-bold text-slate-200">{confidenceScore}%</div>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block">Confidence</span>
              <span className="text-slate-300 font-semibold">Algorithm Score</span>
            </div>
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWatchlist}
            className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${
              isWatchlisted
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-350 hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
            {isWatchlisted ? 'Monitored' : 'Watchlist'}
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 text-xs font-bold transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Structured Report Content (Markdown) */}
      <div className="p-8 md:p-12 rounded-2xl glass-panel border-indigo-500/10 shadow-xl print-container bg-slate-950/20">
        {/* Printable Header (Visible only when printing) */}
        <div className="hidden print-only mb-8 border-b pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-950">EQUITY RESEARCH MEMORANDUM</h1>
              <h2 className="text-xl font-bold mt-2 text-slate-800">Target Company: {companyName}</h2>
              <span className="text-xs text-slate-500">Analysis ID: {analysis.id}</span>
            </div>
            <div className="text-right border-l pl-6">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Recommendation</div>
              <div className="text-2xl font-black text-indigo-700">{recommendation}</div>
              <div className="text-xs text-slate-650 font-bold mt-1">Confidence: {confidenceScore}%</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-4">
            Analysis Date: {new Date(createdAt).toLocaleString()}
          </div>
        </div>

        {reportContent ? (
          <div className="markdown-body leading-relaxed">
            <ReactMarkdown>{reportContent}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-16">
            Error loading report contents. Please retry.
          </div>
        )}
      </div>
    </div>
  );
};

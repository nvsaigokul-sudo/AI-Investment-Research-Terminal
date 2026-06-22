import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Printer, BarChart3 } from 'lucide-react';
import type { ComparisonResult } from '../types';

interface CompareModalProps {
  comparison: ComparisonResult;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ comparison, onClose }) => {
  const { company1, company2, comparisonReport } = comparison;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-indigo-500/20 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 no-print">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Comparative Analysis: <span className="text-indigo-400">{company1}</span> vs <span className="text-purple-400">{company2}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs font-bold transition-all duration-200"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Comparison
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20">
          
          {/* Printable comparison header (visible only in print) */}
          <div className="hidden print-only mb-8 border-b pb-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase">
              Comparative Equity Research Memorandum
            </h1>
            <h2 className="text-lg font-bold mt-2 text-slate-800">
              Comparing: {company1} vs {company2}
            </h2>
            <div className="text-xs text-slate-500 mt-2">
              Generated Date: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="markdown-body leading-relaxed">
            <ReactMarkdown>{comparisonReport}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trash2, FileText, CheckSquare, Square, BarChart2 } from 'lucide-react';
import type { Analysis } from '../types';

interface HistorySidebarProps {
  analyses: Omit<Analysis, 'logs' | 'reportContent'>[];
  activeId: string | null;
  selectedCompareIds: string[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onCompare: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  analyses,
  activeId,
  selectedCompareIds,
  onSelect,
  onDelete,
  onToggleCompare,
  onCompare,
}) => {
  return (
    <div className="w-80 h-full flex flex-col border-r border-slate-800/80 bg-slate-950/40 text-slate-200">
      <div className="p-4 border-b border-slate-850">
        <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          Recent Analyses
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select two reports to generate a comparative analysis.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {analyses.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            No analyses run yet.
          </div>
        ) : (
          analyses.map((analysis) => {
            const isActive = activeId === analysis.id;
            const isSelectedForCompare = selectedCompareIds.includes(analysis.id);

            return (
              <div
                key={analysis.id}
                onClick={() => onSelect(analysis.id)}
                className={`group relative p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                    : 'bg-slate-900/20 border-slate-800/40 hover:bg-slate-800/20 hover:border-slate-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="pr-8">
                    <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {analysis.companyName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider ${
                          analysis.recommendation === 'INVEST'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {analysis.recommendation}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Score: {analysis.confidenceScore}%
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-2">
                      {new Date(analysis.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 flex flex-col items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(analysis.id);
                      }}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                        isSelectedForCompare ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Compare report"
                    >
                      {isSelectedForCompare ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(analysis.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 opacity-60 md:opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCompareIds.length > 0 && (
        <div className="p-4 border-t border-slate-850 bg-slate-900/50 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Selected for comparison:</span>
            <span className="font-semibold text-indigo-400">{selectedCompareIds.length}/2</span>
          </div>
          <button
            onClick={onCompare}
            disabled={selectedCompareIds.length !== 2}
            className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-250 ${
              selectedCompareIds.length === 2
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white cursor-pointer shadow-md btn-glow'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Compare Reports
          </button>
        </div>
      )}
    </div>
  );
};

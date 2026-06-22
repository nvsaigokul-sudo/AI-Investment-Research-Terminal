import React from 'react';
import { Star, RefreshCw, X } from 'lucide-react';
import type { WatchlistItem } from '../types';

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
  onAnalyze: (companyName: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({ items, onRemove, onAnalyze }) => {
  return (
    <div className="p-6 rounded-2xl glass-panel border-indigo-500/10 shadow-xl space-y-4 max-w-sm w-full no-print">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h2 className="text-md font-bold text-slate-100 flex items-center gap-1.5">
          Fund Watchlist
        </h2>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="text-center text-slate-500 py-6 text-xs leading-relaxed">
            No companies added yet.<br />Click the star icon on any research report to track a company.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-850 hover:bg-slate-900/40 transition-all duration-200 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-200 uppercase tracking-wide truncate">
                    {item.companyName}
                  </span>
                  {item.recommendation && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-black scale-90 ${
                        item.recommendation === 'INVEST'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.recommendation}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Added: {new Date(item.addedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onAnalyze(item.companyName)}
                  className="p-1 rounded text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  title="Run analysis now"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onRemove(item.symbol)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove from watchlist"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

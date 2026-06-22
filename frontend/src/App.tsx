import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, AlertCircle, BarChart3, ArrowRight } from 'lucide-react';
import { HistorySidebar } from './components/HistorySidebar';
import { ProgressTracker } from './components/ProgressTracker';
import { ReportViewer } from './components/ReportViewer';
import { CompareModal } from './components/CompareModal';
import { Watchlist } from './components/Watchlist';
import type { Analysis, ComparisonResult, WatchlistItem } from './types';

const API_BASE = 'http://localhost:3001/api';

const App: React.FC = () => {
  // Application State
  const [companyInput, setCompanyInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Omit<Analysis, 'logs' | 'reportContent'>[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  
  // Selection/Comparison State
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Initialize Data on Mount
  useEffect(() => {
    fetchHistory();
    loadWatchlist();
  }, []);

  // Fetch all past analyses
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Watchlist Helpers (stored in localStorage for simplicity)
  const loadWatchlist = () => {
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  };

  const handleToggleWatchlist = () => {
    if (!activeAnalysis) return;
    const isPresent = watchlist.some((item) => item.symbol === activeAnalysis.id);
    let updated: WatchlistItem[];

    if (isPresent) {
      updated = watchlist.filter((item) => item.symbol !== activeAnalysis.id);
    } else {
      updated = [
        ...watchlist,
        {
          symbol: activeAnalysis.id,
          companyName: activeAnalysis.companyName,
          addedAt: new Date().toISOString(),
          recommendation: activeAnalysis.recommendation,
          confidenceScore: activeAnalysis.confidenceScore,
        },
      ];
    }
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  const handleRemoveFromWatchlist = (id: string) => {
    const updated = watchlist.filter((item) => item.symbol !== id);
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  // Launch analysis run
  const handleAnalyze = async (companyName: string) => {
    if (!companyName.trim()) return;
    setIsAnalyzing(true);
    setActiveAnalysis(null);
    setSelectedCompareIds([]);

    // Initialize a temporary local state for immediate feedback
    const tempAnalysis: Analysis = {
      id: 'pending',
      companyName,
      recommendation: 'PASS',
      confidenceScore: 0,
      createdAt: new Date().toISOString(),
      status: 'Running',
      reportContent: null,
      logs: [],
    };
    setActiveAnalysis(tempAnalysis);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName }),
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();

      if (data.success && data.analysisId) {
        startPolling(data.analysisId);
      } else {
        throw new Error('No analysis ID returned');
      }
    } catch (err) {
      console.error('Error starting analysis:', err);
      setIsAnalyzing(false);
      setActiveAnalysis(null);
      alert('Failed to launch the AI Investment Analysis workflow. Please check backend status.');
    }
  };

  // Polling loop to fetch logs & final report
  const startPolling = (analysisId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/analyses/${analysisId}`);
        if (!res.ok) {
          clearInterval(interval);
          throw new Error('Error fetching analysis details');
        }

        const data = await res.json();
        setActiveAnalysis(data);

        if (data.status === 'Completed') {
          clearInterval(interval);
          setIsAnalyzing(false);
          fetchHistory();
          // Celebrate with confetti if recommendation is INVEST!
          if (data.recommendation === 'INVEST') {
            import('canvas-confetti').then((conf) => {
              conf.default({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 }
              });
            });
          }
        } else if (data.status === 'Failed') {
          clearInterval(interval);
          setIsAnalyzing(false);
          alert('AI agent workflow failed. Please verify your GEMINI_API_KEY.');
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(interval);
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  // Load a historic report
  const handleSelectHistory = async (id: string) => {
    if (isAnalyzing) return;
    try {
      const res = await fetch(`${API_BASE}/analyses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveAnalysis(data);
      }
    } catch (err) {
      console.error('Error fetching analysis detail:', err);
    }
  };

  // Delete from history
  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/analyses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeAnalysis?.id === id) {
          setActiveAnalysis(null);
        }
        setSelectedCompareIds(selectedCompareIds.filter((cid) => cid !== id));
        fetchHistory();
      }
    } catch (err) {
      console.error('Error deleting analysis:', err);
    }
  };

  // Handle comparative analysis selection
  const handleToggleCompare = (id: string) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds(selectedCompareIds.filter((cid) => cid !== id));
    } else {
      if (selectedCompareIds.length < 2) {
        setSelectedCompareIds([...selectedCompareIds, id]);
      } else {
        setSelectedCompareIds([selectedCompareIds[1], id]);
      }
    }
  };

  // Trigger compare API
  const handleCompare = async () => {
    if (selectedCompareIds.length !== 2) return;
    setIsComparing(true);
    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id1: selectedCompareIds[0],
          id2: selectedCompareIds[1],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      } else {
        alert('Failed to generate comparative report.');
      }
    } catch (err) {
      console.error('Error comparing:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden">
      
      {/* 1. History Sidebar */}
      <div className="no-print">
        <HistorySidebar
          analyses={history}
          activeId={activeAnalysis?.id || null}
          selectedCompareIds={selectedCompareIds}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onToggleCompare={handleToggleCompare}
          onCompare={handleCompare}
        />
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex justify-between items-center bg-slate-950/20 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-200 bg-clip-text text-transparent">
              AI Investment Research Terminal
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Operational Gateway
          </div>
        </header>

        {/* Dynamic content scroll wrapper */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Dashboard Welcome & Search Bar */}
          {!activeAnalysis && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 max-w-2xl mx-auto no-print">
              <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                <BarChart3 className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Automated Equity Research memorandum
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Analyze equities using a state-of-the-art multi-agent workflow. The system performs company research, evaluates economic moats, assesses financials, maps risks, and gives an institutional recommendation.
                </p>
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze(companyInput);
                }}
                className="w-full max-w-lg flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="Enter company name (e.g. Tesla, NVIDIA, Apple)..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!companyInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-lg btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Examples */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-xs text-slate-500">Try these:</span>
                {['Tesla', 'NVIDIA', 'Apple', 'Infosys'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setCompanyInput(name);
                      handleAnalyze(name);
                    }}
                    className="text-xs bg-slate-900 border border-slate-850 hover:border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 transition-all cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Watchlist widget */}
              <div className="pt-8">
                <Watchlist
                  items={watchlist}
                  onRemove={handleRemoveFromWatchlist}
                  onAnalyze={handleAnalyze}
                />
              </div>
            </div>
          )}

          {/* 3. Real-time Workflow Execution Progress Tracker */}
          {activeAnalysis && activeAnalysis.status === 'Running' && (
            <div className="no-print py-10">
              <ProgressTracker logs={activeAnalysis.logs} status={activeAnalysis.status} />
            </div>
          )}

          {/* 4. Complete Research Report Rendering */}
          {activeAnalysis && activeAnalysis.status === 'Completed' && (
            <div className="space-y-6">
              <div className="no-print">
                {/* Search Bar on top when report is loaded */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAnalyze(companyInput);
                  }}
                  className="max-w-xl mx-auto flex gap-2 mb-6"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      placeholder="Enter new company name..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    Analyze
                  </button>
                </form>
              </div>

              <ReportViewer
                analysis={activeAnalysis}
                isWatchlisted={watchlist.some((item) => item.symbol === activeAnalysis.id)}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          )}

          {/* 5. Error View */}
          {activeAnalysis && activeAnalysis.status === 'Failed' && (
            <div className="max-w-md mx-auto p-6 rounded-2xl glass-panel border-rose-500/10 text-center space-y-4 py-12 no-print">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100">Analysis Session Terminated</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent pipeline failed. This is usually due to an invalid or missing <code className="bg-slate-950 px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code>. Check your environment configuration and restart the server.
              </p>
              <button
                onClick={() => setActiveAnalysis(null)}
                className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Comparison Loading State Spinner */}
      {isComparing && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="p-6 rounded-2xl glass-panel border-indigo-500/20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <h4 className="font-bold text-slate-200">Evaluating Dual Profiles</h4>
            <p className="text-xs text-slate-450">Generating side-by-side comparative analysis...</p>
          </div>
        </div>
      )}

      {/* 6. Comparison Results Modal overlay */}
      {comparisonResult && (
        <CompareModal
          comparison={comparisonResult}
          onClose={() => {
            setComparisonResult(null);
            setSelectedCompareIds([]);
          }}
        />
      )}
    </div>
  );
};

export default App;

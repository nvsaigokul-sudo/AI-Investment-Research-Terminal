import React, { useState } from 'react';
import { Loader2, CheckCircle, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import type { AgentLog } from '../types';

interface ProgressTrackerProps {
  logs: AgentLog[];
  status: string;
}

interface Step {
  id: string;
  name: string;
  agentName: string;
  description: string;
}

const steps: Step[] = [
  { id: 'research', name: 'Research Agent', agentName: 'Research Agent', description: 'Gathers company overview, industry trends, and business model.' },
  { id: 'business', name: 'Business Analysis Agent', agentName: 'Business Analysis Agent', description: 'Evaluates revenue streams, strengths, and competitive moat.' },
  { id: 'financial', name: 'Financial Analysis Agent', agentName: 'Financial Analysis Agent', description: 'Assesses profitability, capital structure, cash flow, and growth.' },
  { id: 'risk', name: 'Risk Analysis Agent', agentName: 'Risk Analysis Agent', description: 'Identifies core risk vectors and assigns severity levels.' },
  { id: 'decision', name: 'Decision Agent', agentName: 'Decision Agent', description: 'Synthesizes dossier to output rating (INVEST/PASS) & confidence score.' },
  { id: 'report', name: 'Report Generator Agent', agentName: 'Report Generator Agent', description: 'Compiles the institutional-grade investment memorandum.' },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ logs, status }) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getStepStatus = (step: Step, index: number) => {
    const hasLog = logs.some((l) => l.agentName === step.agentName);
    if (hasLog) return 'completed';

    // Find the current active step by looking at the logs length
    const activeIndex = logs.length;
    if (index === activeIndex) return 'running';
    if (index < activeIndex) return 'completed';
    return 'pending';
  };

  const toggleExpand = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 rounded-2xl glass-panel border-indigo-500/10 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Agentic AI Workflow Executing
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Watch the multi-agent pipeline analyze the company details sequentially.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 text-xs font-semibold text-indigo-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Status: {status}
        </div>
      </div>

      <div className="relative border-l border-slate-800 ml-4 pl-8 space-y-8 py-2">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step, index);
          const stepLog = logs.find((l) => l.agentName === step.agentName);
          const isExpanded = expandedStep === step.id;

          return (
            <div key={step.id} className="relative">
              {/* Step indicator dot */}
              <div
                className={`absolute -left-[45px] top-0.5 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  stepStatus === 'completed'
                    ? 'bg-teal-950/40 border-teal-500 text-teal-400'
                    : stepStatus === 'running'
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 pulse-ring-active'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {stepStatus === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : stepStatus === 'running' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              <div className="flex justify-between items-start">
                <div onClick={() => stepStatus === 'completed' && toggleExpand(step.id)} className="cursor-pointer">
                  <h3
                    className={`font-semibold text-sm transition-colors ${
                      stepStatus === 'completed'
                        ? 'text-slate-100 hover:text-indigo-400'
                        : stepStatus === 'running'
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>

                {stepStatus === 'completed' && (
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-900/50"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Log Details Container */}
              {isExpanded && stepLog && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                  <span className="text-indigo-400 block mb-1">
                    [{new Date(stepLog.timestamp).toLocaleTimeString()}] Agent Output JSON:
                  </span>
                  <pre className="whitespace-pre-wrap font-sans text-[12px] bg-slate-950 p-2 rounded">
                    {JSON.stringify(stepLog.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

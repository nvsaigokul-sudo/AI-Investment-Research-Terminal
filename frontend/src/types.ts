export interface AgentLog {
  agentName: string;
  output: any;
  timestamp: string;
}

export interface Analysis {
  id: string;
  companyName: string;
  recommendation: 'INVEST' | 'PASS';
  confidenceScore: number;
  createdAt: string;
  status: 'Running' | 'Completed' | 'Failed';
  reportContent: string | null;
  logs: AgentLog[];
}

export interface ComparisonResult {
  company1: string;
  company2: string;
  comparisonReport: string;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedAt: string;
  recommendation?: 'INVEST' | 'PASS';
  confidenceScore?: number;
}

import { Annotation } from "@langchain/langgraph";

export interface AgentLog {
  agentName: string;
  output: any;
  timestamp: string;
}

export interface ResearchData {
  companyOverview: string;
  industry: string;
  marketPosition: string;
  businessModel: string;
  productsAndServices: string[];
}

export interface BusinessData {
  strengths: string[];
  opportunities: string[];
  competitiveAdvantage: string;
  marketLeadership: string;
}

export interface FinancialData {
  financialStrength: string;
  profitability: string;
  cashFlow: string;
  revenueGrowth: string;
  financialHealthSummary: string;
}

export interface RiskData {
  risks: string[];
  severity: string[];
  regulatoryRisk: string;
  technologyRisk: string;
  competitionRisk: string;
}

export interface DecisionData {
  recommendation: 'INVEST' | 'PASS';
  confidence: number;
  reasoning: string;
}

// Annotation configuration for LangGraph state
export const AgentStateAnnotation = Annotation.Root({
  analysisId: Annotation<string>(),
  companyName: Annotation<string>(),
  researchData: Annotation<ResearchData>(),
  businessData: Annotation<BusinessData>(),
  financialData: Annotation<FinancialData>(),
  riskData: Annotation<RiskData>(),
  decisionData: Annotation<DecisionData>(),
  reportContent: Annotation<string>(),
  logs: Annotation<AgentLog[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  status: Annotation<string>(),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config";
import { getDb } from "../../db/connection";
import { AgentState } from "../state";

// Initialize Gemini 2.5 Flash Model
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: config.geminiApiKey,
  temperature: 0.2,
});

// Helper to save logs to the database in real-time
async function logAgentExecution(analysisId: string, agentName: string, output: any) {
  try {
    const db = getDb();
    const logId = uuidv4();
    await db.execute(
      `INSERT INTO agent_logs (id, analysis_id, agent_name, agent_output, timestamp)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [logId, analysisId, agentName, JSON.stringify(output)]
    );
  } catch (error) {
    console.error(`Error saving agent log for ${agentName}:`, error);
  }
}

// ----------------------------------------------------
// 1. Research Agent
// ----------------------------------------------------
const ResearchOutputSchema = z.object({
  companyOverview: z.string().describe("A detailed 2-3 paragraph overview of the company, its history, mission, and current status."),
  industry: z.string().describe("The primary industry segment, market size, and macro industry trends."),
  marketPosition: z.string().describe("The company's market share, brand strength, and market positioning (e.g. leader, challenger)."),
  businessModel: z.string().describe("Detailed explanation of how the company generates revenue and its value proposition."),
  productsAndServices: z.array(z.string()).describe("List of core products, services, and brand names.")
});

export async function researchNode(state: AgentState) {
  console.log(`[Research Agent] Starting research on ${state.companyName}...`);
  
  const structuredLlm = llm.withStructuredOutput(ResearchOutputSchema);
  const prompt = `You are a professional investment researcher. Research the company "${state.companyName}".
Provide a comprehensive overview, industry description, market position, business model, and key products/services.
Be detailed, accurate, and objective.`;

  const result = await structuredLlm.invoke(prompt);
  
  await logAgentExecution(state.analysisId, "Research Agent", result);

  return {
    researchData: result,
    logs: [{
      agentName: "Research Agent",
      output: result,
      timestamp: new Date().toISOString()
    }],
    status: "Research Agent Completed"
  };
}

// ----------------------------------------------------
// 2. Business Analysis Agent
// ----------------------------------------------------
const BusinessOutputSchema = z.object({
  strengths: z.array(z.string()).describe("List of 3-5 core business strengths (e.g. intellectual property, network effects, brand equity)."),
  opportunities: z.array(z.string()).describe("List of 3-5 core growth opportunities (e.g. new markets, product expansions, AI adoption)."),
  competitiveAdvantage: z.string().describe("Detailed analysis of the economic moat (cost advantage, switching costs, network effects, intangible assets)."),
  marketLeadership: z.string().describe("Assessment of the company's pricing power, scale advantages, and market leadership stance.")
});

export async function businessNode(state: AgentState) {
  console.log(`[Business Agent] Analyzing business model for ${state.companyName}...`);
  if (!state.researchData) throw new Error("Research data is missing.");

  const structuredLlm = llm.withStructuredOutput(BusinessOutputSchema);
  const prompt = `You are a business strategy analyst. Analyze the business model of ${state.companyName}.
Based on the company research below, evaluate their core strengths, growth opportunities, competitive advantage (economic moat), and market leadership.

Research Data:
${JSON.stringify(state.researchData, null, 2)}`;

  const result = await structuredLlm.invoke(prompt);
  
  await logAgentExecution(state.analysisId, "Business Analysis Agent", result);

  return {
    businessData: result,
    logs: [{
      agentName: "Business Analysis Agent",
      output: result,
      timestamp: new Date().toISOString()
    }],
    status: "Business Agent Completed"
  };
}

// ----------------------------------------------------
// 3. Financial Analysis Agent
// ----------------------------------------------------
const FinancialOutputSchema = z.object({
  financialStrength: z.string().describe("Assessment of the balance sheet health, leverage levels, debt obligations, and capital structure (e.g. Strong, Stable, Weak)."),
  profitability: z.string().describe("Analysis of margins (gross, operating, net margins), ROE, and ROIC trends."),
  cashFlow: z.string().describe("Analysis of operating cash flow, free cash flow generation, and capital allocation priorities."),
  revenueGrowth: z.string().describe("Historical revenue growth trends, future forecast, and stability of growth."),
  financialHealthSummary: z.string().describe("A detailed summary of the company's overall financial health, summarizing capital efficiency and main indicators.")
});

export async function financialNode(state: AgentState) {
  console.log(`[Financial Agent] Performing financial analysis for ${state.companyName}...`);
  if (!state.researchData) throw new Error("Research data is missing.");

  const structuredLlm = llm.withStructuredOutput(FinancialOutputSchema);
  const prompt = `You are a chartered financial analyst. Perform a financial analysis on ${state.companyName}.
Analyze its financial strength, profitability margins, cash flow dynamics, and revenue growth trends based on its industry and business model.
State your assumptions clearly, referencing public financial profiles (known margins, capital intensity, cash conversion cycle).

Research Data:
${JSON.stringify(state.researchData, null, 2)}`;

  const result = await structuredLlm.invoke(prompt);
  
  await logAgentExecution(state.analysisId, "Financial Analysis Agent", result);

  return {
    financialData: result,
    logs: [{
      agentName: "Financial Analysis Agent",
      output: result,
      timestamp: new Date().toISOString()
    }],
    status: "Financial Agent Completed"
  };
}

// ----------------------------------------------------
// 4. Risk Analysis Agent
// ----------------------------------------------------
const RiskOutputSchema = z.object({
  risks: z.array(z.string()).describe("List of 4-6 major risk factors (macro, operational, competition, financial)."),
  severity: z.array(z.enum(["High", "Medium", "Low"])).describe("Risk severity matching each risk factor in order."),
  regulatoryRisk: z.string().describe("Evaluation of compliance, antitrust, government policy changes, or international trade barriers."),
  technologyRisk: z.string().describe("Evaluation of technical obsolescence, R&D needs, cybersecurity, or disruption."),
  competitionRisk: z.string().describe("Evaluation of peer competition, pricing pressure, and market share dilution risks.")
});

export async function riskNode(state: AgentState) {
  console.log(`[Risk Agent] Evaluating risk factors for ${state.companyName}...`);
  if (!state.researchData || !state.businessData || !state.financialData) {
    throw new Error("Pre-requisite data for risk analysis is missing.");
  }

  const structuredLlm = llm.withStructuredOutput(RiskOutputSchema);
  const prompt = `You are a risk management expert. Identify and analyze the key risk factors facing ${state.companyName}.
Analyze operational, competition, regulatory, and technology risks. Assign a severity level (High, Medium, Low) to each identified risk.

Company Context:
Research: ${JSON.stringify(state.researchData, null, 2)}
Business Strengths: ${JSON.stringify(state.businessData, null, 2)}
Financial Health: ${JSON.stringify(state.financialData, null, 2)}`;

  const result = await structuredLlm.invoke(prompt);
  
  await logAgentExecution(state.analysisId, "Risk Analysis Agent", result);

  return {
    riskData: result,
    logs: [{
      agentName: "Risk Analysis Agent",
      output: result,
      timestamp: new Date().toISOString()
    }],
    status: "Risk Agent Completed"
  };
}

// ----------------------------------------------------
// 5. Decision Agent
// ----------------------------------------------------
const DecisionOutputSchema = z.object({
  recommendation: z.enum(["INVEST", "PASS"]).describe("The final investment rating: must be either INVEST or PASS."),
  confidence: z.number().min(0).max(100).describe("Confidence score from 0 to 100."),
  reasoning: z.string().describe("Detailed investment thesis outlining the core arguments for the recommendation, addressing how strengths outweigh risks or vice-versa.")
});

export async function decisionNode(state: AgentState) {
  console.log(`[Decision Agent] Making final decision for ${state.companyName}...`);
  if (!state.researchData || !state.businessData || !state.financialData || !state.riskData) {
    throw new Error("Pre-requisite data for decision agent is missing.");
  }

  const structuredLlm = llm.withStructuredOutput(DecisionOutputSchema);
  
  const prompt = `You are the Chief Investment Officer of a multi-billion dollar hedge fund.
Review the investment dossier for "${state.companyName}" and make a final recommendation: INVEST or PASS.
Determine a confidence score (0-100) and explain your reasoning clearly, addressing economic moat, financial trends, and the risk matrix.

Dossier:
Research: ${JSON.stringify(state.researchData, null, 2)}
Business Strengths: ${JSON.stringify(state.businessData, null, 2)}
Financial Health: ${JSON.stringify(state.financialData, null, 2)}
Risks & Severity: ${JSON.stringify(state.riskData, null, 2)}

System Prompt Guidelines:
Evaluate:
* Business quality
* Financial strength
* Competitive advantages
* Risks
Provide:
1. Recommendation (INVEST or PASS)
2. Confidence Score (0-100)
3. Detailed reasoning
4. Major risks
Always explain your decision clearly.`;

  const result = await structuredLlm.invoke(prompt);
  
  await logAgentExecution(state.analysisId, "Decision Agent", result);

  // Update main analysis table in database with final decision and confidence score
  try {
    const db = getDb();
    await db.execute(
      `UPDATE analyses 
       SET recommendation = $1, confidence_score = $2 
       WHERE id = $3`,
      [result.recommendation, result.confidence, state.analysisId]
    );
  } catch (error) {
    console.error("Error updating analysis table:", error);
  }

  return {
    decisionData: result,
    logs: [{
      agentName: "Decision Agent",
      output: result,
      timestamp: new Date().toISOString()
    }],
    status: "Decision Agent Completed"
  };
}

// ----------------------------------------------------
// 6. Report Generator Agent
// ----------------------------------------------------
export async function reportNode(state: AgentState) {
  console.log(`[Report Generator] Generating final report for ${state.companyName}...`);
  if (!state.researchData || !state.businessData || !state.financialData || !state.riskData || !state.decisionData) {
    throw new Error("Analysis data incomplete; cannot generate report.");
  }

  const prompt = `You are a lead financial writer. Compile a comprehensive, professional, institutional-grade Equity Research Report for "${state.companyName}".
Format the report beautifully in Markdown. Make sure it looks like a premium SaaS dashboard product output.

Use the following section headers:
# Equity Research Report: ${state.companyName}
## Executive Summary
(State recommendation, confidence score, and primary investment thesis)

## Company Overview
(Synthesize overview, industry trend, business model, and key products)

## Strengths & Opportunities
(Combine business strengths, opportunities, and competitive advantages)

## Financial Health
(Summarize leverage, margins, profitability, and cash flow)

## Risk Assessment
(Explain risk factors, severity, regulatory and technology threats. Display as a markdown table showing Risk and Severity)

## Investment Recommendation & Conclusion
(State final INVEST or PASS recommendation, confidence score (0-100), and detailed final reasoning)

Use the following data:
Research: ${JSON.stringify(state.researchData, null, 2)}
Business Analysis: ${JSON.stringify(state.businessData, null, 2)}
Financial Analysis: ${JSON.stringify(state.financialData, null, 2)}
Risk Analysis: ${JSON.stringify(state.riskData, null, 2)}
Decision: ${JSON.stringify(state.decisionData, null, 2)}`;

  const result = await llm.invoke(prompt);
  const reportContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

  // Insert into reports table in the database
  try {
    const db = getDb();
    const reportId = uuidv4();
    await db.execute(
      `INSERT INTO reports (id, analysis_id, report_content, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [reportId, state.analysisId, reportContent]
    );
  } catch (error) {
    console.error("Error inserting report in database:", error);
  }

  await logAgentExecution(state.analysisId, "Report Generator Agent", { status: "Report Generated Successfully" });

  return {
    reportContent,
    logs: [{
      agentName: "Report Generator Agent",
      output: { status: "Report Generated Successfully" },
      timestamp: new Date().toISOString()
    }],
    status: "Report Generated"
  };
}

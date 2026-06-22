import { StateGraph } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection";
import { AgentStateAnnotation, AgentState } from "./state";
import {
  researchNode,
  businessNode,
  financialNode,
  riskNode,
  decisionNode,
  reportNode,
} from "./nodes";

// Create the LangGraph workflow StateGraph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("research", researchNode)
  .addNode("business", businessNode)
  .addNode("financial", financialNode)
  .addNode("risk", riskNode)
  .addNode("decision", decisionNode)
  .addNode("report", reportNode)
  // Set up the linear agent chain
  .addEdge("__start__", "research")
  .addEdge("research", "business")
  .addEdge("business", "financial")
  .addEdge("financial", "risk")
  .addEdge("risk", "decision")
  .addEdge("decision", "report")
  .addEdge("report", "__end__");

// Compile the graph
export const graph = workflow.compile();

/**
 * Runs the full multi-agent investment analysis for a company.
 * @param companyName Name of the company to analyze
 * @returns The final compiled agent state
 */
export async function runAnalysis(companyName: string): Promise<AgentState> {
  const db = getDb();
  const analysisId = uuidv4();

  console.log(`[Workflow] Initializing analysis DB record for ${companyName} with ID: ${analysisId}`);
  
  // Insert initial analysis record
  await db.execute(
    `INSERT INTO analyses (id, company_name, recommendation, confidence_score, created_at)
     VALUES ($1, $2, 'PASS', 0, CURRENT_TIMESTAMP)`,
    [analysisId, companyName]
  );

  // Execute the compiled LangGraph workflow
  const finalState = await graph.invoke({
    analysisId,
    companyName,
    status: "Initializing",
    logs: [],
  });

  console.log(`[Workflow] Completed analysis for ${companyName}. ID: ${analysisId}`);
  return finalState;
}

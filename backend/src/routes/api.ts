import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection';
import { runAnalysis } from '../agents/workflow';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from '../config';

const router = Router();

// ----------------------------------------------------
// 1. Trigger Company Analysis (Asynchronous)
// ----------------------------------------------------
router.post('/analyze', async (req: Request, res: Response) => {
  const { company } = req.body;
  if (!company || typeof company !== 'string') {
    return res.status(400).json({ error: 'Company name is required and must be a string.' });
  }

  try {
    const db = getDb();
    const analysisId = uuidv4();

    // Insert initial placeholder row
    await db.execute(
      `INSERT INTO analyses (id, company_name, recommendation, confidence_score, created_at)
       VALUES ($1, $2, 'PASS', 0, CURRENT_TIMESTAMP)`,
      [analysisId, company]
    );

    // Run the multi-agent LangGraph workflow in the background to avoid HTTP timeout
    // We pass the analysisId in the state so the agents log to the correct row
    (async () => {
      try {
        console.log(`[Background] Starting workflow for analysis ID: ${analysisId}`);
        const { graph } = await import('../agents/workflow');
        await graph.invoke({
          analysisId,
          companyName: company,
          status: 'Initializing',
          logs: []
        });
        console.log(`[Background] Workflow completed successfully for ID: ${analysisId}`);
      } catch (err) {
        console.error(`[Background] Error running workflow for ID: ${analysisId}:`, err);
        // Log the failure to agent_logs so the client is notified
        try {
          await db.execute(
            `INSERT INTO agent_logs (id, analysis_id, agent_name, agent_output, timestamp)
             VALUES ($1, $2, 'System Error', $3, CURRENT_TIMESTAMP)`,
            [uuidv4(), analysisId, JSON.stringify({ error: err instanceof Error ? err.message : String(err) })]
          );
          // Set confidence to 0 and recommendation to PASS as error indicators
          await db.execute(
            `UPDATE analyses SET confidence_score = 0 WHERE id = $1`,
            [analysisId]
          );
        } catch (dbErr) {
          console.error('[Background] Failed to log error to database:', dbErr);
        }
      }
    })();

    // Respond immediately with the analysisId
    return res.json({
      success: true,
      message: 'Analysis started in the background.',
      analysisId
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    return res.status(500).json({ error: 'Failed to start analysis.' });
  }
});

// ----------------------------------------------------
// 2. Get Analysis History
// ----------------------------------------------------
router.get('/history', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = await db.query(
      `SELECT id, company_name, recommendation, confidence_score, created_at 
       FROM analyses 
       ORDER BY created_at DESC`
    );
    // Map database snake_case keys to camelCase required by the frontend
    const formattedRows = rows.map(row => ({
      id: row.id,
      companyName: row.company_name,
      recommendation: row.recommendation,
      confidenceScore: row.confidence_score,
      createdAt: row.created_at
    }));
    return res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ----------------------------------------------------
// 3. Get Details of a Specific Analysis (with Logs & Report)
// ----------------------------------------------------
router.get('/analyses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const db = getDb();
    
    // Fetch analysis metadata
    const analyses = await db.query(
      `SELECT * FROM analyses WHERE id = $1`,
      [id]
    );

    if (analyses.length === 0) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }

    const analysis = analyses[0];

    // Fetch associated report
    const reports = await db.query(
      `SELECT * FROM reports WHERE analysis_id = $1`,
      [id]
    );
    const report = reports.length > 0 ? reports[0] : null;

    // Fetch agent execution logs
    const logs = await db.query(
      `SELECT agent_name, agent_output, timestamp 
       FROM agent_logs 
       WHERE analysis_id = $1 
       ORDER BY timestamp ASC`,
      [id]
    );

    // Format logs output
    const formattedLogs = logs.map(l => ({
      agentName: l.agent_name,
      output: JSON.parse(l.agent_output),
      timestamp: l.timestamp
    }));

    // Determine completion status based on whether report exists or system error occurred
    let status = 'Running';
    const hasError = formattedLogs.some(l => l.agentName === 'System Error');
    
    if (report) {
      status = 'Completed';
    } else if (hasError) {
      status = 'Failed';
    }

    return res.json({
      id: analysis.id,
      companyName: analysis.company_name,
      recommendation: analysis.recommendation,
      confidenceScore: analysis.confidence_score,
      createdAt: analysis.created_at,
      status,
      reportContent: report ? report.report_content : null,
      logs: formattedLogs
    });
  } catch (error) {
    console.error(`Error fetching analysis ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch analysis details.' });
  }
});

// ----------------------------------------------------
// 4. Delete Analysis
// ----------------------------------------------------
router.delete('/analyses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const db = getDb();
    await db.execute(`DELETE FROM analyses WHERE id = $1`, [id]);
    return res.json({ success: true, message: 'Analysis deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting analysis ${id}:`, error);
    return res.status(500).json({ error: 'Failed to delete analysis.' });
  }
});

// ----------------------------------------------------
// 5. Compare Two Companies (Bonus Feature)
// ----------------------------------------------------
router.post('/compare', async (req: Request, res: Response) => {
  const { id1, id2 } = req.body;
  if (!id1 || !id2) {
    return res.status(400).json({ error: 'Two analysis IDs (id1, id2) are required for comparison.' });
  }

  try {
    const db = getDb();

    const reports1 = await db.query(`SELECT report_content, company_name FROM reports r JOIN analyses a ON r.analysis_id = a.id WHERE a.id = $1`, [id1]);
    const reports2 = await db.query(`SELECT report_content, company_name FROM reports r JOIN analyses a ON r.analysis_id = a.id WHERE a.id = $2`, [id2]);

    if (reports1.length === 0 || reports2.length === 0) {
      return res.status(404).json({ error: 'One or both of the reports were not found.' });
    }

    const comp1 = reports1[0];
    const comp2 = reports2[0];

    // Use Gemini to generate a side-by-side comparison report
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: config.geminiApiKey,
      temperature: 0.3,
    });

    const prompt = `You are a senior investment committee reviewer. Compare the two investment research reports for "${comp1.company_name}" and "${comp2.company_name}" side-by-side.
Provide a clear comparison report in Markdown. Include:
1. Executive Side-by-Side Summary Table (Metrics, Recommendation, Moat, Core Risks).
2. Key Strengths Comparison.
3. Financial Profile Comparison.
4. Risk Profile Comparison.
5. Final Verdict (Which company represents the better risk-adjusted investment opportunity and why).

Report 1 (${comp1.company_name}):
${comp1.report_content}

Report 2 (${comp2.company_name}):
${comp2.report_content}
`;

    const result = await llm.invoke(prompt);
    const comparisonContent = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

    return res.json({
      company1: comp1.company_name,
      company2: comp2.company_name,
      comparisonReport: comparisonContent
    });
  } catch (error) {
    console.error('Error generating comparison:', error);
    return res.status(500).json({ error: 'Failed to generate comparison.' });
  }
});

export default router;

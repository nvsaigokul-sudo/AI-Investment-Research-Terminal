# Engineering Design & Chat Logs: AI Investment Research Terminal

This document translates development discussions and architecture planning sessions into formal engineering documentation. It details the requirements analysis, architectural options, database schema design, multi-agent workflows, and deployment validations.

---

## 1. Requirements Analysis

### Objective
Define the functional and non-functional requirements for the AI Investment Research Terminal, establishing the user flows, agent requirements, and stack choices.

### Alternatives Considered
1. **Simple Single-Prompt LLM Call**: Prompting a single LLM with all company research questions at once.
2. **Multi-Agent Orchestration (Selected)**: Segmenting analysis into specific domains (Research, Business, Financial, Risk, Decision, Report) orchestrated by a StateGraph.

### Selected Solution
A React-based SaaS frontend communicating with a Node.js Express backend that coordinates a multi-agent LangGraph workflow.

### Engineering Rationale
A single prompt often leads to hallucinations, key details being omitted, or LLM context fatigue. A modular, multi-agent flow breaks down the complexity into distinct cognitive tasks, each returning structured JSON outputs validation-checked by Zod schemas.

---

## 2. Architecture Planning

### Objective
Design the layout of the monorepo, backend-frontend communication, and execution context.

### Alternatives Considered
1. **Next.js Monolithic App**: Combining frontend and backend routes inside one Next.js application.
2. **Decoupled Monorepo (Selected)**: Vite+React for the frontend and Node.js+Express for the backend.

### Selected Solution
A monorepo structure with `/frontend` (React + Vite) and `/backend` (Express + TS) workspaces, managed with unified package commands.

### Engineering Rationale
Vite provides sub-second hot module reloading (HMR) and lightweight builds. A separate Node.js backend ensures that heavy LLM orchestration with LangGraph can run asynchronously, preventing HTTP server timeouts and keeping the client UI responsive.

---

## 3. Database Design

### Objective
Store history data, generated reports, and real-time execution logs for all runs.

### Alternatives Considered
1. **Document Database (MongoDB)**: Storing analyses and logs as nested JSON documents.
2. **Relational Database with SQLite Fallback (Selected)**: PostgreSQL for production and SQLite for local development.

### Selected Solution
A dual-client relational client using PostgreSQL (`pg`) in production (Render/Neon) and SQLite (`sqlite3`) locally.

### Engineering Rationale
Sqlite3 allows local development to function instantly without configuring server engines. Relational schemas map cleanly to the 1-to-many relationship of an `analysis` record to its `reports` and step-by-step `agent_logs`.

---

## 4. AI Workflow Design

### Objective
Construct the multi-agent pipeline and state transitions.

### Alternatives Considered
1. **Parallel Tool Calling**: Running all analysis agents concurrently and feeding the results to a compiler.
2. **Linear State Chain (Selected)**: Sequential flow where each agent reads the cumulative state of previous agents.

### Selected Solution
A compiled LangGraph `StateGraph` executing sequentially:
`Research` -> `Business` -> `Financial` -> `Risk` -> `Decision` -> `Report Generator`.

### Engineering Rationale
Financial and risk agents require company profiles and strengths (outputs of the research and business agents) to run effectively. A sequential chain mimics how a human equity research department operates.

---

## 5. Backend Development

### Objective
Create Express APIs to handle requests, stream logs, and connect to database drivers.

### Alternatives Considered
1. **Server-Sent Events (SSE) / WebSockets**: Streaming agent progress logs to the frontend via active connections.
2. **Database-Backed Polling Loop (Selected)**: Writing logs to the database in real-time and letting the frontend poll.

### Selected Solution
API endpoints (`POST /api/analyze`, `GET /api/analyses/:id`, `GET /api/history`) combined with background graph execution.

### Engineering Rationale
WebSockets and SSE add hosting complexity (CORS issues, serverless connection drops). A database-backed polling model ensures that if a connection drops, the execution continues in the background, and logs are safely stored for historical review.

---

## 6. Frontend Development

### Objective
Build a professional SaaS dashboard with progress stepping and markdown rendering.

### Alternatives Considered
1. **Simple Command-Line/Text Output**: Displaying raw text dumps as they generate.
2. **Immersive Dashboard (Selected)**: Real-time stepper, circular gauge meters, historical sidebars, and comparison modals.

### Selected Solution
Vite + React featuring Tailwind CSS (v4), Framer Motion for stepping animations, and custom scrollbar styles.

### Engineering Rationale
Investment terminals must look clean and modern. Progress steppers show that the AI is working agent-by-agent, increasing user trust, while expandable debug panels let engineers verify the structured data at each step.

---

## 7. Testing Strategy

### Objective
Validate that endpoints, database connection pools, and LangGraph pipelines execute reliably.

### Selected Solution
Local automated integration scripts using `ts-node` combined with browser validation steps.

### Engineering Rationale
Writing lightweight test scripts (such as `test-db.ts`) enables quick verification of database queries, schema configurations, and connection pools without starting the full server stack.

---

## 8. Deployment Planning

### Objective
Host the system securely with zero cost.

### Selected Solution
* **Frontend**: Vercel.
* **Backend**: Render.
* **Database**: Neon (Serverless PostgreSQL).

### Engineering Rationale
Vercel, Render, and Neon offer high-performance free tiers. They support automated Git triggers and allow managing environment variables safely in their respective control panels.

---

## 9. Engineering Decisions

### Objective
Optimize builds, resolve CORS blocks, and handle runtime environment pathing.

### Key Decisions
1. **Asset Copying Step**: Configured `tsc && node` scripts in `package.json` to move `schema.sql` to compiled output folders.
2. **Runtime Hostname Resolution**: Resolved API routes dynamically on the client based on `window.location.hostname` rather than hardcoding endpoints.
3. **Explicit CORS Headers**: Enabled specific origins (`vercel.app` and `localhost`) on the Express server to prevent browser CORS blocks.

---

## 10. Future Enhancements

### Objective
Define next-generation capabilities for the terminal.

### Proposals
1. **SEC Edgar Live Grounding**: Integrating agents with the SEC filing database to pull official 10-K financial reports.
2. **Sentiment Analysis Core**: Querying news search APIs and calculating real-time sentiment weights.
3. **Advanced User Accounts**: Adding user sessions via JWT/Auth0 to support private research history vaults.

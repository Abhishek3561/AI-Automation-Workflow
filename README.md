# Flowforge: AI Workflow Automation

Build workflows on a visual canvas where AI agents search your documents, query your data, and ask a person to approve the result before anything ships.

**Live demo:** [https://ai-automation-workflow.vercel.app/]
**Stack:** Next.js, TypeScript, Express, PostgreSQL + pgvector, BullMQ, LangChain, LangGraph

> The demo runs on free hosting. The first request after a quiet period can take about a minute while the server wakes up.

---

## What it does

- **Visual workflow builder.** Drag nodes onto a canvas (React Flow), connect them, and configure each one in a side panel.
- **AI agent with tools.** A LangGraph agent plans its own steps. It can search your documents, run read-only SQL against a sample database, and call public APIs. Every thought, tool call and result appears live on the run page.
- **RAG over your documents.** Upload PDF, TXT or MD files. They are chunked, embedded and stored in PostgreSQL with pgvector, and answers cite their source passages.
- **Human approval.** A run can pause at an approval step. A reviewer edits the draft and approves or rejects, and the run resumes from where it stopped, even after a server restart.
- **Branching.** If / Else nodes route a run down one path, and the other path is marked as skipped.
- **Three ways to start a run.** The Run button, a secret webhook URL (the request body becomes the input), or a cron schedule with a timezone.
- **Full run history.** Every step stores its input, output, error and timing.

## Architecture

```mermaid
flowchart LR
  UI[Next.js app<br/>React Flow editor] -->|/api proxy| API
  subgraph Server[Express server]
    API[REST API<br/>auth, workflows, documents, runs, webhooks]
    W[BullMQ worker<br/>run engine]
  end
  API -->|enqueue run| R[(Redis)]
  R --> W
  API --> PG[(PostgreSQL + pgvector)]
  W --> PG
  W --> A[LangGraph agent<br/>think and act loop]
  A -->|tools: documents, read-only SQL, HTTP| PG
  W -->|LLM and embeddings| G[Gemini API]
```

### How a run works

1. The API creates a run and one step per node in the database, then puts a job on the BullMQ queue and returns immediately.
2. A worker takes the job and orders the nodes with a topological sort (cycles are rejected before a run starts).
3. For each node it works out its input from the live incoming edges, runs the node, and stores the result. For If / Else nodes, only the chosen branch stays live, and the other nodes are marked `SKIPPED`.
4. At an approval node the step is saved as `WAITING_APPROVAL` and the job ends, so no worker is held. The decision endpoint claims the step atomically, then re-queues the run. The runner rebuilds earlier outputs from the completed steps and continues.
5. The run page polls for status, so every step, including the agent's reasoning, shows up live.

### The agent

The agent is a LangGraph `StateGraph` with a **think** node, an **act** node and a conditional edge, with a step cap.

- Each step asks the model for one small JSON decision (`thought`, `action`, `input`), which works with any model and avoids the thought-signature requirements of native function calling on recent Gemini models.
- Tools: `search_documents` (the RAG pipeline), `run_sql` (read-only), `http_get` (SSRF-guarded).
- Tool errors are returned to the agent as observations, so it can correct its own query.

### The RAG pipeline

Upload, extract text (`pdf-parse` or plain text), split with LangChain's recursive splitter (1000 characters, 150 overlap), embed with a Gemini embedding model at 768 dimensions, and store in a pgvector column. A question is embedded the same way, matched by cosine distance and filtered by user, and the model answers only from the retrieved passages and cites them.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, React Flow, lucide-react |
| Backend | Node.js, Express, TypeScript, Prisma, zod |
| Database | PostgreSQL with pgvector |
| Queue and scheduling | BullMQ on Redis (job schedulers for cron triggers) |
| AI | Gemini (LLM and embeddings), LangChain (text splitting, model wrapper), LangGraph (agent) |
| Auth | bcrypt password hashing, JWT in httpOnly cookies |
| Infrastructure | Docker (multi-stage builds), Docker Compose, Vercel, Render, Neon |

## Run it locally with Docker

You need Docker Desktop and a free [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/Abhishek3561/AI-Automation-Workflow.git
cd AI-Automation-Workflow
```

Create a file named `.env` in the project root:

```
POSTGRES_PASSWORD=choose-a-password
JWT_SECRET=any-long-random-string
GEMINI_API_KEY=your-gemini-key
```

Then start everything and load the sample data for the agent's SQL tool:

```bash
docker compose -f docker-compose.prod.yml -p flowforge up --build -d
docker compose -f docker-compose.prod.yml -p flowforge exec server node dist/db/seedDemo.js
```

Open <http://localhost:3000>, create an account, and build a workflow.

## Run it locally for development

```bash
# databases: Postgres with pgvector on port 5433, Redis on 6379
docker compose up -d

# server
cd server
npm install --legacy-peer-deps
npx prisma migrate dev
npx tsx src/db/seedDemo.ts
npm run dev

# client (second terminal)
cd client
npm install
npm run dev
```

`server/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workflow_builder?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=5000
CLIENT_URL="http://localhost:3000"
JWT_SECRET="any-long-random-string"
GEMINI_API_KEY="your-gemini-key"
```

`client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | server | PostgreSQL connection string (pgvector required) |
| `REDIS_URL` | server | Redis connection (use `rediss://` for TLS) |
| `JWT_SECRET` | server | Signs login cookies |
| `GEMINI_API_KEY` | server | LLM and embeddings |
| `GEMINI_MODEL` | server | Main model (optional, has a default) |
| `GEMINI_FALLBACK_MODEL` | server | Optional second model used when the main one is busy |
| `GEMINI_EMBEDDING_MODEL` | server | Embedding model (optional, has a default) |
| `CLIENT_URL` | server | Public URL of the frontend |
| `COOKIE_SECURE` | server | `true` when served over https |
| `BACKEND_URL` | client (build time) | Where the Next.js proxy forwards `/api` |
| `NEXT_PUBLIC_API_URL` | client (dev only) | Direct API address for local development |

## Deployment

The live version uses free tiers:

- **Vercel** hosts the Next.js client. It forwards `/api` to the server, so the browser only talks to one origin and the login cookie stays first-party.
- **Render** runs the server and the queue worker from `server/Dockerfile`. Migrations run on startup, and the server restores cron schedules from the database.
- **Neon** provides PostgreSQL with pgvector.
- **Render Key Value** provides Redis, set to the `noeviction` memory policy as BullMQ requires.

## Project structure

```
.
├── client/                  Next.js app
│   ├── app/                 pages: landing, auth, dashboard, documents, editor, runs
│   ├── components/          canvas nodes, palette, settings panel, UI kit
│   └── lib/                 API client, node definitions, helpers
├── server/
│   ├── prisma/              schema and migrations (including pgvector)
│   └── src/
│       ├── routes/          auth, workflows, runs, documents, webhooks
│       ├── engine/          run creation, graph ordering, node executors, resumable runner
│       ├── queue/           BullMQ queue, worker, scheduler
│       ├── ai/              LLM wrapper, RAG pipeline, LangGraph agent and tools
│       └── db/              Prisma client, sample-data seed
├── docker-compose.yml       development databases
└── docker-compose.prod.yml  full stack in containers
```

## Security notes

- Passwords are hashed with bcrypt. Sessions use JWTs in httpOnly cookies, and `Secure` is enabled in production.
- Every query is scoped to the signed-in user, and request bodies are validated with zod.
- The agent's SQL tool runs inside a `READ ONLY` transaction as a restricted role that can only read a separate sample schema, with a statement timeout and a row cap. It cannot reach application tables.
- Outbound HTTP from workflows and the agent blocks localhost and private network addresses and does not follow redirects.
- Webhook URLs contain an unguessable token, must be enabled on the Start node, and are limited to 10 runs per minute per workflow.
- Approval decisions are claimed atomically, so a step cannot be resumed twice.

## Limitations and roadmap

- Free hosting sleeps after inactivity, and the Gemini free tier has daily limits.
- No automated tests yet. Next up: unit tests for graph ordering and conditions, and integration tests for the runner.
- No vector index yet (fine for small data, HNSW is the next step).
- Scanned PDFs are not supported (no OCR).
- Approval requests have no email or chat notification yet.
- Webhooks use a secret URL. Signed requests (HMAC) would be stronger.

# AI Investment Arena — Architecture Documentation

This document explains the system architecture, design decisions, data boundaries, and operational considerations for the **AI Investment Arena** platform.

---

## 1. System Overview & Core Loop

AI Investment Arena is an AI-powered startup investment marketplace. Unlike conventional platforms where an LLM subjectively rates pitch decks, the platform converts founder claims into quantitative hypotheses, stress-tests assumptions with deterministic financial simulations, cross-checks evidence, challenges claims via a Red Team agent, and creates digital deal rooms with multi-investor negotiation tools.

```
Founder Claims
     ↓
Evidence Extraction (Document Intelligence Agent)
     ↓
Market & Competitor Research (Market/Competition Agents)
     ↓
Deterministic Business Simulation (Python: Bull / Base / Bear)
     ↓
Stress Test & Red Team (Red Team Agent)
     ↓
Founder Plan Iteration & Version Freeze
     ↓
Marketplace Listing (Deals)
     ↓
Digital Deal Rooms & AI Negotiation Copilot
     ↓
Cap Table & Term Sheet Agreement
```

---

## 2. Microservice Topology

The backend uses a focused set of six Python FastAPI services behind a lightweight API Gateway:

```
[ Frontend (React + Vite) ]
             │
             ▼ :8000
    [ API Gateway ]
       │      │      │          │            │           │
       ▼      ▼      ▼          ▼            ▼           ▼
    :8001   :8002  :8003      :8004        :8005       :7687
    [User] [Startup] [Investor] [Deal]    [AI-Service] [Neo4j]
       │      │      │          │            │
       └──────┴──────┴──────────┴────────────┘
                         │
                         ▼
             [ Supabase (PostgreSQL + Auth) ]
```

### Why These Specific Microservices Exist

1. **`api-gateway` (Port 8000)**: Single entry point for frontend traffic (`/api/*`). Verifies JWT bearer tokens, enforces CORS, proxies requests downstream, and isolates internal service topologies from public clients.
2. **`user-service` (Port 8001)**: Manages user profiles (startup founders, investors, admins) tied to Supabase Auth UUIDs.
3. **`startup-service` (Port 8002)**: Owns startup profiles, pitch materials, thesis versions, claims registry, and frozen analysis snapshots.
4. **`investor-service` (Port 8003)**: Manages investor profiles, investment preferences (stages, ticket sizes, sectors), and AI background assessments.
5. **`deal-service` (Port 8004)**: Handles deal listings, investor expressions of interest, multi-party digital deal rooms, messaging, term offers, and cap table negotiation states.
6. **`ai-service` (Port 8005)**: Encapsulates all agent orchestration, multi-provider fallbacks (Gemini, Groq, Mock), input caching, token usage tracking, and the deterministic Python simulation engine.

---

## 3. Data Architecture: Supabase + Neo4j Dual-Store

### Why Both Supabase and Neo4j Are Used

| Dimension | Supabase (PostgreSQL) | Neo4j (Graph Database) |
|---|---|---|
| **Primary Role** | Transactional source of truth | Relational graph exploration |
| **Data Stored** | Auth users, profile rows, startups, documents, claims text, financial runs, deal messages, term sheets | Edges between Startups, Competitors, Industries, Claims, Evidence, Investors |
| **Queries** | ACID transactions, CRUD operations, indexed lookups | Multi-hop graph traversals (`(:Investor)-[:INTERESTED_IN]->(:Industry)<-[:OPERATES_IN]-(:Startup)`) |
| **Ownership** | Owns UUID primary keys | Uses Supabase UUIDs as foreign node identifiers |

**Rule**: We never duplicate tabular data into Neo4j. Neo4j contains only nodes and relationship edges necessary for competitor mapping, evidence-claim dependency graphs, and investor-startup graph matching.

---

## 4. Google ADK & AI Isolation

### Why Google ADK Is Isolated in `ai-service`
- **Single Responsibility**: LLM SDK dependencies, prompt engineering, schema validation, and retry logic stay quarantined from CRUD microservices.
- **Independent Scaling**: Agent workflows are resource-intensive; running them in a dedicated service prevents AI workloads from starving the API gateway or transactional deal room messaging.
- **Provider Swappability**: Upstream services call standard REST endpoints (`/ai/startup-analysis`, `/ai/simulate`); they never know whether Gemini, Groq, Google ADK, or the Mock provider executed the task.

---

## 5. Token & Cost Control (0-Budget Hackathon Design)

To avoid API quota exhaustion or runaway costs during live demos:
1. **Deterministic Cache**: Every analysis request payload is hashed (`SHA-256`). Identical requests return immediately from cache with `from_cache: true`.
2. **Bounded Sequential Agents**: We strictly forbid recursive multi-agent loops (`Agent A -> Agent B -> Agent A`). All workflows execute a bounded sequence governed by `MAX_AI_CALLS_PER_WORKFLOW` (default: 8).
3. **Structured Small Context**: Agents receive extracted bullet points and structured JSON, never full raw document blobs.
4. **Usage Tracker**: Tracks calls, estimated tokens, and cache hits per workflow run.

---

## 6. AI Reliability & Fallback Architecture

The platform guarantees zero downtime during presentations even if an LLM API experiences rate limits or outages:

```
[ Incoming Request ]
         │
         ▼
[ In-Memory Cache Lookup ] ──(Hit)──► Return Cached Result
         │ (Miss)
         ▼
[ Primary Provider (Gemini / Groq) ]
         │
    (Success?)
     ├── YES ──► Validate JSON Schema ──► Cache & Return
     └── NO
          │ (Retry with Exponential Backoff)
          ▼
     [ Fallback Provider ]
          │
     (Success?)
      ├── YES ──► Validate JSON Schema ──► Cache & Return
      └── NO
           ▼
     [ Deterministic Mock Provider (Emergency Parachute) ]
           │
           └──► Return Seeded Realistic Structured Output
```

Setting `DEMO_MODE=true` forces deterministic instant mock responses across all workflows.

---

## 7. Deterministic Python Simulation vs. LLM Reasoning

**Core Principle**: LLMs do not calculate financial models.

- **LLM / ADK Role**:
  - Extract assumptions from founder documents (e.g. CAC, churn rate, monthly growth, operating costs).
  - Interpret market context, identify hidden risks, generate Red Team questions.
  - Summarize quantitative findings in natural language.
- **Deterministic Python Role**:
  - Compute revenue projections, cash runway, customer churn, gross margin, dilution, and pre/post-money cap tables (`backend/ai-service/app/simulation/`).
  - Calculate Bull, Base, and Bear cases using exact mathematical formulas.
  - Compute deterministic matching scores (0-100) based on weighted alignment matrices.

---

## 8. Docker Deployment & Orchestration

The stack is containerized with Docker Compose:
- Run `docker compose up --build` to build all images and start the stack.
- Neo4j starts first and executes health checks on port 7687.
- Microservices boot in parallel and report to `api-gateway`.
- `frontend` compiles via multi-stage Alpine Node build and is served by Nginx on port 5173.
- Seed data can be dispatched at any time via `python scripts/seed_demo_data.py`.

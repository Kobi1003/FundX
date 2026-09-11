# AI Features Implementation Plan (Review Before Execution)

**Status:** Draft for review — do not implement until approved  
**Date:** 2026-09-11  
**Constraints:** Open-source stack · Google ADK for agent orchestration · **₹0 / $0 budget** for demo  
**Git sync:** `main` pulled successfully (fast-forward `b40b790` → `3d2a0f8`). No merge conflicts.

---

## 1. Verdict: What Exists vs What We Still Build

The repo already has the **skeleton** described in `AI_Investment_Arena_Repository_Architecture.docx` / `docs/architecture_spec.md`:

| Area | Current state | Gap for demo |
|---|---|---|
| Multi-agent startup analysis | Sequential `AgentRunner` + provider fallback | Wire **real Google ADK** `SequentialAgent` graph |
| Providers | Gemini / Groq / Mock + cache + call budget | Prefer **Gemini free tier** via AI Studio; keep Mock as parachute |
| Deterministic simulation | Python Bull/Base/Bear in `app/simulation/` | Tighten schema; feed assumptions extracted by ADK agents |
| Startup / investor “verification” | Heuristic GST + CV presence checks | Reframe as **AI Background Assessment** (never legal KYC); add lightweight public-evidence heuristics |
| Thesis analysis | Rule-based scoring in `thesis_analyzer.py` | Hybrid: deterministic score + **1 ADK insight agent** for narrative |
| Async jobs | In-memory FastAPI `BackgroundTasks` | Keep for demo (no Redis/Celery) |
| Gateway AI routes | Partial in `docs/api.md` | Expose verify + thesis endpoints through gateway |

**Principle from the architecture doc (non-negotiable):**  
LLM/ADK = interpret, extract, challenge, explain.  
Python = calculate, simulate, match, score.

---

## 2. Zero-Budget Stack (Approved Free / Open-Source Only)

| Layer | Choice | Cost | Notes |
|---|---|---|---|
| Agent framework | **Google ADK** (`google-adk`, Apache 2.0) | Free | Framework is free; you only “pay” model tokens |
| Primary LLM | **Gemini 2.0/2.5 Flash** via Google AI Studio API key | Free tier | Set `GOOGLE_API_KEY` / `GEMINI_API_KEY` |
| Fallback LLM | **Groq** (optional) Llama/Mixtral free tier | Free tier | Secondary only |
| Emergency | **MockProvider** + `DEMO_MODE=true` | $0 | Guarantees live demo never dies |
| Auth / DB / storage | **Supabase free tier** | Free | Already in `.env.example` |
| Graph | **Neo4j Community** in Docker | Free | Local only |
| PDF / text extract | `pypdf` or `pdfminer.six` | Free | Summarize once, cache summary |
| Market research (demo) | Seeded JSON + `MOCK_RESEARCH=true` | $0 | Optional later: Wikipedia / SEC EDGAR public APIs |
| Matching | Deterministic weighted score (Python) | $0 | LLM only explains the score |

**Do not add for this demo:** paid search APIs, paid OCR, paid KYC, Redis, Kafka, Celery, Vertex billing, OpenAI paid keys.

---

## 3. Target ADK Architecture (Inside `backend/ai-service` Only)

```
Frontend → API Gateway → ai-service
                              │
                              ▼
                    ADK SequentialAgent (root)
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 DocumentIntel          MarketResearch         Competition
        │                     │                     │
        └──────────┬──────────┴──────────┬──────────┘
                   ▼                     ▼
            FinancialExtract      Python Simulator (no LLM)
                   │                     │
                   └──────────┬──────────┘
                              ▼
                         RedTeamAgent
                              ▼
                   InvestmentAnalystAgent (synthesizer)
```

### How ADK replaces today’s placeholder

Today `ADKIntegrationPoint` only detects `import google.adk`. Plan:

1. Add `google-adk` + `google-genai` to `ai-service` requirements (optional import still OK for Mock-only runs).
2. Define one ADK agent per role (`document`, `market`, `competition`, `financial_extract`, `red_team`, `investment_analyst`).
3. Compose them with ADK **`SequentialAgent`** (bounded — no LoopAgent recursion).
4. Register **tools** as Python callables:
   - `run_scenarios(...)` — financial simulation
   - `validate_gstin(...)` — format check
   - `hash_and_cache_lookup(...)` — cache
   - `deterministic_match_score(...)` — matching
5. Keep existing `AgentRunner` as **fallback executor** when ADK is missing or `DEMO_MODE=true`.

### Token / cost controls (must ship with ADK wiring)

- `MAX_AI_CALLS_PER_WORKFLOW=6` for startup analysis (doc + market + competition + financial extract + red team + synthesizer). Simulation does not count.
- SHA-256 input cache (already present).
- Agents receive **document summaries** (≤2–3k chars), never raw PDFs repeatedly.
- Structured JSON schemas via Pydantic; reject / repair once, then mock.
- Re-analysis sends **diff of changed assumptions** only when possible.

---

## 4. APIs You Need (Gateway-Facing Contract)

Base: `http://localhost:8000/api/...` (gateway proxies to services).

### 4.1 Already sketched / partially implemented

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/startup-analysis` | Full multi-agent analysis (sync) |
| `POST` | `/api/ai/jobs/startup-analysis` | Async job create |
| `GET` | `/api/ai/jobs/{job_id}` | Poll job |
| `POST` | `/api/ai/investor-analysis` | Investor background assessment |
| `POST` | `/api/ai/negotiation` | Offer explain + dilution math |
| `POST` | `/api/ai/simulate` | Pure Python Bull/Base/Bear |
| `GET` | `/api/ai/demo/sample` | Seeded demo payload |

### 4.2 Present on ai-service — **must be exposed via gateway**

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/verify/startup` | Startup AI Background Assessment |
| `POST` | `/api/ai/verify/investor` | Investor AI Background Assessment |
| `POST` | `/api/ai/analyze-thesis` | Thesis feasibility + insights |

### 4.3 Supporting CRUD APIs (already in architecture; wire UI → these)

**Startup service**

- `POST/GET /api/startups`, `PUT .../thesis`, `POST .../documents`
- `GET .../claims`, `GET .../analysis` (store frozen versions)
- `POST .../analysis` → create job → call ai-service → persist result

**Investor service**

- `POST/GET /api/investors`, `PUT .../preferences`
- `GET/PUT .../assessment` (persist AI assessment output)

**Deal service**

- Deals, interest, deal-rooms, messages, offers (negotiation copilot consumes offer payloads)

### 4.4 Suggested request/response shapes (demo)

**Verify startup**

```json
// POST /api/ai/verify/startup
{
  "name": "NovaGrid Energy",
  "gst_number": "27AABCU9603R1ZM",
  "incorporation_cert": "cin_certificate.pdf",
  "industry": "CleanTech",
  "stage": "Seed",
  "document_summaries": ["..."]
}
```

Response statuses: `verified` | `action_required` with `score`, `audit_checks[]`, `risk_level`.  
**UI label:** “AI Background Assessment” — never “Government Verified”.

**Verify investor**

```json
{
  "display_name": "Asha Rao",
  "firm": "Horizon Ventures",
  "bio": "...",
  "cv_filename": "asha_cv.pdf",
  "cv_text": "extracted summary...",
  "preferences": {"industries": ["CleanTech"], "check_size_max": 1500000}
}
```

**Thesis analysis**

```json
{
  "startup_id": "uuid",
  "thesis_text": "...",
  "industry": "SaaS",
  "stage": "Seed",
  "amount": 500000,
  "equity_pct": 10,
  "royalty_pct": 3,
  "metrics": {"cac": 420, "churn": 0.04, "growth_rate": 0.2}
}
```

Returns: `feasibility_score`, Bull/Base/Bear, `pain_points`, `strengths`, `recommendations`, `can_publish`, plus optional ADK narrative `insights`.

---

## 5. Startup Verification — How to Implement (0 Budget)

### Product language (architecture requirement)

This is **AI Background Assessment**, not legal identity / KYC / MCA authentication.

### Implementation layers

```
Uploaded docs + form fields
        ↓
1. Deterministic validators (Python)
   - GSTIN regex + state/PAN parse (already in verifier_agent.py)
   - Required fields present? (CIN/GST/incorporation filename)
   - File type / size sanitize on upload (startup-service)
        ↓
2. Document Intelligence (ADK agent, 1 call)
   - Compare founder claims vs extracted text snippets
   - Emit SUPPORTED | PARTIALLY_SUPPORTED | UNVERIFIED | CONTRADICTED | INSUFFICIENT_EVIDENCE
        ↓
3. Optional public-evidence heuristics (no paid APIs)
   - Seeded competitor/industry graph from Neo4j
   - MOCK_RESEARCH profiles for demo companies
        ↓
4. Score + badge
   - Weighted score → "AI Assessed" badge if score ≥ threshold
   - Persist to investor/startup tables + analysis_runs
```

### What we will NOT do (keeps us honest + free)

- Call paid GST/MCA/KYC APIs
- Claim “authenticated against ROC/MCA”
- Store or display fake “legal verified” seals

### Demo UX

1. Founder uploads GST + incorporation PDF → extract text once → cache summary.  
2. Click **Run AI Assessment** → `POST /api/ai/verify/startup`.  
3. Show audit checklist + confidence score + missing evidence list.  
4. Gate marketplace listing on `score ≥ 60` **or** allow listing with “Unassessed” badge (product choice — recommend soft gate for demo).

---

## 6. Investor Verification — How to Implement (0 Budget)

### Flow

```
Register → Profile → Upload CV → Extract text → AI assessment → Preferences → Marketplace access
```

### Layers

1. **CV text extraction** (open-source PDF parser) → store summary only.  
2. **ADK Investor Agent (max 1–2 calls):** extract industries, roles, ticket size hints, thesis themes.  
3. **Deterministic checks:** CV present? preferences complete? bio length?  
4. **Persist** as `verification_status`: `ai_assessed` | `incomplete` | `unassessed`.  
5. **Badge:** “AI Background Assessment Complete” (architecture wording).

### Optional gating for deal rooms

- Require `ai_assessed` before submitting offers (demo-friendly).  
- Do **not** claim accredited-investor legal status unless you add a self-attestation checkbox (recommended for demo honesty).

---

## 7. Thesis Analysis & AI Insights — How to Implement

### Hybrid design (best fit for 0 budget + architecture)

| Step | Owner | Tokens? |
|---|---|---|
| Parse thesis + raise terms | Python / Pydantic | No |
| Feasibility heuristic score | Python (extend `thesis_analyzer.py`) | No |
| Extract numeric assumptions (CAC, churn, growth) | ADK Financial Extract agent | Yes (1) |
| Bull/Base/Bear | `app/simulation/` | No |
| Pain points / red flags from assumptions | ADK Red Team (shared) **or** template + 1 insight call | Yes (0–1) |
| Investor-facing insight blurb | ADK Investment Analyst | Yes (1) |
| Persist version | startup-service `analysis_runs` | No |

### Founder iteration loop (architecture §14)

```
Create thesis → Analyze → View insights → Edit assumptions → Re-analyze → Compare versions → Confirm listing (freeze)
```

Implementation notes:

- Each run gets `analysis_version_n` + `input_hash`.  
- Identical payload → cache hit (`from_cache: true`).  
- On Confirm: `listing_status=CONFIRMED`, freeze snapshot used by marketplace.  
- UI shows: score grade, simulation chart, claim evidence table, red-team questions, “Founder vs AI projection” deltas.

### AI Insights package (what investors see)

Structured first (cheap), prose last (one short summary):

1. Company overview (from profile)  
2. Claim verification table  
3. Market / competition bullets  
4. Simulation cards (Bull/Base/Bear)  
5. Key risks (Red Team)  
6. Investment readiness score  
7. Matching score vs logged-in investor (deterministic)

---

## 8. Phased Execution Plan (After You Approve)

### Phase A — Reliability baseline (0.5–1 day)

- [ ] Confirm gateway proxies for `/ai/verify/*` and `/ai/analyze-thesis`
- [ ] Fix misleading “ROC/MCA authenticated” copy in verifier responses → assessment language
- [ ] Ensure `DEMO_MODE=true` path works end-to-end without any API keys
- [ ] Seed 3 startups + 5 investors with precomputed analysis JSON

### Phase B — Google ADK wiring (1–2 days)

- [ ] Install `google-adk`, wire `SequentialAgent` for startup analysis
- [ ] Keep Mock/`AgentRunner` fallback if ADK import or Gemini fails
- [ ] Attach simulation + GST validators as ADK tools
- [ ] Enforce `MAX_AI_CALLS_PER_WORKFLOW` and structured JSON schemas

### Phase C — Verification + thesis productization (1–2 days)

- [ ] PDF text extract → summary cache on document upload
- [ ] Startup verify UI + investor CV verify UI
- [ ] Thesis analyze UI with version history + confirm listing
- [ ] Persist assessments / analysis runs in Supabase

### Phase D — Insights & matching polish (1 day)

- [ ] Deterministic investor–startup match score + optional 1-call explanation
- [ ] Negotiation copilot: Python math + short ADK explanation
- [ ] Demo script: Mock mode rehearsal, then Gemini free-key rehearsal

**Out of scope for this demo phase:** real MCA/GST APIs, paid search, Monte-Carlo, Kafka, production RBAC, Kubernetes.

---

## 9. Environment for Demo Modes

```bash
# Safe default — always works offline
DEMO_MODE=true
AI_PROVIDER=mock
MOCK_RESEARCH=true

# Live AI demo (still $0 on free tier; watch quotas)
DEMO_MODE=false
AI_PROVIDER=gemini
GEMINI_API_KEY=...          # Google AI Studio
MAX_AI_CALLS_PER_WORKFLOW=6
MAX_AI_RETRIES=2
```

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gemini free-tier rate limit mid-demo | `DEMO_MODE` toggle + cache + Mock fallback |
| ADK API churn (1.x → 2.x) | Isolate behind `ADKIntegrationPoint`; keep AgentRunner |
| Over-claiming “verified” | UI + API copy review in Phase A |
| Token blow-up from multi-agent chat | Sequential only; no LoopAgent; hard call budget |
| Long analysis blocking UI | Use existing async job endpoints + poll |

---

## 11. Success Criteria for Hackathon Demo

1. With **no API keys**, full flow works in Mock mode.  
2. With **Gemini free key**, same flow returns real ADK agent steps and cached re-runs.  
3. Startup & investor assessment badges appear without implying legal KYC.  
4. Thesis analysis shows score + Bull/Base/Bear + red-team insights.  
5. Simulation numbers never come from the LLM.  
6. Marketplace listing can freeze an analysis version.

---

## 12. Decision Checklist (Please Review)

Please confirm or adjust before execution:

1. **LLM primary:** Gemini Flash free tier (ADK) — OK?  
2. **Verification:** Soft AI assessment (no paid registries) — OK?  
3. **Thesis insights:** Hybrid (Python score + ≤2 ADK narrative calls) — OK?  
4. **Listing gate:** Soft (allow Unassessed) vs Hard (require score ≥ 60)?  
5. **Investor offers:** Require CV assessment before deal-room offers?  
6. **Scope cut:** Negotiation copilot in this sprint, or after thesis+verify?

---

*Source inputs: `AI_Investment_Arena_Repository_Architecture.docx`, `docs/architecture.md`, `docs/ai-workflows.md`, `docs/api.md`, current `backend/ai-service` code.*

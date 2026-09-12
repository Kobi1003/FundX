# AI Workflows & Multi-Agent Architecture

This document describes how the AI service (`backend/ai-service`) executes multi-agent workflows while safeguarding against token exhaustion and API downtime.

---

## 0. Thesis Future Analysis → Financial Simulator

**Principle:** ADK/Gemini interprets & extracts; Python simulates; UI stays deterministic.

```
Thesis text
    → run_adk_or_fallback (ADK SequentialAgent if live, else AgentRunner)
    → ThesisAssumptions + FutureAnalysis (Pydantic)
    → SimulationRequest → run_scenarios / run_sensitivity
    → SimulationPage (drivers + Bull/Base/Bear + Future Analysis panels)
```

| Endpoint | Role |
|---|---|
| `POST /api/ai/analyze-thesis` | Full pack: assumptions, future_analysis, scenarios, sensitivity |
| `POST /api/ai/thesis-simulate` | Alias with `run_full_simulation=true` |

Code: `app/schemas/thesis_extract.py`, `app/agents/orchestrator.py` (`run_adk_or_fallback`), `app/workflows/thesis_analyzer.py`.

UI: paste thesis on `/simulation` (**Analyze & Simulate**), or Create Deal → **Open in Financial Simulator**.

---

## 1. Startup Analysis Workflow

The primary workflow processes founder thesis and pitch materials through a bounded sequential pipeline:

```
[ Input Payload: Startup thesis, metrics, document summaries ]
                               │
                               ▼
 1. Document Intelligence Agent
    • Compares claims against provided document excerpts.
    • Categorizes evidence: SUPPORTED, PARTIALLY_SUPPORTED, UNVERIFIED, CONTRADICTED.
                               │
                               ▼
 2. Market Research Agent
    • Analyzes TAM/SAM/SOM claims against industry benchmarks.
    • Evaluates market growth rate and customer pain points.
                               │
                               ▼
 3. Competition Agent
    • Maps primary competitors and competitive moat / defensibility.
                               │
                               ▼
 4. Financial Analysis Agent
    • Cross-examines CAC, churn, burn rate, and gross margin assumptions.
    • Ingests output from the deterministic Python simulation engine.
                               │
                               ▼
 5. Red Team Agent
    • Actively challenges high-risk assumptions ("Stress-testing the thesis").
    • Formulates critical questions for investor diligence.
                               │
                               ▼
 6. Investment Analyst Agent (Synthesizer)
    • Aggregates all upstream steps into a unified Investment Readiness score.
```

---

## 2. Deterministic Financial Simulation

Financial projections are executed strictly in Python (`app/simulation/`):
- `simulator.py`: Monthly cohort loop for Bull/Base/Bear (`MRR = Customers × ARPU`).
- `scenarios.py` / `assumptions.py`: Scenario multipliers and historical mean±σ.
- `sensitivity.py`: One-way sensitivity ranking on ending cash / ARR.
- `valuation_model.py`: ARR multiple valuation + funding pre/post-money.

Full formula reference: [`docs/FINANCE_SIMULATOR.md`](./FINANCE_SIMULATOR.md).

Outputs are scenario-based projections from supplied assumptions, not financial
advice or a prediction of actual performance. The request supports `claimed`
and `verified` simulation cases. Verified mode only replaces metrics with an
explicit `verified_value` and returns both the original and effective inputs.

---

## 3. Investor Background Assessment Workflow

- Extracts investment thesis, preferred ticket sizes, and focus sectors from CVs or profile summaries.
- Validates public evidence and tags verification status (`AI Background Assessment` — never claiming legal verification).

---

## 4. Negotiation Copilot Workflow

- Assesses investment offers in real time.
- Deterministically calculates:
  - Implied post-money valuation = $\frac{\text{Investment Amount}}{\text{Equity Percentage}}$
  - Implied pre-money valuation = $\text{Post-Money} - \text{Investment Amount}$
  - Founder dilution percentage
  - Runway extension in months
- The LLM generates balanced qualitative talking points for both founders and investors.

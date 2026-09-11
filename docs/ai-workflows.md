# AI Workflows & Multi-Agent Architecture

This document describes how the AI service (`backend/ai-service`) executes multi-agent workflows while safeguarding against token exhaustion and API downtime.

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

Financial projections are executed strictly in Python code (`app/simulation/`):
- `revenue_model.py`: Calculates compound monthly growth and ARR.
- `customer_model.py`: Computes customer acquisition, net churn, and cohorts.
- `cost_model.py`: Models fixed and variable operating costs.
- `runway_model.py`: Simulates monthly net burn and runway survival in months.
- `valuation_model.py`: Calculates post-money valuation, pre-money valuation, and dilution.
- `scenarios.py`: Runs **Bull**, **Base**, and **Bear** cases simultaneously.
- `simulator.py`: Produces a complete monthly forecast of cohort customers,
  revenue, CAC/LTV, costs, cash, funding, break-even and machine-readable risks.
  Monthly growth decays as `g_m = g_0 × (1 - growth_decay_rate)^(m-1)`.
- `sensitivity.py`: Performs deterministic one-way ±10% sensitivity tests for
  growth, CAC, churn, gross margin and operating costs.

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

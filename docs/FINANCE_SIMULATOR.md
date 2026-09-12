# FundX Financial Simulator

How the deterministic finance engine works, what it calculates, and how the UI maps to those formulas.

## Thesis → Future Analysis (ADK)

After a thesis is pasted (Simulator) or uploaded (Create Deal → **Open in Financial Simulator**):

1. `POST /api/ai/analyze-thesis` (or `/api/ai/thesis-simulate`) runs `run_adk_or_fallback`.
2. ADK SequentialAgent is built when `google-adk` is installed, `DEMO_MODE=false`, and `GEMINI_API_KEY` is set; otherwise `AgentRunner` + Mock/Gemini provider extracts JSON.
3. Validated `ThesisAssumptions` map into `SimulationRequest`; Python `run_scenarios` + `run_sensitivity` produce Bull/Base/Bear.
4. `future_analysis` (competition, feasibility, market trend, revenue/valuation) is shown on `SimulationPage` — ARR/valuation numbers always come from the engine.

Env for live Gemini extract (AgentRunner JSON; ADK SequentialAgent if `google-adk` installed):

```env
DEMO_MODE=false
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
MOCK_RESEARCH=true
MAX_AI_CALLS_PER_WORKFLOW=8
```

Optional: `pip install google-adk` inside ai-service for `ADKIntegrationPoint.build_startup_sequential_agent()`.

## Demo defaults (India SaaS seed)

UI defaults are calibrated to published India-market B2B SaaS bands (≈₹10L–₹1Cr ARR stage):

| Input | Default | Why |
|-------|---------|-----|
| Starting MRR | ₹4L (₹48L ARR) | Strong seed / pre-Series A band |
| Customers × ARPU | 80 × ₹5,000 | Typical India ACV ≈ ₹60k/year |
| CAC | ₹18,000 | Mid of ₹10–25k blended benchmark |
| Marketing | ₹1.8L/mo | ≈10 paid customers / month |
| Churn | 3.5%/mo | India SMB SaaS 3–5% |
| Gross margin | 68% | Benchmark 60–70% |
| Fixed opex | ₹6L/mo | Early ~8-person team |
| Cash | ₹2.5Cr | Typical seed raise ₹1.5–4Cr |
| YoY growth | 100% | Series A trajectory (~2×) |
| Round | ₹5Cr for 18% at M6 | Pre-Series A narrative |
| ARR multiple | 10× | India seed/A multiples ~6–18× |

Sources: Indian SaaS stage benchmarks (First Unicorn / SaaSBoomi-style public ranges), CFOmatrix India unit-economics guides.


- Frontend: `frontend/src/pages/SimulationPage.jsx`
- API: `POST /api/ai/simulation/scenarios` and `POST /api/ai/simulation/sensitivity`
- Engine: `backend/ai-service/app/simulation/simulator.py`
- Scenario wrappers: `scenarios.py` + `assumptions.py`
- Sensitivity: `sensitivity.py`

All money is **raw INR**. Rates are **decimals** (`0.40` = 40%, `0.03` = 3%).

---

## Month 0 baseline (invariant)

Before any forecast month runs, the engine locks a shared starting reality used by Bull, Base, and Bear:

| Symbol | Meaning | Source |
|--------|---------|--------|
| \(N_0\) | Starting customers | `current_customers` |
| \(A_0\) | Starting ARPU / month | `pricing` |
| \(M_0\) | Starting MRR | Prefer \(N_0 \times A_0\) (authoritative) |
| \(C_0\) | Starting cash | `funding` / `starting_cash` |
| \(G\) | Gross margin | `starting_gross_margin` |
| \(F\) | Fixed opex | `operating_expenses` / `fixed_monthly_costs` |
| \(P\) | Marketing spend / month | `marketing_spend` |
| \(K\) | CAC | `cac` |
| \(c\) | Monthly churn | `churn` |
| \(g_a\) | Claimed annual growth | `growth_rate` |

**Consistency check**

\[
\text{implied MRR} = N_0 \times A_0
\]

If reported Starting MRR differs from implied MRR by more than **5%**, the UI shows a critical banner. The engine still reconciles to Customers × ARPU when `authoritative_mrr_basis = customers_arpu`.

Month 0 operating profit (for charts / break-even):

\[
OP_0 = M_0 \times G - (F + P + \text{other opex buckets})
\]

If \(OP_0 \ge 0\), break-even is recorded as **Month 0**.

---

## Monthly loop (months \(t = 1 \ldots T\))

### 1. Growth decay

\[
d_t = (1 - \text{growth\_decay\_rate})^{t-1}
\]

(`0` decay ⇒ \(d_t = 1\))

### 2. Customer acquisition

**Paid**

\[
\text{Paid}_t = \frac{P}{K_t} \times d_t
\quad\text{where}\quad
K_t = K \times (1 + \text{cac\_change\_rate})^{t-1}
\]

(or a fixed `new_customers_per_month` if provided)

**Organic** (from claimed annual growth)

\[
g_m = (1 + g_a)^{1/12} - 1
\]

\[
\text{Organic}_t = N_{t-1} \times g_m \times d_t
\]

(If `monthly_customer_growth` is set explicitly, that rate replaces \(g_m\).)

**Total new**

\[
\text{New}_t = \text{Paid}_t + \text{Organic}_t
\]

### 3. Churn and ending customers

\[
\text{Churned}_t = N_{t-1} \times c
\]

\[
N_t = \max(0,\ N_{t-1} + \text{New}_t - \text{Churned}_t)
\]

### 4. ARPU and revenue

\[
A_t = A_{t-1} \times (1 + \text{arpu\_growth\_rate}) \times (1 + \text{monthly\_revenue\_growth})
\]

(only the rates that are non-zero are applied)

\[
MRR_t = N_t \times A_t
\]

\[
ARR_t = MRR_t \times 12
\]

### 5. P&L

\[
\text{Gross Profit}_t = MRR_t \times G
\]

\[
OPEX_t = F + P + \text{payroll}_t + \text{tech} + \text{admin} + \text{other} + \text{variable}\times N_t + \text{sales\_budget}
\]

Hiring plan salaries are included in payroll once `hiring_month ≤ t`.

\[
OP_t = \text{Gross Profit}_t - OPEX_t
\]

\[
\text{Burn}_t = \max(0,\ -OP_t)
\]

### 6. Cash and financing

If a funding round is configured and `investment_month = t`:

\[
\text{Financing}_t = \text{investment\_amount}
\]

otherwise \(0\).

\[
C_t = C_{t-1} + OP_t + \text{Financing}_t
\]

**Cash-out month** = first \(t\) with \(C_t \le 0\).  
**Break-even month** = first \(t\) with \(OP_t \ge 0\) (or 0 if already profitable at Month 0).

**Additional capital required** = \(\max(0,\ -\min(C_0, C_1, \ldots, C_T))\).

### 7. Simulated annual growth (realized)

\[
g_{\text{sim}} = \left(\frac{MRR_T}{M_0}\right)^{12/T} - 1
\]

Compared against claimed \(g_a\). If realized growth is far below claimed, a risk flag is raised.

### 8. Valuation and dilution

\[
\text{Implied valuation} = ARR_T \times \text{valuation\_multiple}
\]

If a round is set:

\[
\text{Post-money} = \frac{\text{investment}}{\text{equity\_percentage}}
\quad,\quad
\text{Pre-money} = \text{Post-money} - \text{investment}
\]

Equity is a decimal (`0.10` = 10%).

---

## Bull / Base / Bear

All three scenarios start from the **same Month 0**. Divergence begins at Month 1 via multipliers in `assumptions.py`:

| Driver | Bull | Base | Bear |
|--------|------|------|------|
| Growth \(g_a\) | ×1.25 | ×1.00 | ×0.75 |
| CAC | ×0.85 | ×1.00 | ×1.20 |
| Churn | ×0.80 | ×1.00 | ×1.30 |
| ARPU | ×1.10 | ×1.00 | ×0.90 |
| Gross margin | +5 pp | 0 | −5 pp |
| Fixed costs | ×1.05 | ×1.00 | ×1.10 |

If ≥3 historical points are supplied for a series, Bull/Base/Bear use **mean ± sample σ** instead of the benchmark multipliers for that series.

---

## Sensitivity

`POST /ai/simulation/sensitivity` re-runs the base path with one-at-a-time shocks (e.g. CAC up, churn up, margin down) and ranks impact on ending cash / ARR.

---

## UI ↔ API mapping

| UI field | Request field |
|----------|---------------|
| Starting MRR | `current_mrr` |
| Starting Cash | `funding` |
| Customers | `current_customers` |
| ARPU / month | `pricing` |
| CAC | `cac` |
| Marketing / mo | `marketing_spend` |
| Claimed Annual Growth | `growth_rate` |
| Monthly Churn | `churn` |
| Gross Margin | `starting_gross_margin` |
| Fixed Costs | `operating_expenses` |
| Growth Decay | `growth_decay_rate` |
| Forecast Horizon | `months` |
| Round Investment / Equity / Month | `funding_round.*` |
| Valuation Multiple | `valuation_multiple` |

Charts plot Month 0 baseline plus each forecast month for ARR, MRR, cash, customers, and operating profit across Bull/Base/Bear.

---

## What this is / is not

**Is:** an auditable operating model for scenario planning and red-team stress.  
**Is not:** accounting software, tax modeling, or a guarantee of future performance.

Engine version string: `SIMULATION_ENGINE_VERSION` in `simulator.py` (currently `2.0.0`).

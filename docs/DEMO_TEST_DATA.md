# Demo Registration & Local Testing Guide

## Where uploaded CVs / docs are stored

**Before:** Only filenames / pasted text in Postgres — no real files.

**Now (local testing):** files are written under the repo:

```
uploads/
  demo_cvs/          ← committed sample CVs (use these)
  demo_docs/         ← sample incorporation text
  investors/<id>/    ← runtime investor CV uploads (gitignored)
  startups/<id>/     ← runtime startup doc uploads (gitignored)
```

Docker bind-mounts `./uploads` → `/app/uploads` on `investor-service`, `startup-service`, and `ai-service`.

---

## Demo CV files (2)

| File | Use for |
|---|---|
| [`uploads/demo_cvs/ELENA_ROSTOVA_CV.txt`](../uploads/demo_cvs/ELENA_ROSTOVA_CV.txt) | Investor profile upload / assessment |
| [`uploads/demo_cvs/VIKRAM_MEHTA_CV.txt`](../uploads/demo_cvs/VIKRAM_MEHTA_CV.txt) | Second investor CV |

Also: [`uploads/demo_docs/AEROGRID_INCORPORATION_DEMO.txt`](../uploads/demo_docs/AEROGRID_INCORPORATION_DEMO.txt) for startup registration.

---

## Registration test accounts (create via `/register`)

Use unique emails each run (or delete prior users). Suggested:

### Startup A — CleanTech
| Field | Value |
|---|---|
| Role | Startup |
| Name | NovaGrid Energy Demo |
| Email | `founder.novagrid@demo.fundx` |
| Password | `DemoPass123!` |
| Industry | CleanTech |
| GST | `29AABCU9603R1ZM` |
| Incorporation file | `uploads/demo_docs/AEROGRID_INCORPORATION_DEMO.txt` |

### Startup B — FinTech
| Field | Value |
|---|---|
| Role | Startup |
| Name | FinPulse Ledger Demo |
| Email | `founder.finpulse@demo.fundx` |
| Password | `DemoPass123!` |
| Industry | FinTech |
| GST | `27AABCT1332L1ZV` |
| Incorporation | any `.txt` / `.pdf` (or auto-generated name) |

### Investor A — Elena style
| Field | Value |
|---|---|
| Role | Investor |
| Name | Elena Rostova Demo |
| Email | `elena.demo@demo.fundx` |
| Password | `DemoPass123!` |
| After login | Profile → upload `ELENA_ROSTOVA_CV.txt` → Run AI Background Assessment |

### Investor B — Vikram style
| Field | Value |
|---|---|
| Role | Investor |
| Name | Vikram Mehta Demo |
| Email | `vikram.demo@demo.fundx` |
| Password | `DemoPass123!` |
| After login | Profile → upload `VIKRAM_MEHTA_CV.txt` → Run AI Background Assessment |

### Seeded logins (if `database/init.sql` / in-memory profiles exist)
Check Login page / `user-service` seed profiles — common demos:
- Elena / Apex Horizon (`investor-elena`)
- David (unverified investor)

---

## Env vars for AI workflows

Copy `.env.example` → `.env`.

### Offline demo (recommended default — $0, no keys)
```env
DEMO_MODE=true
AI_PROVIDER=mock
MOCK_RESEARCH=true
MAX_AI_CALLS_PER_WORKFLOW=8
MAX_AI_RETRIES=2
UPLOAD_ROOT=/app/uploads
```

### Live Gemini free tier (still $0; watch quotas)
```env
DEMO_MODE=false
AI_PROVIDER=gemini
GEMINI_API_KEY=your_aistudio_key
GOOGLE_API_KEY=your_aistudio_key
MOCK_RESEARCH=true
MAX_AI_CALLS_PER_WORKFLOW=6
```

Optional:
```env
GROQ_API_KEY=...          # only if AI_PROVIDER=groq
MAX_UPLOAD_BYTES=5242880
```

Supabase / Neo4j vars are for platform data — not required to exercise Mock AI workflows if Compose is up.

---

## Smoke-test AI workflows

With stack running (`docker compose up --build`):

```bash
python scripts/smoke_ai_workflows.py
```

Exercises: health, simulate, verify startup, verify investor, analyze-thesis, startup-analysis, investor-analysis, negotiation, demo sample.

---

## Manual UI path

1. Register investor → open **Profile** → upload demo CV → **Run AI Background Assessment**
2. Register startup → upload incorporation → run startup verify from verifier page
3. Thesis analyze / startup analysis via AI endpoints or product pages that call them

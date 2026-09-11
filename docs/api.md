# AI Investment Arena — API Specification

All external communication routes through the **API Gateway** on port `8000`:
Base URL: `http://localhost:8000`

---

## 1. Gateway Health & System Status

### `GET /health`
Returns gateway health and aggregated downstream microservice probe statuses.

```json
{
  "status": "ok",
  "service": "api-gateway",
  "downstream": {
    "user-service": { "status": "ok", "code": 200 },
    "startup-service": { "status": "ok", "code": 200 },
    "investor-service": { "status": "ok", "code": 200 },
    "deal-service": { "status": "ok", "code": 200 },
    "ai-service": { "status": "ok", "code": 200 }
  }
}
```

---

## 2. User Service (`/api/users/*`)

- `GET /api/users/profile`: Fetch the current user's profile (header: `Authorization: Bearer <jwt>`).
- `POST /api/users/profile`: Upsert user profile (`full_name`, `role: "startup" | "investor"`).

---

## 3. Startup Service (`/api/startups/*`)

- `GET /api/startups`: List all registered startups.
- `POST /api/startups`: Create a new startup profile.
  ```json
  {
    "name": "NovaGrid Energy",
    "tagline": "Intelligent B2B Microgrid & Energy Arbitrage",
    "description": "...",
    "industry": "CleanTech",
    "stage": "Seed",
    "thesis": "..."
  }
  ```
- `GET /api/startups/{id}`: Get startup details.
- `GET /api/startups/{id}/documents`: List uploaded document metadata.
- `POST /api/startups/{id}/documents`: Register uploaded document metadata.
- `GET /api/startups/{id}/thesis`: Fetch founder investment thesis.
- `PUT /api/startups/{id}/thesis`: Update investment thesis.
- `GET /api/startups/{id}/claims`: List registered claims.
- `GET /api/startups/{id}/analysis`: List historical analysis runs.

---

## 4. Investor Service (`/api/investors/*`)

- `GET /api/investors`: List registered investor profiles.
- `POST /api/investors`: Create investor profile.
- `GET /api/investors/{id}`: Get investor profile details.
- `GET /api/investors/{id}/preferences`: Get investment thesis and preferences.
- `PUT /api/investors/{id}/preferences`: Update criteria (industries, stages, check sizes).
- `GET /api/investors/{id}/assessment`: Fetch AI background assessment.

---

## 5. Deal Service (`/api/deals/*` & `/api/deal-rooms/*`)

- `GET /api/deals`: List active marketplace deals.
- `POST /api/deals`: Create a deal listing for a startup.
- `GET /api/deals/{id}`: Get deal details with interests and metrics.
- `POST /api/deals/{id}/interest`: Express investor interest in a deal.
- `GET /api/deal-rooms`: List accessible deal rooms.
- `POST /api/deal-rooms`: Create a new multi-party deal room.
- `GET /api/deal-rooms/{id}`: Get deal room info.
- `GET /api/deal-rooms/{id}/messages`: List room discussion messages.
- `POST /api/deal-rooms/{id}/messages`: Post a chat message.
- `GET /api/deal-rooms/{id}/offers`: List term sheet offers.
- `POST /api/deal-rooms/{id}/offers`: Submit an investment offer (amount, equity %, terms).

---

## 6. AI Service (`/api/ai/*`)

- `POST /api/ai/startup-analysis`: Run complete multi-agent analysis workflow.
- `POST /api/ai/jobs/startup-analysis`: Create async analysis job.
- `GET /api/ai/jobs/{job_id}`: Poll analysis job status.
- `POST /api/ai/investor-analysis`: Run investor profile extraction and background research.
- `POST /api/ai/negotiation`: Evaluate offer terms and calculate dilution/runway impact.
- `POST /api/ai/simulate`: Run deterministic financial simulation (Bull / Base / Bear cases).
- `POST /api/ai/verify/startup`: Startup **AI Background Assessment** (not legal KYC).
- `POST /api/ai/verify/investor`: Investor **AI Background Assessment** from CV text.
- `POST /api/ai/analyze-thesis`: Thesis feasibility + deterministic simulation + insights.
- `GET /api/ai/demo/sample`: Fetch seeded sample startup & investor payload for testing.

### Local document uploads (repo `uploads/`)

- `POST /api/investors/{id}/upload-cv` — multipart file → `uploads/investors/<id>/`
- `POST /api/investors/{id}/upload-cv-json` — JSON filename + text saved as `.txt`
- `POST /api/startups/{id}/upload-document` — multipart file → `uploads/startups/<id>/`

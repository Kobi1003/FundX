# AI Investment Arena

Hackathon skeleton: React → API Gateway → microservices → Supabase (hosted) + Neo4j → AI service.

Supabase is managed Auth/Postgres/Storage — not the application backend.

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API Gateway: http://localhost:8000
- Gateway health: http://localhost:8000/health
- Neo4j Browser: http://localhost:7474

Stop:

```bash
docker compose down
```

## Services

| Service | Port | Role |
|---------|------|------|
| frontend | 5173→80 | React + Vite shell |
| api-gateway | 8000 | Frontend entry; proxies `/api/*` |
| user-service | 8001 | Profiles (Supabase Auth owns passwords) |
| startup-service | 8002 | Startups, docs, thesis, analysis stubs |
| investor-service | 8003 | Investors, prefs, docs |
| deal-service | 8004 | Deals, multi-party rooms, offers |
| ai-service | 8005 | Agents, cache, simulation, providers |
| neo4j | 7474/7687 | Relationship graph only |

## Token / demo safeguards

- `DEMO_MODE=true` — mock AI path (emergency parachute)
- `AI_PROVIDER=mock|gemini|groq`
- Input hashing + in-memory cache before LLM calls
- Deterministic simulation (bull/base/bear) in Python
- Hard `MAX_AI_CALLS_PER_WORKFLOW` budget; no recursive agent fan-out

## Data ownership

See `docs/DATA_OWNERSHIP.md` and `supabase/migrations/001_initial_schema.sql`.

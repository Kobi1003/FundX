# Data ownership: Supabase vs Neo4j

## Supabase (Auth + PostgreSQL + Storage)

Store transactional / document / structured business data:

- `profiles`, `startups`, `investors`
- `startup_documents` (metadata; files in Storage)
- `startup_claims`, `startup_analysis_runs`, `startup_metrics`
- `investment_preferences`
- `deals`, `deal_interests`, `deal_rooms`, `deal_room_participants`
- `deal_messages`, `offers`, `negotiations`

Auth: Supabase Auth only. Backend verifies JWTs. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

## Neo4j (relationships only)

Do **not** duplicate every Postgres table. Persist graph edges such as:

```text
(:User)-[:OWNS]->(:Startup|:Investor)
(:Startup)-[:OPERATES_IN]->(:Industry)
(:Startup)-[:COMPETES_WITH]->(:Startup)
(:Startup)-[:TARGETS]->(:Market)
(:Startup)-[:LISTED]->(:Deal)
(:Startup)-[:MAKES_CLAIM]->(:Claim)
(:Claim)-[:SUPPORTED_BY]->(:Evidence)
(:Investor)-[:INTERESTED_IN]->(:Industry)
(:Investor)-[:INTERESTED_IN]->(:Startup)
(:Investor)-[:INTERESTED_IN]->(:Deal)
(:Investor)-[:MADE_OFFER]->(:Offer)-[:ON_DEAL]->(:Deal)
(:Investor)-[:NEGOTIATED]->(:Deal)
```

Node IDs should match Postgres/Supabase IDs for join-by-id across stores.

### Live sync
Runtime writes go through `backend/shared/neo4j/graph_sync.py` from user/startup/investor/deal services.
Backfill demo data with:

```bash
python scripts/sync_neo4j_from_postgres.py --cypher-seed
```

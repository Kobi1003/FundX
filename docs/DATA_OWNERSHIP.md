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
(:Startup)-[:OPERATES_IN]->(:Industry)
(:Startup)-[:COMPETES_WITH]->(:Startup)
(:Startup)-[:TARGETS]->(:Market)
(:Startup)-[:MAKES_CLAIM]->(:Claim)
(:Claim)-[:SUPPORTED_BY]->(:Evidence)
(:Investor)-[:INTERESTED_IN]->(:Industry)
(:Investor)-[:INTERESTED_IN]->(:Startup)
```

Node IDs should match Supabase UUIDs for join-by-id across stores.

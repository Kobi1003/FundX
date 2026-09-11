-- Database ownership: Supabase vs Neo4j
--
-- Supabase (Auth + PostgreSQL + Storage)
--   - profiles, startups, investors, documents metadata, claims text,
--     analysis runs/results, structured metrics, preferences,
--     deals, interests, deal rooms, messages, offers, negotiations
--
-- Neo4j (relationship graph only — do not mirror every table)
--   (:Startup)-[:OPERATES_IN]->(:Industry)
--   (:Startup)-[:COMPETES_WITH]->(:Startup)
--   (:Startup)-[:TARGETS]->(:Market)
--   (:Startup)-[:MAKES_CLAIM]->(:Claim)
--   (:Claim)-[:SUPPORTED_BY]->(:Evidence)
--   (:Investor)-[:INTERESTED_IN]->(:Industry)
--   (:Investor)-[:INTERESTED_IN]->(:Startup)
--
-- IDs in Neo4j nodes should match Supabase UUIDs for cross-store joins.

-- Enable UUID helper
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('startup', 'investor', 'admin')) default 'startup',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- startups
-- ---------------------------------------------------------------------------
create table if not exists public.startups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text unique,
  tagline text,
  description text,
  industry text,
  stage text,
  funding_requirement numeric,
  business_model text,
  website text,
  thesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.startup_documents (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  doc_type text,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_claims (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  claim_text text not null,
  category text,
  confidence numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  input_hash text not null,
  status text not null default 'pending',
  provider text,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists startup_analysis_runs_input_hash_idx
  on public.startup_analysis_runs (startup_id, input_hash);

create table if not exists public.startup_metrics (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  analysis_run_id uuid references public.startup_analysis_runs (id) on delete set null,
  market_size numeric,
  growth_rate numeric,
  cac numeric,
  churn numeric,
  customers integer,
  revenue numeric,
  marketing_budget numeric,
  operating_cost numeric,
  runway_months numeric,
  valuation numeric,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- investors
-- ---------------------------------------------------------------------------
create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  firm text,
  bio text,
  thesis text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_preferences (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null unique references public.investors (id) on delete cascade,
  industries text[] default '{}',
  stages text[] default '{}',
  check_size_min numeric,
  check_size_max numeric,
  risk_appetite text,
  geographies text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- deals (many investors can engage many startups)
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  title text not null,
  status text not null default 'open',
  target_raise numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_interests (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  investor_id uuid not null references public.investors (id) on delete cascade,
  status text not null default 'interested',
  created_at timestamptz not null default now(),
  unique (deal_id, investor_id)
);

-- Deal rooms are multi-party: one room per deal (or scoped subset), not 1:1
create table if not exists public.deal_rooms (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text,
  unique (room_id, profile_id)
);

create table if not exists public.deal_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.deal_rooms (id) on delete cascade,
  deal_id uuid not null references public.deals (id) on delete cascade,
  investor_id uuid not null references public.investors (id) on delete cascade,
  amount numeric not null,
  equity_pct numeric,
  status text not null default 'pending',
  terms jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.negotiations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  status text not null default 'open',
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS) & Ownership Policies
-- ---------------------------------------------------------------------------

-- 1. profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. startups
alter table public.startups enable row level security;

create policy "Startup owners can view own startup"
  on public.startups for select
  using (auth.uid() = owner_id);

create policy "Startup owners can create startup"
  on public.startups for insert
  with check (auth.uid() = owner_id);

create policy "Startup owners can update own startup"
  on public.startups for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 3. investors
alter table public.investors enable row level security;

create policy "Investor owners can view own investor profile"
  on public.investors for select
  using (auth.uid() = owner_id);

create policy "Investor owners can create investor profile"
  on public.investors for insert
  with check (auth.uid() = owner_id);

create policy "Investor owners can update own investor profile"
  on public.investors for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 4. investment_preferences
alter table public.investment_preferences enable row level security;

create policy "Investor owners can view own investment preferences"
  on public.investment_preferences for select
  using (
    exists (
      select 1 from public.investors
      where investors.id = investment_preferences.investor_id
      and investors.owner_id = auth.uid()
    )
  );

create policy "Investor owners can insert own investment preferences"
  on public.investment_preferences for insert
  with check (
    exists (
      select 1 from public.investors
      where investors.id = investment_preferences.investor_id
      and investors.owner_id = auth.uid()
    )
  );

create policy "Investor owners can update own investment preferences"
  on public.investment_preferences for update
  using (
    exists (
      select 1 from public.investors
      where investors.id = investment_preferences.investor_id
      and investors.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.investors
      where investors.id = investment_preferences.investor_id
      and investors.owner_id = auth.uid()
    )
  );


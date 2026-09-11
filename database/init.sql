-- =============================================================================
-- FUNDX PostgreSQL Database Initialization & Schema
-- Tables: profiles, startups, startup_documents, investors,
--         investment_preferences, deals, offers, deal_messages, deal_interests
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (All users: admin, startup founders, investors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('startup', 'investor', 'admin')) DEFAULT 'startup',
  startup_id TEXT,
  investor_id TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Startups Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.startups (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  tagline TEXT,
  description TEXT,
  industry TEXT DEFAULT 'Technology',
  stage TEXT DEFAULT 'Seed',
  website TEXT,
  email TEXT,
  thesis TEXT,
  gst_number TEXT,
  incorporation_cert TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending',
  verification_score INTEGER DEFAULT 50,
  verification_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Startup Documents Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.startup_documents (
  id TEXT PRIMARY KEY,
  startup_id TEXT NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  doc_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. Investors Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investors (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  firm TEXT,
  bio TEXT,
  thesis TEXT,
  cv_filename TEXT,
  cv_text TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'unverified',
  verification_score INTEGER DEFAULT 45,
  verification_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. Investment Preferences Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investment_preferences (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  industries TEXT[] DEFAULT '{}',
  stages TEXT[] DEFAULT '{}',
  check_size_min NUMERIC,
  check_size_max NUMERIC,
  geographies TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Deals Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deals (
  id TEXT PRIMARY KEY,
  startup_id TEXT NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  startup_name TEXT,
  startup_verified BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  pitch TEXT,
  industry TEXT DEFAULT 'Technology',
  funding_stage TEXT DEFAULT 'Seed',
  target_raise NUMERIC NOT NULL,
  equity_pct NUMERIC NOT NULL,
  royalty_pct NUMERIC DEFAULT 0.0,
  royalty_payout_terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  thesis TEXT,
  thesis_doc TEXT,
  ai_score INTEGER,
  ai_report JSONB,
  closed_terms JSONB,
  use_of_funds TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. Offers Table (Negotiation Tree)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id TEXT,
  investor_name TEXT,
  sender_type TEXT DEFAULT 'investor',
  amount NUMERIC NOT NULL,
  equity_pct NUMERIC NOT NULL,
  royalty_pct NUMERIC DEFAULT 0.0,
  royalty_payout_terms TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. Deal Messages (Dealroom Chat)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. Deal Interests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_interests (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL,
  investor_name TEXT,
  status TEXT DEFAULT 'interested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA: Demo Accounts, Startups, Investors, Deals, Offers
-- =============================================================================

-- Seed Demo Profiles
INSERT INTO public.profiles (id, email, password_hash, full_name, role, startup_id, investor_id, is_verified) VALUES
  ('admin-user', 'admin@fundx.ai', 'admin123', 'FundX Platform Super Admin', 'admin', NULL, NULL, TRUE),
  ('founder-aerogrid', 'founder@aerogrid.io', 'password123', 'Priya Sharma', 'startup', 'startup-aerogrid', NULL, TRUE),
  ('founder-finpulse', 'contact@finpulse.ai', 'password123', 'Arjun Nambiar', 'startup', 'startup-finpulse', NULL, TRUE),
  ('founder-biosynthetix', 'team@biosynthetix.io', 'password123', 'Dr. Sarah Chen', 'startup', 'startup-biosynthetix', NULL, FALSE),
  ('investor-elena', 'elena@apexhorizon.com', 'password123', 'Elena Rostova', 'investor', NULL, 'investor-elena', TRUE),
  ('investor-vikram', 'vikram@nexusangels.io', 'password123', 'Vikram Mehta', 'investor', NULL, 'investor-vikram', TRUE),
  ('investor-david', 'david.miller@angelinvest.org', 'password123', 'David Miller', 'investor', NULL, 'investor-david', FALSE)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;

-- Seed Demo Startups
INSERT INTO public.startups (id, owner_id, name, slug, tagline, description, industry, stage, website, email, thesis, gst_number, incorporation_cert, is_verified, verification_status, verification_score, verification_report) VALUES
  ('startup-aerogrid', 'founder-aerogrid',
   'AeroGrid Tech', 'aerogrid-tech',
   'AI-orchestrated autonomous renewable energy grids',
   'AeroGrid stabilizes municipal and commercial energy micro-grids using predictive edge AI telemetry.',
   'CleanTech', 'Seed', 'https://aerogrid.tech', 'founder@aerogrid.io',
   'Distributed renewable micro-grids will capture 32% of commercial power distribution by 2030. AeroGrid combines real-time frequency stabilization algorithms with IoT telemetry to deliver 40% lower curtailment loss.',
   '27AABCA1234F1Z8', 'AEROGRID_INCORPORATION_ROC_2024.pdf',
   TRUE, 'verified', 94,
   '{"status": "verified", "score": 94, "risk_level": "LOW", "verified_badge": "AI Verified", "summary": "AI Background check completed for AeroGrid Tech. Compliance confidence score: 94/100. Entity credentials approved for verified deal listing.", "audit_checks": [{"check": "GSTIN Structure & Registry Validation", "status": "PASS", "detail": "Valid GSTIN registered in state zone 27 (Maharashtra)"}, {"check": "Certificate of Incorporation (ROC/MCA)", "status": "PASS", "detail": "Authenticated against national corporate registry ROC/2024/7789"}, {"check": "Sector Regulatory Clearance", "status": "PASS", "detail": "No adverse regulatory flags in CleanTech sector."}, {"check": "Corporate Identity & Disclosures", "status": "PASS", "detail": "Founding entity verified in good standing at Seed stage."}]}'::jsonb),

  ('startup-finpulse', 'founder-finpulse',
   'FinPulse AI', 'finpulse-ai',
   'Sub-second B2B treasury and cross-border settlement API',
   'Unified liquidity routing and automated compliance for multinational enterprises.',
   'FinTech', 'Series A', 'https://finpulse.ai', 'contact@finpulse.ai',
   'Cross-border B2B payouts currently suffer 3-5 days latency and 2.4% FX friction. FinPulse provides direct routing over ISO20022 rail networks.',
   '07AAFCD5678K1Z2', 'FINPULSE_ROC_CERTIFICATE.pdf',
   TRUE, 'verified', 91,
   '{"status": "verified", "score": 91, "risk_level": "LOW", "verified_badge": "AI Verified", "summary": "AI Background check completed for FinPulse AI. Compliance confidence score: 91/100.", "audit_checks": [{"check": "GSTIN Structure & Registry Validation", "status": "PASS", "detail": "Valid GSTIN registered in Delhi NCT"}, {"check": "Certificate of Incorporation (ROC/MCA)", "status": "PASS", "detail": "Authenticated against national corporate registry ROC/2023/1102"}]}'::jsonb),

  ('startup-biosynthetix', 'founder-biosynthetix',
   'BioSynthetix Labs', 'biosynthetix-labs',
   'Generative protein design platform for oncology therapeutics',
   'Deep learning models predicting antibody-antigen binding affinities in weeks instead of years.',
   'HealthTech', 'Pre-Seed', 'https://biosynthetix.io', 'team@biosynthetix.io',
   'Targeted biologic therapies require massive trial-and-error in wet labs. BioSynthetix uses diffusion models trained on cryo-EM datasets to slash discovery timelines by 60%.',
   '33AAECB9988P1Z5', 'BIOSYNTHETIX_PROVISIONAL_INC.pdf',
   FALSE, 'pending', 62, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Startup Documents
INSERT INTO public.startup_documents (id, startup_id, filename, doc_type, storage_path) VALUES
  ('doc-1', 'startup-aerogrid', 'AEROGRID_INCORPORATION_ROC_2024.pdf', 'incorporation', 'docs/inc_aerogrid.pdf'),
  ('doc-2', 'startup-aerogrid', 'GST_REGISTRATION_CERT_2024.pdf', 'gst', 'docs/gst_aerogrid.pdf'),
  ('doc-3', 'startup-finpulse', 'FINPULSE_ROC_CERTIFICATE.pdf', 'incorporation', 'docs/inc_finpulse.pdf'),
  ('doc-4', 'startup-biosynthetix', 'BIOSYNTHETIX_PROVISIONAL_INC.pdf', 'incorporation', 'docs/inc_bio.pdf')
ON CONFLICT (id) DO NOTHING;

-- Seed Investors
INSERT INTO public.investors (id, owner_id, display_name, email, firm, bio, thesis, cv_filename, cv_text, is_verified, verification_status, verification_score, verification_report) VALUES
  ('investor-elena', 'investor-elena',
   'Elena Rostova', 'elena@apexhorizon.com', 'Apex Horizon Capital',
   'Managing Partner at Apex Horizon Capital focusing on early-stage CleanTech, Climate Robotics, and AI Infrastructure. Former tech founder with 2 exits.',
   'Backing visionary founders building deep-tech moats with resilient unit economics and sustainable recurring cash flows.',
   'ELENA_ROSTOVA_CV_2026.pdf',
   'Managing Partner at Apex Horizon Capital. 10+ years venture experience. Seed investor in 22 startups with 4 unicorns. FINRA series 7 & 63 equivalent certified.',
   TRUE, 'verified', 92,
   '{"status": "verified", "score": 92, "verified_badge": "AI Verified", "badges": ["AI Verified Investor", "Accredited Syndicate Member", "Dealroom Authorized"], "summary": "Investor credential verification for Elena Rostova (Apex Horizon Capital). Credibility rating: 92/100. Approved to submit offers and negotiate deals in Dealroom.", "checks": [{"check": "Curriculum Vitae & Track Record", "status": "PASS", "detail": "Document validated. 10+ years venture experience confirmed."}, {"check": "Accredited Investor Status", "status": "PASS", "detail": "Meets accredited investor net-worth standards."}, {"check": "Dealroom Authorization", "status": "PASS", "detail": "Full authorization to submit term sheets."}]}'::jsonb),

  ('investor-vikram', 'investor-vikram',
   'Vikram Mehta', 'vikram@nexusangels.io', 'Nexus Angel Syndicate',
   'Angel investor and syndicate lead with 35+ investments across B2B FinTech, SaaS, and Developer Tooling.',
   'Writing $100k-$500k checks in capital-efficient software businesses with >75% gross margins and organic net revenue retention.',
   'VIKRAM_MEHTA_SYNDICATE_CV.pdf',
   'Lead Syndicate Angel at Nexus. Prior VP Engineering at Razorpay. Active angel since 2018. Member of Indian Angel Network.',
   TRUE, 'verified', 88,
   '{"status": "verified", "score": 88, "verified_badge": "AI Verified", "badges": ["AI Verified Investor", "Syndicate Lead"], "summary": "Investor credential verification for Vikram Mehta (Nexus Angel Syndicate). Credibility rating: 88/100."}'::jsonb),

  ('investor-david', 'investor-david',
   'David Miller', 'david.miller@angelinvest.org', 'Private Angel',
   'Independent private angel investor exploring early-stage opportunities.',
   'Seeking tech startups with unique market positioning.',
   NULL, NULL,
   FALSE, 'unverified', 45, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Investment Preferences
INSERT INTO public.investment_preferences (id, investor_id, industries, stages, check_size_min, check_size_max, geographies, notes) VALUES
  ('pref-elena', 'investor-elena', ARRAY['CleanTech', 'ClimateTech', 'AI / DeepTech', 'B2B SaaS'], ARRAY['Seed', 'Series A'], 250000, 2000000, ARRAY['North America', 'Europe', 'India'], 'Prefer startups with working prototypes or revenue traction.'),
  ('pref-vikram', 'investor-vikram', ARRAY['FinTech', 'B2B SaaS', 'DevTools'], ARRAY['Pre-Seed', 'Seed'], 50000, 500000, ARRAY['India', 'Southeast Asia', 'US'], 'Focus on high margin software with strong organic product loops.'),
  ('pref-david', 'investor-david', ARRAY['Technology', 'HealthTech'], ARRAY['Seed'], 25000, 250000, ARRAY['Global'], 'Generalist tech investor.')
ON CONFLICT (id) DO NOTHING;

-- Seed Deals
INSERT INTO public.deals (id, startup_id, startup_name, startup_verified, title, pitch, industry, funding_stage, target_raise, equity_pct, royalty_pct, royalty_payout_terms, status, thesis, thesis_doc, ai_score, ai_report, closed_terms) VALUES
  ('deal-aerogrid', 'startup-aerogrid', 'AeroGrid Tech', TRUE,
   'Autonomous Renewable Microgrid Grid-Edge Infrastructure',
   'AI-orchestrated autonomous renewable energy grids for commercial microgrids and storage facilities',
   'CleanTech', 'Seed', 750000, 7.0, 2.5, '2.5% of quarterly gross revenue until 2.0x return cap',
   'negotiating',
   'Decentralized renewables will hit 32% grid penetration by 2030. AeroGrid combines frequency stabilization algorithms with IoT telemetry to cut curtailment by 40%.',
   'AeroGrid_Investment_Thesis_Q3.pdf', 88,
   '{"feasibility_score": 88, "score_grade": "A", "summary": "AI Feasibility Analysis completed with a score of 88/100. High viability for grid-edge software with recurring SaaS + hardware licensing model.", "pain_points": [{"category": "Sales Cycle", "severity": "Medium", "issue": "Enterprise municipal sales cycle averages 6-9 months.", "mitigation": "Partner with regional ESCO distributors."}], "simulation": {"bull": {"annual_revenue": 1650000, "runway_months": 28, "royalty_payback_months": 19}, "base": {"annual_revenue": 1100000, "runway_months": 22, "royalty_payback_months": 24}, "bear": {"annual_revenue": 550000, "runway_months": 15, "royalty_payback_months": 34}}}'::jsonb,
   NULL),

  ('deal-finpulse', 'startup-finpulse', 'FinPulse AI', TRUE,
   'Sub-second B2B Treasury & Global FX Settlement Protocol',
   'Unified liquidity routing and automated compliance for multinational enterprises',
   'FinTech', 'Series A', 1500000, 8.5, 1.5, '1.5% of quarterly revenues until 1.75x payback cap',
   'closed',
   'Eliminates multi-day settlement delays and 2.4% FX friction for cross-border B2B transactions.',
   'FinPulse_SeriesA_Thesis.pdf', 92,
   '{"feasibility_score": 92, "score_grade": "A", "summary": "AI Feasibility Score: 92/100. Exceptional unit economics."}'::jsonb,
   '{"investor_id": "investor-elena", "investor_name": "Elena Rostova (Apex Horizon Capital)", "final_amount": 1500000, "final_equity_pct": 8.5, "final_royalty_pct": 1.5, "royalty_payout_terms": "1.5% of quarterly revenues until 1.75x payback cap", "agreement_doc": "FINPULSE_INVESTMENT_CLOSING_BINDER.pdf"}'::jsonb),

  ('deal-biosynthetix', 'startup-biosynthetix', 'BioSynthetix Labs', FALSE,
   'Generative Protein Design Platform for Targeted Oncology',
   'Deep learning diffusion models predicting antibody-antigen binding affinities in weeks',
   'HealthTech', 'Pre-Seed', 400000, 6.0, 3.0, '3.0% of licensing revenues until 2.5x payback',
   'draft',
   'Wet-lab therapeutic discovery cycles take 2+ years. BioSynthetix uses generative chemistry to slash synthesis cycles to 6 weeks.',
   'BioSynthetix_Thesis_Draft_v1.pdf', 79,
   '{"feasibility_score": 79, "score_grade": "B+", "summary": "AI Feasibility Score: 79/100."}'::jsonb,
   NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Offers (Negotiation Tree)
INSERT INTO public.offers (id, deal_id, investor_id, investor_name, sender_type, amount, equity_pct, royalty_pct, royalty_payout_terms, status, message, timestamp) VALUES
  ('offer-ag-1', 'deal-aerogrid', 'system', 'AeroGrid Tech (Listing Terms)', 'startup', 750000, 7.0, 2.5, '2.5% quarterly revenue until 2.0x return cap', 'superseded', 'Initial published marketplace offering terms.', NOW() - INTERVAL '3 days'),
  ('offer-ag-2', 'deal-aerogrid', 'investor-elena', 'Elena Rostova (Apex Horizon)', 'investor', 800000, 8.0, 2.0, '2.0% quarterly revenue until 1.8x return cap', 'countered', 'We offer $800k total round commitment with 8.0% equity and reduced royalty of 2.0% (1.8x cap).', NOW() - INTERVAL '2 days'),
  ('offer-ag-3', 'deal-aerogrid', 'investor-elena', 'AeroGrid Tech (Founder Counter)', 'startup', 800000, 7.5, 2.2, '2.2% quarterly revenue until 2.0x return cap', 'active', 'Founder counter-offer: agreed to $800k round size, offering 7.5% equity with 2.2% royalty (2.0x cap). Ready to execute upon investor sign-off.', NOW() - INTERVAL '1 day'),
  ('offer-fp-1', 'deal-finpulse', 'investor-elena', 'Elena Rostova (Apex Horizon)', 'investor', 1500000, 8.5, 1.5, '1.5% of quarterly revenues until 1.75x payback cap', 'accepted', 'Lead Series A term sheet executed.', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Deal Messages
INSERT INTO public.deal_messages (id, room_id, sender_id, sender_name, body, created_at) VALUES
  ('msg-1', 'room-aerogrid', 'investor-elena', 'Elena Rostova', 'Hello AeroGrid team. We reviewed your thesis simulation. Very impressed with the harmonic filtration telemetry. We would like to propose a lead check of $800k.', NOW() - INTERVAL '2 days'),
  ('msg-2', 'room-aerogrid', 'founder-aerogrid', 'Priya Sharma (AeroGrid Tech)', 'Thank you Elena! We are eager to partner with Apex Horizon. We reviewed your term sheet and sent a counter with adjusted royalty to protect early operational cashflow.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Seed Deal Interests
INSERT INTO public.deal_interests (id, deal_id, investor_id, investor_name, status) VALUES
  ('int-1', 'deal-aerogrid', 'investor-elena', 'Elena Rostova', 'active_negotiation'),
  ('int-2', 'deal-aerogrid', 'investor-vikram', 'Vikram Mehta', 'interested')
ON CONFLICT (id) DO NOTHING;

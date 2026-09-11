-- =============================================================================
-- Supabase Demo Seed Data
-- 3 Startups, 5 Investors, Claims, Documents, Preferences, Deals, Deal Rooms
-- =============================================================================

-- Demo Profiles
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111101', 'founder1@novagrid.io', 'Arjun Mehta', 'startup'),
  ('11111111-1111-1111-1111-111111111102', 'founder2@healthpulse.ai', 'Dr. Priya Sharma', 'startup'),
  ('11111111-1111-1111-1111-111111111103', 'founder3@agrologix.co', 'Rohan Verma', 'startup'),
  ('22222222-2222-2222-2222-222222222201', 'asha@horizonvc.com', 'Asha Rao', 'investor'),
  ('22222222-2222-2222-2222-222222222202', 'marcus@apexcapital.io', 'Marcus Chen', 'investor'),
  ('22222222-2222-2222-2222-222222222203', 'elena@nordicseed.eu', 'Elena Rostova', 'investor'),
  ('22222222-2222-2222-2222-222222222204', 'vikram@blueoceanangels.in', 'Vikram Malhotra', 'investor'),
  ('22222222-2222-2222-2222-222222222205', 'sarah@catalystfund.com', 'Sarah Jenkins', 'investor')
ON CONFLICT (id) DO NOTHING;

-- Demo Startups
INSERT INTO public.startups (id, owner_id, name, slug, tagline, description, industry, stage, website, thesis) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101',
   'NovaGrid Energy', 'novagrid-energy',
   'Intelligent B2B Microgrid & Energy Arbitrage Optimization',
   'NovaGrid deploys edge-AI controllers to reduce commercial facility power costs by 32% via dynamic battery dispatch.',
   'CleanTech', 'Seed', 'https://novagrid.io',
   'Commercial solar + storage is economically constrained by passive battery management; predictive optimization unlocks 3x ROI.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.startups (id, owner_id, name, slug, tagline, description, industry, stage, website, thesis) VALUES
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102',
   'HealthPulse AI', 'healthpulse-ai',
   'Autonomous ICU Clinical Workflow & Triage Copilot',
   'HealthPulse synthesizes real-time patient telemetry to alert intensivists of acute deterioration 4 hours before crisis.',
   'HealthTech', 'Pre-Seed', 'https://healthpulse.ai',
   'ICU nurse burnout and alert fatigue cost hospitals billions; algorithmic sensor fusion predicts septic shock with 94% specificity.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.startups (id, owner_id, name, slug, tagline, description, industry, stage, website, thesis) VALUES
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103',
   'AgroLogix', 'agrologix',
   'Autonomous Cold-Chain Traceability & Fresh Produce Marketplace',
   'AgroLogix connects farm aggregators directly to urban retailers with active shelf-life spoilage sensing and dynamic pricing.',
   'AgriTech', 'Seed', 'https://agrologix.co',
   'Post-harvest loss in emerging markets exceeds 30%; IoT sensor-tracked logistics cuts spoilage to under 6% while boosting farmer income.')
ON CONFLICT (id) DO NOTHING;

-- Demo Claims & Metrics for Startup 1 (NovaGrid)
INSERT INTO public.startup_claims (startup_id, claim_text, category, confidence) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Achieved 32% reduction in peak commercial electricity bills across 8 beta sites', 'Financial', 0.91),
  ('33333333-3333-3333-3333-333333333301', 'TAM in target tier-1 commercial real estate is $14.2B with 24% CAGR', 'Market', 0.85),
  ('33333333-3333-3333-3333-333333333301', 'Payback period for commercial clients is under 11 months', 'Product', 0.88)
ON CONFLICT DO NOTHING;

INSERT INTO public.startup_metrics (startup_id, market_size, growth_rate, cac, churn, customers, revenue, marketing_budget, operating_cost, runway_months, valuation) VALUES
  ('33333333-3333-3333-3333-333333333301', 14200000000, 0.28, 4200, 0.03, 142, 780000, 110000, 390000, 14, 5500000),
  ('33333333-3333-3333-3333-333333333302', 8900000000, 0.35, 8500, 0.02, 28, 320000, 65000, 240000, 9, 4000000),
  ('33333333-3333-3333-3333-333333333303', 21000000000, 0.22, 1800, 0.05, 310, 1250000, 140000, 710000, 16, 7200000)
ON CONFLICT DO NOTHING;

-- Demo Investors
INSERT INTO public.investors (id, owner_id, display_name, firm, bio, thesis) VALUES
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', 'Asha Rao', 'Horizon Ventures',
   'Partner leading climate & sustainability investments in South & Southeast Asia.',
   'Backing hardware-enabled software decarbonizing grid infrastructure and industrial manufacturing.'),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', 'Marcus Chen', 'Apex Capital',
   'Managing Director focused on deep tech, B2B SaaS, and autonomous systems.',
   'Investing in defensible IP and algorithmic defensibility at the edge.'),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222203', 'Elena Rostova', 'Nordic Seed Fund',
   'Principal specializing in digital health, clinical AI, and medical devices.',
   'Empowering clinicians through explainable, high-specificity diagnostic copilots.'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222204', 'Vikram Malhotra', 'Blue Ocean Angels',
   'Angel syndicate lead with 25+ early-stage enterprise exits.',
   'High conviction in capital-efficient supply chain modernization and B2B marketplaces.'),
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222205', 'Sarah Jenkins', 'Catalyst Seed Fund',
   'Early-stage partner backing resilient founders across energy transition and bio-economy.',
   'Seed rounds with strong unit economics and early pilot validation.')
ON CONFLICT (id) DO NOTHING;

-- Demo Investment Preferences
INSERT INTO public.investment_preferences (investor_id, industries, stages, check_size_min, check_size_max, geographies, notes) VALUES
  ('44444444-4444-4444-4444-444444444401', ARRAY['CleanTech', 'Energy', 'Industrial'], ARRAY['Seed', 'Series A'], 300000, 1500000, ARRAY['Asia', 'Global'], 'Prefers strong pilot retention'),
  ('44444444-4444-4444-4444-444444444402', ARRAY['CleanTech', 'DeepTech', 'B2B SaaS'], ARRAY['Seed', 'Pre-Seed'], 250000, 1000000, ARRAY['North America', 'Asia'], 'Requires technical defensibility'),
  ('44444444-4444-4444-4444-444444444403', ARRAY['HealthTech', 'BioTech'], ARRAY['Pre-Seed', 'Seed'], 200000, 800000, ARRAY['Europe', 'Global'], 'Clinical trial or pilot data mandatory'),
  ('44444444-4444-4444-4444-444444444404', ARRAY['AgriTech', 'Logistics', 'Marketplace'], ARRAY['Seed'], 150000, 750000, ARRAY['India', 'Southeast Asia'], 'Focus on positive unit economics'),
  ('44444444-4444-4444-4444-444444444405', ARRAY['CleanTech', 'AgriTech', 'SaaS'], ARRAY['Pre-Seed', 'Seed'], 100000, 500000, ARRAY['Global'], 'Open to syndicate co-investments')
ON CONFLICT DO NOTHING;

-- Demo Deals
INSERT INTO public.deals (id, startup_id, title, status, target_raise) VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', 'NovaGrid Energy — Seed Round', 'open', 1200000),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333302', 'HealthPulse AI — Pre-Seed Syndicate', 'open', 600000),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333303', 'AgroLogix — Seed Acceleration Round', 'open', 1500000)
ON CONFLICT (id) DO NOTHING;

-- Demo Deal Interests
INSERT INTO public.deal_interests (deal_id, investor_id, status) VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'interested'),
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444402', 'interested'),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444403', 'interested')
ON CONFLICT DO NOTHING;

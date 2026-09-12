-- Marketplace enrichment: extra startups, investors, deals, interests, offers
-- Idempotent via ON CONFLICT DO NOTHING / DO UPDATE for thesis_doc paths

-- Ensure existing deals point at public thesis PDFs
UPDATE public.deals SET thesis_doc = 'AeroGrid_Investment_Thesis_Q3.pdf' WHERE id = 'deal-aerogrid';
UPDATE public.deals SET thesis_doc = 'FinPulse_SeriesA_Thesis.pdf' WHERE id = 'deal-finpulse';
UPDATE public.deals SET thesis_doc = 'BioSynthetix_Thesis_Draft_v1.pdf' WHERE id = 'deal-biosynthetix';
UPDATE public.deals SET thesis_doc = 'QuantumLedger_SeriesSeed_Thesis.pdf' WHERE id = 'deal-quantumledger';
UPDATE public.deals SET status = 'published' WHERE id = 'deal-biosynthetix' AND status = 'draft';

-- New founder profiles
INSERT INTO public.profiles (id, email, password_hash, full_name, role, startup_id, investor_id, is_verified) VALUES
  ('founder-cargoflow', 'ceo@cargoflow.in', 'password123', 'Neha Kapoor', 'startup', 'startup-cargoflow', NULL, TRUE),
  ('founder-edunova', 'founder@edunova.io', 'password123', 'Rohan Desai', 'startup', 'startup-edunova', NULL, TRUE),
  ('founder-farmstack', 'hello@farmstack.ag', 'password123', 'Ananya Iyer', 'startup', 'startup-farmstack', NULL, TRUE),
  ('founder-securenest', 'ceo@securenest.io', 'password123', 'James Okonkwo', 'startup', 'startup-securenest', NULL, TRUE),
  ('founder-mediroute', 'team@mediroute.health', 'password123', 'Dr. Leila Hassan', 'startup', 'startup-mediroute', NULL, FALSE),
  ('founder-paylattice', 'founders@paylattice.com', 'password123', 'Kabir Singh', 'startup', 'startup-paylattice', NULL, TRUE),
  ('investor-asha', 'asha@horizonvc.com', 'password123', 'Asha Rao', 'investor', NULL, 'investor-asha', TRUE),
  ('investor-marcus', 'marcus@apexcap.io', 'password123', 'Marcus Chen', 'investor', NULL, 'investor-marcus', TRUE),
  ('investor-priya', 'priya@catalyst.fund', 'password123', 'Priya Nair', 'investor', NULL, 'investor-priya', TRUE),
  ('investor-tom', 'tom@deeptech.angels', 'password123', 'Tom Alvarez', 'investor', NULL, 'investor-tom', TRUE)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  startup_id = EXCLUDED.startup_id,
  investor_id = EXCLUDED.investor_id,
  is_verified = EXCLUDED.is_verified;

INSERT INTO public.startups (id, owner_id, name, slug, tagline, description, industry, stage, website, email, thesis, gst_number, incorporation_cert, is_verified, verification_status, verification_score, verification_report) VALUES
  ('startup-cargoflow', 'founder-cargoflow', 'CargoFlow Logistics', 'cargoflow-logistics',
   'AI lane pricing for cold-chain freight',
   'Dynamic pricing and SLA enforcement for temperature-controlled B2B freight.',
   'Logistics', 'Seed', 'https://cargoflow.in', 'ceo@cargoflow.in',
   'Cold-chain freight margins erode from empty backhauls; CargoFlow optimizes lane pricing in real time.',
   '27AABCC9988L1Z1', 'CARGOFLOW_ROC.pdf', TRUE, 'verified', 89,
   '{"status":"verified","score":89,"summary":"CargoFlow verified."}'::jsonb),
  ('startup-edunova', 'founder-edunova', 'EduNova Skills', 'edunova-skills',
   'B2B cohort upskilling marketplace',
   'Employer-paid AI-native learning paths for mid-market Indian enterprises.',
   'EdTech', 'Seed', 'https://edunova.io', 'founder@edunova.io',
   'Corporate L&D budgets waste 40% on unused seats; EduNova sells outcome-tied cohorts.',
   '29AAECE1122M1Z3', 'EDUNOVA_ROC.pdf', TRUE, 'verified', 86,
   '{"status":"verified","score":86,"summary":"EduNova verified."}'::jsonb),
  ('startup-farmstack', 'founder-farmstack', 'FarmStack', 'farmstack',
   'FPO marketplace with spoilage IoT',
   'Connects farmer producer orgs to urban retailers with active spoilage sensing.',
   'AgriTech', 'Seed', 'https://farmstack.ag', 'hello@farmstack.ag',
   'Post-harvest loss exceeds 28%; FarmStack cuts spoilage with IoT + guaranteed buybacks.',
   '33AAACF4455N1Z7', 'FARMSTACK_ROC.pdf', TRUE, 'verified', 84,
   '{"status":"verified","score":84,"summary":"FarmStack verified."}'::jsonb),
  ('startup-securenest', 'founder-securenest', 'SecureNest', 'securenest',
   'Cloud workload identity mesh',
   'Zero-trust identity for multi-cloud workloads with continuous attestation.',
   'Cybersecurity', 'Series A', 'https://securenest.io', 'ceo@securenest.io',
   'Workload identity sprawl is the #1 breach vector; SecureNest unifies attestation.',
   '07AAACS7788P1Z2', 'SECURENEST_ROC.pdf', TRUE, 'verified', 93,
   '{"status":"verified","score":93,"summary":"SecureNest verified."}'::jsonb),
  ('startup-mediroute', 'founder-mediroute', 'MediRoute', 'mediroute',
   'Pharma last-mile cold routing',
   'Route optimization for vaccine and specialty drug distributors.',
   'HealthTech', 'Pre-Seed', 'https://mediroute.health', 'team@mediroute.health',
   'Specialty pharma cold-chain breaches destroy high-value inventory; MediRoute prevents excursions.',
   '19AAACM3344Q1Z6', 'MEDIROUTE_PROV.pdf', FALSE, 'pending', 58, NULL),
  ('startup-paylattice', 'founder-paylattice', 'PayLattice', 'paylattice',
   'Embedded payout orchestration API',
   'Unified payout rails for marketplaces with instant reconciliation.',
   'FinTech', 'Seed', 'https://paylattice.com', 'founders@paylattice.com',
   'Marketplace payout ops are fragmented across banks; PayLattice is the orchestration layer.',
   '27AAACP5566R1Z9', 'PAYLATTICE_ROC.pdf', TRUE, 'verified', 90,
   '{"status":"verified","score":90,"summary":"PayLattice verified."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.investors (id, owner_id, display_name, email, firm, bio, thesis, cv_filename, cv_text, is_verified, verification_status, verification_score, verification_report) VALUES
  ('investor-asha', 'investor-asha', 'Asha Rao', 'asha@horizonvc.com', 'Horizon Ventures',
   'Partner leading climate and industrial software investments across South Asia.',
   'Backing capital-efficient climate infrastructure.',
   'ASHA_RAO_CV.pdf', 'Partner at Horizon Ventures. Climate + industrial SaaS.',
   TRUE, 'verified', 91,
   '{"status":"verified","score":91,"summary":"Asha Rao verified."}'::jsonb),
  ('investor-marcus', 'investor-marcus', 'Marcus Chen', 'marcus@apexcap.io', 'Apex Capital',
   'MD investing in B2B SaaS and AI infrastructure.',
   'Domain-specific AI with deterministic guardrails.',
   'MARCUS_CHEN_CV.pdf', 'Managing Director Apex Capital.',
   TRUE, 'verified', 89,
   '{"status":"verified","score":89,"summary":"Marcus Chen verified."}'::jsonb),
  ('investor-priya', 'investor-priya', 'Priya Nair', 'priya@catalyst.fund', 'Catalyst Seed Fund',
   'Early-stage partner backing resilient founders.',
   'Seed syndicate participant for high-conviction rounds.',
   'PRIYA_NAIR_CV.pdf', 'Partner Catalyst Seed Fund.',
   TRUE, 'verified', 87,
   '{"status":"verified","score":87,"summary":"Priya Nair verified."}'::jsonb),
  ('investor-tom', 'investor-tom', 'Tom Alvarez', 'tom@deeptech.angels', 'DeepTech Angels',
   'Angel focused on cryptography, security, and developer tools.',
   'Writing $100k-$400k checks into deep-tech seeds.',
   'TOM_ALVAREZ_CV.pdf', 'Lead angel DeepTech Angels.',
   TRUE, 'verified', 85,
   '{"status":"verified","score":85,"summary":"Tom Alvarez verified."}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.investment_preferences (id, investor_id, industries, stages, check_size_min, check_size_max, geographies, notes) VALUES
  ('pref-asha', 'investor-asha', ARRAY['CleanTech','Logistics','AgriTech'], ARRAY['Seed','Series A'], 300000, 1500000, ARRAY['India','SEA'], 'Prefer verified pilots.'),
  ('pref-marcus', 'investor-marcus', ARRAY['B2B SaaS','Cybersecurity','AI / DeepTech'], ARRAY['Seed','Series A'], 250000, 2000000, ARRAY['Global'], 'Strong technical founders.'),
  ('pref-priya', 'investor-priya', ARRAY['EdTech','HealthTech','FinTech'], ARRAY['Pre-Seed','Seed'], 100000, 600000, ARRAY['India'], 'Outcome metrics required.'),
  ('pref-tom', 'investor-tom', ARRAY['Cybersecurity','AI / DeepTech','FinTech'], ARRAY['Seed'], 100000, 400000, ARRAY['US','India'], 'Security moats preferred.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deals (id, startup_id, startup_name, startup_verified, title, pitch, industry, funding_stage, target_raise, equity_pct, royalty_pct, royalty_payout_terms, status, thesis, thesis_doc, ai_score, ai_report, closed_terms) VALUES
  ('deal-cargoflow', 'startup-cargoflow', 'CargoFlow Logistics', TRUE,
   'AI Lane Pricing for Cold-Chain Freight',
   'Dynamic pricing and SLA engine for temperature-controlled B2B freight corridors',
   'Logistics', 'Seed', 600000, 8.0, 2.5, '2.5% quarterly GMV until 2.0x',
   'published',
   'Cold-chain freight margins erode from empty backhauls; CargoFlow optimizes lane pricing in real time with IoT SLA enforcement.',
   'CargoFlow_Seed_Thesis.pdf', 85,
   '{"feasibility_score":85,"score_grade":"B+","summary":"Strong logistics SaaS unit economics."}'::jsonb, NULL),

  ('deal-edunova', 'startup-edunova', 'EduNova Skills', TRUE,
   'Outcome-Tied B2B Upskilling Marketplace',
   'Employer-paid AI learning cohorts with completion-linked billing',
   'EdTech', 'Seed', 500000, 7.5, 2.0, '2.0% quarterly revenue until 1.8x',
   'negotiating',
   'Corporate L&D wastes budget on unused seats; EduNova sells outcome-tied cohorts to mid-market employers.',
   'EduNova_Seed_Thesis.pdf', 83,
   '{"feasibility_score":83,"score_grade":"B+","summary":"Healthy B2B EdTech retention."}'::jsonb, NULL),

  ('deal-farmstack', 'startup-farmstack', 'FarmStack', TRUE,
   'FPO Marketplace with Spoilage IoT',
   'Direct FPO-to-retailer exchange with active cold-chain sensing',
   'AgriTech', 'Seed', 450000, 7.0, 3.0, '3.0% GMV royalty until 2.2x',
   'published',
   'Post-harvest loss exceeds 28%; FarmStack cuts spoilage with IoT tags and guaranteed buybacks.',
   'FarmStack_Seed_Thesis.pdf', 81,
   '{"feasibility_score":81,"score_grade":"B","summary":"Agri marketplace with hardware attach."}'::jsonb, NULL),

  ('deal-securenest', 'startup-securenest', 'SecureNest', TRUE,
   'Cloud Workload Identity Mesh',
   'Zero-trust continuous attestation across multi-cloud workloads',
   'Cybersecurity', 'Series A', 1800000, 9.0, 1.5, '1.5% ARR royalty until 1.75x',
   'active',
   'Workload identity sprawl drives breaches; SecureNest unifies attestation with policy-as-code.',
   'SecureNest_SeriesA_Thesis.pdf', 94,
   '{"feasibility_score":94,"score_grade":"A","summary":"Enterprise security SaaS with strong NRR."}'::jsonb, NULL),

  ('deal-mediroute', 'startup-mediroute', 'MediRoute', FALSE,
   'Pharma Last-Mile Cold Routing',
   'Route optimization preventing cold-chain excursions for specialty drugs',
   'HealthTech', 'Pre-Seed', 300000, 6.5, 3.5, '3.5% licensing until 2.5x',
   'published',
   'Specialty pharma cold-chain breaches destroy inventory; MediRoute prevents temperature excursions.',
   'MediRoute_PreSeed_Thesis.pdf', 76,
   '{"feasibility_score":76,"score_grade":"B","summary":"Early traction with distributors."}'::jsonb, NULL),

  ('deal-paylattice', 'startup-paylattice', 'PayLattice', TRUE,
   'Embedded Payout Orchestration API',
   'Unified marketplace payout rails with instant reconciliation',
   'FinTech', 'Seed', 850000, 8.0, 2.0, '2.0% take-rate royalty until 2.0x',
   'negotiating',
   'Marketplace payout ops are fragmented; PayLattice is the orchestration layer across banks and wallets.',
   'PayLattice_Seed_Thesis.pdf', 88,
   '{"feasibility_score":88,"score_grade":"A-","summary":"FinTech API with clear expansion paths."}'::jsonb, NULL)
ON CONFLICT (id) DO UPDATE SET
  thesis_doc = EXCLUDED.thesis_doc,
  thesis = EXCLUDED.thesis,
  status = EXCLUDED.status,
  ai_score = EXCLUDED.ai_score,
  startup_verified = EXCLUDED.startup_verified;

INSERT INTO public.offers (id, deal_id, investor_id, investor_name, sender_type, amount, equity_pct, royalty_pct, royalty_payout_terms, status, message, timestamp) VALUES
  ('offer-ed-1', 'deal-edunova', 'system', 'EduNova Skills', 'startup', 500000, 7.5, 2.0, '2.0% until 1.8x', 'countered', 'Published seed terms.', NOW() - INTERVAL '4 days'),
  ('offer-ed-2', 'deal-edunova', 'investor-priya', 'Priya Nair (Catalyst)', 'investor', 520000, 8.0, 1.8, '1.8% until 1.8x', 'active', 'Lead check with slight equity bump.', NOW() - INTERVAL '1 day'),
  ('offer-sn-1', 'deal-securenest', 'system', 'SecureNest', 'startup', 1800000, 9.0, 1.5, '1.5% until 1.75x', 'countered', 'Series A listing terms.', NOW() - INTERVAL '6 days'),
  ('offer-sn-2', 'deal-securenest', 'investor-marcus', 'Marcus Chen (Apex)', 'investor', 2000000, 8.5, 1.2, '1.2% until 1.6x', 'countered', 'Larger check, better royalty.', NOW() - INTERVAL '3 days'),
  ('offer-sn-3', 'deal-securenest', 'investor-tom', 'Tom Alvarez', 'investor', 400000, 2.0, 0.5, 'pro-rata sidecar', 'active', 'Sidecar angel participation.', NOW() - INTERVAL '2 days'),
  ('offer-pl-1', 'deal-paylattice', 'system', 'PayLattice', 'startup', 850000, 8.0, 2.0, '2.0% until 2.0x', 'countered', 'Seed marketplace terms.', NOW() - INTERVAL '5 days'),
  ('offer-pl-2', 'deal-paylattice', 'investor-vikram', 'Vikram Mehta', 'investor', 900000, 7.5, 1.8, '1.8% until 1.9x', 'active', 'Syndicate lead interest.', NOW() - INTERVAL '2 days'),
  ('offer-cf-1', 'deal-cargoflow', 'investor-asha', 'Asha Rao', 'investor', 550000, 7.5, 2.2, '2.2% until 2.0x', 'active', 'Climate-logistics thesis fit.', NOW() - INTERVAL '1 day'),
  ('offer-ql-2', 'deal-quantumledger', 'investor-tom', 'Tom Alvarez', 'investor', 300000, 2.5, 0.8, 'sidecar', 'active', 'Deep-tech angel check.', NOW() - INTERVAL '8 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deal_interests (id, deal_id, investor_id, investor_name, status) VALUES
  ('int-3', 'deal-edunova', 'investor-priya', 'Priya Nair', 'active_negotiation'),
  ('int-4', 'deal-securenest', 'investor-marcus', 'Marcus Chen', 'active_negotiation'),
  ('int-5', 'deal-securenest', 'investor-tom', 'Tom Alvarez', 'interested'),
  ('int-6', 'deal-paylattice', 'investor-vikram', 'Vikram Mehta', 'active_negotiation'),
  ('int-7', 'deal-cargoflow', 'investor-asha', 'Asha Rao', 'interested'),
  ('int-8', 'deal-farmstack', 'investor-asha', 'Asha Rao', 'interested'),
  ('int-9', 'deal-mediroute', 'investor-priya', 'Priya Nair', 'interested'),
  ('int-10', 'deal-quantumledger', 'investor-tom', 'Tom Alvarez', 'interested'),
  ('int-11', 'deal-aerogrid', 'investor-marcus', 'Marcus Chen', 'interested'),
  ('int-12', 'deal-paylattice', 'investor-elena', 'Elena Rostova', 'interested')
ON CONFLICT (id) DO NOTHING;

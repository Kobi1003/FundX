-- ROC Companies Table & Seed Data
-- Integrates Ministry of Corporate Affairs (MCA) / Registrar of Companies (ROC) database
-- for instant CIN verification of Startups and Investors

-- Create ROC Companies Table
CREATE TABLE IF NOT EXISTS public.roc_companies (
  cin TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  registration_date DATE,
  category TEXT,
  company_class TEXT,
  listing_status TEXT,
  authorized_capital NUMERIC,
  paidup_capital NUMERIC,
  roc TEXT,
  address TEXT,
  state TEXT,
  company_status TEXT DEFAULT 'Active',
  industrial_classification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_roc_companies_cin ON public.roc_companies(cin);
CREATE INDEX IF NOT EXISTS idx_roc_companies_status ON public.roc_companies(company_status);
CREATE INDEX IF NOT EXISTS idx_roc_companies_company_name ON public.roc_companies(company_name);

-- Insert Sample ROC Data (Active Companies for Demo)
INSERT INTO public.roc_companies (
  cin,
  company_name,
  registration_date,
  category,
  company_class,
  listing_status,
  authorized_capital,
  paidup_capital,
  roc,
  address,
  state,
  company_status,
  industrial_classification
) VALUES
-- Active Startups
(
  'U40100WB2022PTC256639',
  'AeroGrid Tech Innovations Private Limited',
  '2022-10-15',
  'Private',
  'Private Company',
  'Unlisted',
  5000000.00,
  2500000.00,
  'ROC-KOLKATA',
  '42/A Park Lane, Ballygunge, Kolkata 700019',
  'West Bengal',
  'Active',
  'Renewable Energy / Climate Technology'
),
(
  'U40108WB2022PLC256813',
  'FinPulse AI Solutions Limited',
  '2022-08-22',
  'Public',
  'Public Company',
  'Listed',
  10000000.00,
  7500000.00,
  'ROC-KOLKATA',
  '156 Camac Street, Kolkata 700017',
  'West Bengal',
  'Active',
  'Information Technology / FinTech'
),
(
  'U72110MH2023PTC399845',
  'BioSynthetix Labs Private Limited',
  '2023-03-10',
  'Private',
  'Private Company',
  'Unlisted',
  3000000.00,
  1500000.00,
  'ROC-MUMBAI',
  'Unit 45, Techzone IT Park, Khargar, Navi Mumbai 410210',
  'Maharashtra',
  'Active',
  'Biotechnology / Healthcare / Drug Discovery'
),
(
  'U45201GJ2023PTC087234',
  'CloudPeak Infrastructure Solutions Pvt Ltd',
  '2023-05-20',
  'Private',
  'Private Company',
  'Unlisted',
  2000000.00,
  1000000.00,
  'ROC-AHMEDABAD',
  '201, Vikram Complex, Satellite, Ahmedabad 380015',
  'Gujarat',
  'Active',
  'Information Technology / Cloud Computing'
),
(
  'U62011KA2022PTC117654',
  'NeuroVenture Analytics Private Limited',
  '2022-11-05',
  'Private',
  'Private Company',
  'Unlisted',
  4500000.00,
  2250000.00,
  'ROC-BANGALORE',
  'Suite 302, Tech Park Phase-2, Whitefield, Bangalore 560066',
  'Karnataka',
  'Active',
  'Artificial Intelligence / Data Analytics'
),
-- Strike Off Company (For Testing Ineligible Status)
(
  'U35201WB2023PTC262723',
  'Legacy Commerce Enterprise Limited',
  '2023-02-14',
  'Private',
  'Private Company',
  'Unlisted',
  500000.00,
  250000.00,
  'ROC-KOLKATA',
  '89 Lower Circular Road, Kolkata 700013',
  'West Bengal',
  'Strike Off',
  'General Trading'
),
-- Liquidation Company (For Testing Ineligible Status)
(
  'U51234MH2021PTC342876',
  'SynthWave Technologies Limited',
  '2021-07-08',
  'Private',
  'Private Company',
  'Unlisted',
  1000000.00,
  500000.00,
  'ROC-MUMBAI',
  '12 Maker Chambers, Fort, Mumbai 400001',
  'Maharashtra',
  'Under Liquidation',
  'Software Development'
),
-- Additional Active Companies for Verification Testing
(
  'U67110TG2023PTC099876',
  'GreenEnergy Innovations Telangana Pvt Ltd',
  '2023-06-12',
  'Private',
  'Private Company',
  'Unlisted',
  6000000.00,
  3000000.00,
  'ROC-HYDERABAD',
  '7-1-584, Begumpet, Hyderabad 500016',
  'Telangana',
  'Active',
  'Renewable Energy / Solar Solutions'
),
(
  'U75110DL2022PTC389201',
  'Delhi Digital Ventures Limited',
  '2022-09-18',
  'Private',
  'Private Company',
  'Unlisted',
  2500000.00,
  1250000.00,
  'ROC-DELHI',
  '15/48 Bahadur Shah Zafar Marg, New Delhi 110002',
  'Delhi',
  'Active',
  'Information Technology / E-Commerce'
),
(
  'U52110TN2023PTC098765',
  'Chennai Ventures Biotech Private Limited',
  '2023-04-05',
  'Private',
  'Private Company',
  'Unlisted',
  3500000.00,
  1750000.00,
  'ROC-CHENNAI',
  '456 Mount Road, Teynampet, Chennai 600018',
  'Tamil Nadu',
  'Active',
  'Biotechnology / Medical Devices'
),
-- Amalgamated Company (For Testing Ineligible Status)
(
  'U35304WB2020PTC259876',
  'Merged Holdings Limited',
  '2020-01-30',
  'Private',
  'Private Company',
  'Unlisted',
  800000.00,
  400000.00,
  'ROC-KOLKATA',
  '234 Park Street, Kolkata 700016',
  'West Bengal',
  'Amalgamated',
  'Financial Holdings'
),
-- CIRP Company (For Testing Ineligible Status)
(
  'U45100GJ2021PTC056789',
  'Gujarat Manufacturing Works Limited',
  '2021-03-22',
  'Private',
  'Private Company',
  'Unlisted',
  2000000.00,
  1000000.00,
  'ROC-AHMEDABAD',
  '123 Industrial Area, Odhav, Ahmedabad 382415',
  'Gujarat',
  'Under CIRP',
  'Manufacturing'
);

-- Verify table creation
SELECT COUNT(*) as total_roc_records FROM public.roc_companies;

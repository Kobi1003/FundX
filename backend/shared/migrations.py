"""Database migration runner for FundX."""

import logging

logger = logging.getLogger("fundx.migrations")

# Migration 002: Add CIN verification
MIGRATION_002_CIN_VERIFICATION = """
-- Add CIN columns to existing tables
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS cin TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ;

-- Add CIN column to startups
ALTER TABLE IF EXISTS public.startups
ADD COLUMN IF NOT EXISTS cin TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ;

-- Add CIN column to investors
ALTER TABLE IF EXISTS public.investors
ADD COLUMN IF NOT EXISTS cin TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ;

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
  company_status TEXT DEFAULT 'Active' CHECK (company_status IN ('Active', 'Strike Off', 'Amalgamated', 'Under CIRP', 'Under Liquidation')),
  industrial_classification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast ROC lookup
CREATE INDEX IF NOT EXISTS idx_roc_companies_cin ON public.roc_companies(cin);
CREATE INDEX IF NOT EXISTS idx_roc_companies_status ON public.roc_companies(company_status);
CREATE INDEX IF NOT EXISTS idx_roc_companies_name ON public.roc_companies(company_name);

-- Add indexes for CIN lookups in startups and investors
CREATE INDEX IF NOT EXISTS idx_startups_cin ON public.startups(cin);
CREATE INDEX IF NOT EXISTS idx_startups_verification ON public.startups(is_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_investors_cin ON public.investors(cin);
CREATE INDEX IF NOT EXISTS idx_investors_verification ON public.investors(is_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_cin ON public.profiles(cin);

-- Seed Sample ROC Data
INSERT INTO public.roc_companies (cin, company_name, registration_date, category, company_class, listing_status, authorized_capital, paidup_capital, roc, address, state, company_status, industrial_classification)
VALUES
-- Active Startups (Eligible for Verification)
('U40100WB2022PTC256639', 'AeroGrid Tech Innovations Private Limited', '2022-10-15', 'Private', 'Private Company', 'Unlisted', 5000000.00, 2500000.00, 'ROC-KOLKATA', '42/A Park Lane, Ballygunge, Kolkata 700019', 'West Bengal', 'Active', 'Renewable Energy / Climate Technology'),
('U40108WB2022PLC256813', 'FinPulse AI Solutions Limited', '2022-08-22', 'Public', 'Public Company', 'Listed', 10000000.00, 7500000.00, 'ROC-KOLKATA', '156 Camac Street, Kolkata 700017', 'West Bengal', 'Active', 'Information Technology / FinTech'),
('U72110MH2023PTC399845', 'BioSynthetix Labs Private Limited', '2023-03-10', 'Private', 'Private Company', 'Unlisted', 3000000.00, 1500000.00, 'ROC-MUMBAI', 'Unit 45, Techzone IT Park, Khargar, Navi Mumbai 410210', 'Maharashtra', 'Active', 'Biotechnology / Healthcare / Drug Discovery'),
('U45201GJ2023PTC087234', 'CloudPeak Infrastructure Solutions Pvt Ltd', '2023-05-20', 'Private', 'Private Company', 'Unlisted', 2000000.00, 1000000.00, 'ROC-AHMEDABAD', '201, Vikram Complex, Satellite, Ahmedabad 380015', 'Gujarat', 'Active', 'Information Technology / Cloud Computing'),
('U62011KA2022PTC117654', 'NeuroVenture Analytics Private Limited', '2022-11-05', 'Private', 'Private Company', 'Unlisted', 4500000.00, 2250000.00, 'ROC-BANGALORE', 'Suite 302, Tech Park Phase-2, Whitefield, Bangalore 560066', 'Karnataka', 'Active', 'Artificial Intelligence / Data Analytics'),
('U67110TG2023PTC099876', 'GreenMinds Agriculture Tech Solutions Pvt Ltd', '2023-01-12', 'Private', 'Private Company', 'Unlisted', 3500000.00, 1750000.00, 'ROC-HYDERABAD', 'Plot 456, Mindspace IT Park, Hyderabad 500032', 'Telangana', 'Active', 'AgriTech / Sustainable Agriculture'),
('U75110DL2022PTC389201', 'UrbanFlow Mobility Private Limited', '2022-12-08', 'Private', 'Private Company', 'Unlisted', 4000000.00, 2000000.00, 'ROC-DELHI', '45, Rajendra Place, New Delhi 110008', 'Delhi', 'Active', 'Mobility / Transportation / Logistics'),
('U52110TN2023PTC098765', 'MediConnect Digital Health Solutions Pvt Ltd', '2023-04-22', 'Private', 'Private Company', 'Unlisted', 2500000.00, 1250000.00, 'ROC-CHENNAI', 'SBR Tech Park, OMR Road, Chennai 600096', 'Tamil Nadu', 'Active', 'HealthTech / Medical Devices'),
-- Inactive Companies (Testing Ineligible Status)
('U35201WB2023PTC262723', 'Legacy Commerce Enterprise Limited', '2023-02-14', 'Private', 'Private Company', 'Unlisted', 500000.00, 250000.00, 'ROC-KOLKATA', '89 Lower Circular Road, Kolkata 700013', 'West Bengal', 'Strike Off', 'General Trading'),
('U51234MH2021PTC342876', 'Defunct Ventures Private Limited', '2021-06-08', 'Private', 'Private Company', 'Unlisted', 1000000.00, 500000.00, 'ROC-MUMBAI', '234, Fort District, Mumbai 400001', 'Maharashtra', 'Under Liquidation', 'Services'),
('U35304WB2020PTC259876', 'Merged Enterprise Solutions Limited', '2020-01-19', 'Private', 'Private Company', 'Unlisted', 2000000.00, 1000000.00, 'ROC-KOLKATA', '567, Park Circus, Kolkata 700017', 'West Bengal', 'Amalgamated', 'Consulting Services'),
('U45100GJ2021PTC056789', 'Restructuring Holdings Limited', '2021-03-05', 'Private', 'Private Company', 'Unlisted', 3000000.00, 1500000.00, 'ROC-AHMEDABAD', '890, Bund Garden Road, Pune 411001', 'Gujarat', 'Under CIRP', 'Financial Services') ON CONFLICT DO NOTHING;
"""

async def run_migrations(pool) -> None:
    """Run all pending migrations."""
    if pool is None:
        logger.warning("No database pool available, skipping migrations")
        return
    
    try:
        logger.info("Running migration 002: Add CIN verification...")
        await pool.execute(MIGRATION_002_CIN_VERIFICATION)
        logger.info("Migration 002 completed successfully")
    except Exception as e:
        logger.error(f"Migration error: {e}")
        # Don't raise - allow app to continue even if migration fails

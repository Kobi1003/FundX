"""Database migration runner for FundX."""

import logging

from shared.company_masterdata import seed_roc_companies_from_masterdata

logger = logging.getLogger("fundx.migrations")

# Migration 002: Add CIN verification schema (data seeded from Excel masterdata)
MIGRATION_002_CIN_VERIFICATION = """
-- Add CIN columns to existing tables
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS cin TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ;

-- Add CIN / GST verification columns to startups
ALTER TABLE IF EXISTS public.startups
ADD COLUMN IF NOT EXISTS cin TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gst_verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS gst_verification_report JSONB;

-- Add CIN column to investors
ALTER TABLE IF EXISTS public.investors
ADD COLUMN IF NOT EXISTS cin TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ;

-- Create ROC Companies Table (populated from database/masterdata/company_masterdata.xlsx)
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

CREATE INDEX IF NOT EXISTS idx_roc_companies_cin ON public.roc_companies(cin);
CREATE INDEX IF NOT EXISTS idx_roc_companies_status ON public.roc_companies(company_status);
CREATE INDEX IF NOT EXISTS idx_roc_companies_name ON public.roc_companies(company_name);

CREATE INDEX IF NOT EXISTS idx_startups_cin ON public.startups(cin);
CREATE INDEX IF NOT EXISTS idx_startups_verification ON public.startups(is_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_investors_cin ON public.investors(cin);
CREATE INDEX IF NOT EXISTS idx_investors_verification ON public.investors(is_verified, verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_cin ON public.profiles(cin);
"""


async def run_migrations(pool) -> None:
    """Run schema migrations then seed company masterdata from Excel/CSV."""
    if pool is None:
        logger.warning("No database pool available, skipping migrations")
        return

    try:
        logger.info("Running migration 002: Add CIN verification schema...")
        await pool.execute(MIGRATION_002_CIN_VERIFICATION)
        logger.info("Migration 002 schema completed")
    except Exception as e:
        logger.error("Migration schema error: %s", e)

    try:
        result = await seed_roc_companies_from_masterdata(pool)
        logger.info("Company masterdata seed result: %s", result)
    except Exception as e:
        logger.error("Company masterdata seed error: %s", e)

"""
IBBI (Insolvency and Bankruptcy Board of India) Regulatory Adapter.
NOT_APPLICABLE unless Insolvency Professional (IP) or Registered Valuer language appears.
"""

from __future__ import annotations

from typing import Optional
from ..schemas import RegulatoryCheck


class IBBIAdapter:
    def verify_entity(self, text: str = "") -> RegulatoryCheck:
        lower_text = text.lower()
        has_ibbi_keywords = any(kw in lower_text for kw in ["ibbi", "insolvency professional", "registered valuer", "resolution professional", "bankruptcy"])

        if not has_ibbi_keywords:
            return RegulatoryCheck(
                authority="IBBI (Insolvency & Bankruptcy Board of India)",
                status="NOT_APPLICABLE",
                badge_label="IBBI: Not Applicable",
                summary="No IBBI insolvency or valuation activity claimed.",
                detail_reason="Venture capital and investor due diligence does not require IBBI registration unless acting as a Registered Valuer or Insolvency Resolution Professional.",
                source_url=None,
            )

        return RegulatoryCheck(
            authority="IBBI (Insolvency & Bankruptcy Board of India)",
            status="REQUIRES_HUMAN_REVIEW",
            badge_label="IBBI: Manual Verification Required",
            summary="Insolvency / Valuer credentials claimed — manual IBBI register lookup required.",
            detail_reason="PoC does not automate live scraping of the IBBI IP/Valuer online database.",
            source_url="https://www.ibbi.gov.in",
        )

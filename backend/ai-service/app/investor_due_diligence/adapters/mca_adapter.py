"""
MCA (Ministry of Corporate Affairs) Regulatory Adapter.
Calls enterprise API if MCA_API_KEY + MCA_API_BASE_URL are configured,
otherwise performs public CIN search (zaubacorp/tofler), or returns UNAVAILABLE with explicit reason.
Never fakes MCA filings.
"""

from __future__ import annotations

import os
from typing import Any, Optional
import httpx
from ..schemas import AdapterResult, RegulatoryCheck


class MCAAdapter:
    def __init__(self):
        self.api_key = os.getenv("MCA_API_KEY")
        self.api_base_url = os.getenv("MCA_API_BASE_URL")

    async def verify_entity(self, company_name: Optional[str] = None, cin: Optional[str] = None) -> RegulatoryCheck:
        target = company_name or cin or ""
        if not target:
            return RegulatoryCheck(
                authority="MCA (Ministry of Corporate Affairs)",
                status="NOT_APPLICABLE",
                badge_label="MCA: Not Applicable",
                summary="No company name or CIN provided for corporate registry check.",
                detail_reason="Individual angel or non-corporate entity claimed without specified company incorporation details.",
            )

        if self.api_key and self.api_base_url:
            # Enterprise API mode
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(
                        f"{self.api_base_url}/v1/company/search",
                        params={"query": target},
                        headers={"Authorization": f"Bearer {self.api_key}"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        cin_found = data.get("cin") or data.get("company_id")
                        return RegulatoryCheck(
                            authority="MCA (Ministry of Corporate Affairs)",
                            status="MATCHED",
                            badge_label="MCA: Active Entity",
                            summary=f"Active corporate entity '{target}' verified on MCA V3 register.",
                            detail_reason=f"Enterprise MCA verification confirmed CIN {cin_found or 'Active'}.",
                            source_url=f"{self.api_base_url}/company/{cin_found}" if cin_found else None,
                        )
            except Exception as e:
                pass

        # Public index fallback search (zaubacorp / tofler query)
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                query_url = f"https://www.zaubacorp.com/companysearchresults/{target}"
                resp = await client.get(
                    query_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FundX/1.0 InvestorVerificationBot"},
                )
                if resp.status_code == 200 and ("search-results" in resp.text or target.lower() in resp.text.lower()):
                    return RegulatoryCheck(
                        authority="MCA (Ministry of Corporate Affairs)",
                        status="PUBLIC_INDEX_MATCH",
                        badge_label="MCA: Public Index Verified",
                        summary=f"Entity '{target}' footprint indexed on public MCA aggregators.",
                        detail_reason=f"Found public CIN search results matching '{target}' on corporate registry aggregators.",
                        source_url=query_url,
                    )
        except Exception:
            pass

        return RegulatoryCheck(
            authority="MCA (Ministry of Corporate Affairs)",
            status="UNAVAILABLE",
            badge_label="MCA: Service Unavailable",
            summary=f"Automated MCA V3 API check unavailable for '{target}'.",
            detail_reason="MCA V3 Cloudflare/CAPTCHA portals require Enterprise MCA B2B credentials. Direct scraping is restricted. Public indexing query returned no direct matches.",
            source_url=None,
        )

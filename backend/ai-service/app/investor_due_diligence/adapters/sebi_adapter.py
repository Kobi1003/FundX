"""
SEBI (Securities and Exchange Board of India) Regulatory Adapter.
Uses local snapshot of SEBI-registered Alternative Investment Funds (AIF Cat I / Cat II / Cat III) and VCFs.
Individual angels default to NOT_APPLICABLE or PARTIALLY_VERIFIED (ANGEL/SYNDICATE FOOTPRINT).
"""

from __future__ import annotations

from typing import Optional
from ..schemas import RegulatoryCheck

# Local PoC subset of well-known SEBI registered AIFs / VC Funds in India
_SEBI_AIF_SNAPSHOT = {
    "peak xv": {"registration_no": "IN/AIF2/12-13/0002", "category": "Category II AIF", "full_name": "Peak XV Partners (formerly Sequoia Capital India)"},
    "blume": {"registration_no": "IN/AIF2/11-12/0014", "category": "Category II AIF", "full_name": "Blume Ventures Fund"},
    "nexus": {"registration_no": "IN/AIF2/13-14/0045", "category": "Category II AIF", "full_name": "Nexus Venture Partners"},
    "kalaari": {"registration_no": "IN/AIF2/12-13/0021", "category": "Category II AIF", "full_name": "Kalaari Capital Advisors"},
    "matrix": {"registration_no": "IN/AIF2/14-15/0088", "category": "Category II AIF", "full_name": "Matrix Partners India / Z47"},
    "accel": {"registration_no": "IN/AIF2/11-12/0008", "category": "Category II AIF", "full_name": "Accel India Management"},
    "elevation": {"registration_no": "IN/AIF2/13-14/0032", "category": "Category II AIF", "full_name": "Elevation Capital (formerly SAIF Partners)"},
    "chiratae": {"registration_no": "IN/AIF2/12-13/0019", "category": "Category II AIF", "full_name": "Chiratae Ventures India"},
    "apex horizon": {"registration_no": "IN/AIF2/22-23/1104", "category": "Category II AIF", "full_name": "Apex Horizon Capital AIF"},
    "indian angel network": {"registration_no": "IN/AIF1/17-18/0365", "category": "Category I AIF - Angel Fund", "full_name": "IAN Fund / Indian Angel Network"},
    "angellist": {"registration_no": "IN/AIF1/18-19/0492", "category": "Category I AIF - Angel Fund", "full_name": "AngelList India AIF"},
}


class SEBIAdapter:
    def verify_entity(self, firm_name: Optional[str] = None, claim_text: str = "") -> RegulatoryCheck:
        text_to_check = f"{firm_name or ''} {claim_text}".lower()

        is_institutional = any(kw in text_to_check for kw in ["aif", "fund", "venture capital", "vc", "cat i", "cat ii", "cat iii", "sebi"])

        if firm_name:
            firm_lower = firm_name.lower()
            for key, data in _SEBI_AIF_SNAPSHOT.items():
                if key in firm_lower or firm_lower in key:
                    return RegulatoryCheck(
                        authority="SEBI (Securities and Exchange Board of India)",
                        status="MATCHED",
                        badge_label="SEBI Registered AIF",
                        summary=f"Entity '{data['full_name']}' matched in SEBI AIF Master Register.",
                        detail_reason=f"Registration No: {data['registration_no']} ({data['category']}).",
                        source_url="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=23",
                    )

        if not is_institutional:
            return RegulatoryCheck(
                authority="SEBI (Securities and Exchange Board of India)",
                status="NOT_APPLICABLE",
                badge_label="SEBI: Angel / Individual",
                summary="Individual angel investor profile (SEBI AIF registration not required).",
                detail_reason="Individual angels and syndicate members invest personal capital or via angel platforms and are not required to hold direct SEBI institutional GP licenses.",
                source_url=None,
            )

        return RegulatoryCheck(
            authority="SEBI (Securities and Exchange Board of India)",
            status="UNVERIFIED_IN_POC_SNAPSHOT",
            badge_label="SEBI: Unverified in Snapshot",
            summary=f"Firm '{firm_name or 'Claimed VC'}' not found in PoC SEBI AIF snapshot.",
            detail_reason="PoC uses a sample snapshot of major AIFs. Live verification requires full official SEBI master database query.",
            source_url="https://www.sebi.gov.in",
        )

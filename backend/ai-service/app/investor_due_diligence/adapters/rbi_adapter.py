"""
RBI (Reserve Bank of India) Regulatory Adapter.
Local NBFC sample lookup. Defaults to NOT_APPLICABLE unless lending / credit / NBFC activity is claimed.
"""

from __future__ import annotations

from typing import Optional
from ..schemas import RegulatoryCheck

_RBI_NBFC_SNAPSHOT = {
    "bajaj finance": "N-13.00154",
    "tata capital": "N-14.03120",
    "aditya birla finance": "N-01.00642",
    "hero fincorp": "B-14.00219",
    "muthoot finance": "N-16.00012",
}


class RBIAdapter:
    def verify_entity(self, entity_name: Optional[str] = None, text: str = "") -> RegulatoryCheck:
        full_text = f"{entity_name or ''} {text}".lower()
        is_lending_claimed = any(kw in full_text for kw in ["nbfc", "lending", "credit", "peer-to-peer", "p2p", "reserve bank", "rbi"])

        if not is_lending_claimed:
            return RegulatoryCheck(
                authority="RBI (Reserve Bank of India)",
                status="NOT_APPLICABLE",
                badge_label="RBI: Not Applicable",
                summary="No NBFC or regulated lending activity claimed.",
                detail_reason="Venture equity and angel investing activities do not fall under RBI NBFC lending registration requirements.",
                source_url=None,
            )

        if entity_name:
            ent_lower = entity_name.lower()
            for key, reg_no in _RBI_NBFC_SNAPSHOT.items():
                if key in ent_lower:
                    return RegulatoryCheck(
                        authority="RBI (Reserve Bank of India)",
                        status="MATCHED",
                        badge_label="RBI: Registered NBFC",
                        summary=f"Entity '{entity_name}' matched in RBI Registered NBFC Master List.",
                        detail_reason=f"RBI CoR Number: {reg_no}.",
                        source_url="https://www.rbi.org.in/Scripts/BS_NBFCList.aspx",
                    )

        return RegulatoryCheck(
            authority="RBI (Reserve Bank of India)",
            status="UNVERIFIED_IN_POC_SNAPSHOT",
            badge_label="RBI: Unverified in Snapshot",
            summary=f"Lending entity '{entity_name or 'Claimed NBFC'}' not matched in RBI sample list.",
            detail_reason="PoC includes a sample subset of RBI NBFCs. Full official RBI master verification required in production.",
            source_url="https://www.rbi.org.in",
        )

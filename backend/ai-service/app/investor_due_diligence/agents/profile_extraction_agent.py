"""
Profile Extraction Agent.
Extracts structured claims (Employment, Angel/Syndicate Investments, Education, Exits, Regulatory)
from sanitized investor profile and CV text.
"""

from __future__ import annotations

import re
import uuid
from typing import Any
from ..schemas import ClaimCategory, ExtractedClaim


class ProfileExtractionAgent:
    def extract_claims(
        self,
        investor_name: str,
        organization: str | None,
        designation: str | None,
        bio: str | None,
        sanitized_cv_text: str | None,
    ) -> list[ExtractedClaim]:
        claims: list[ExtractedClaim] = []

        base_anchors = [investor_name]
        if organization:
            base_anchors.append(organization)

        # 1. Organization / Current Role claim
        if organization or designation:
            claims.append(
                ExtractedClaim(
                    claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                    category=ClaimCategory.EMPLOYMENT,
                    claim_text=f"Holds role '{designation or 'Partner/Investor'}' at '{organization or 'Private Firm'}'.",
                    entity_name=organization or investor_name,
                    role_or_title=designation or "Investor",
                    anchors=list(base_anchors),
                )
            )

        cv_str = sanitized_cv_text or bio or ""
        lines = [line.strip() for line in cv_str.split("\n") if line.strip()]

        for line in lines:
            lower_line = line.lower()

            # Skip redacted PII markers alone
            if line.startswith("[REDACTED_") and line.endswith("]"):
                continue

            # Check for Education claims
            if any(degree in lower_line for degree in ["iit", "iim", "stanford", "harvard", "bs", "ms", "mba", "b.tech", "m.tech", "phd", "university", "college", "degree"]):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                        category=ClaimCategory.EDUCATION,
                        claim_text=line,
                        entity_name=_extract_entity_name(line) or "Academic Institution",
                        anchors=list(base_anchors),
                    )
                )

            # Check for Angel / Syndicate investments
            elif any(kw in lower_line for kw in ["angel", "syndicate", "investor in", "backed", "portfolio", "seed check", "cheque", "startups", "investments"]):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                        category=ClaimCategory.ANGEL_SYNDICATE_INVESTMENT,
                        claim_text=line,
                        entity_name=_extract_entity_name(line) or organization,
                        anchors=list(base_anchors),
                    )
                )

            # Check for Exits / Track record
            elif any(kw in lower_line for kw in ["exit", "exits", "unicorn", "unicorns", "ipo", "acquired", "acquisition", "return", "irr", "multiples"]):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                        category=ClaimCategory.TRACK_RECORD_EXIT,
                        claim_text=line,
                        entity_name=organization,
                        anchors=list(base_anchors),
                    )
                )

            # Check for Regulatory / Certifications
            elif any(kw in lower_line for kw in ["finra", "cfa", "ca", "sebi", "certified", "accredited", "series 7", "series 63", "license"]):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                        category=ClaimCategory.REGULATORY_REGISTRATION,
                        claim_text=line,
                        anchors=list(base_anchors),
                    )
                )

            # Check for Prior Employment / General Experience
            elif any(kw in lower_line for kw in ["partner", "vp", "director", "manager", "founder", "co-founder", "years venture", "experience"]):
                claims.append(
                    ExtractedClaim(
                        claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                        category=ClaimCategory.EMPLOYMENT,
                        claim_text=line,
                        role_or_title=_extract_title(line),
                        anchors=list(base_anchors),
                    )
                )

        # Fallback if no specific claims parsed
        if not claims:
            claims.append(
                ExtractedClaim(
                    claim_id=f"claim-{uuid.uuid4().hex[:6]}",
                    category=ClaimCategory.EMPLOYMENT,
                    claim_text=f"Claimed investor profile for {investor_name} ({organization or 'Independent'}).",
                    anchors=list(base_anchors),
                )
            )

        return claims


def _extract_entity_name(text: str) -> str | None:
    match = re.search(r"\b(at|with|from|of)\s+([A-Z][A-Za-z0-9\s&]+)\b", text)
    if match:
        return match.group(2).strip()
    return None


def _extract_title(text: str) -> str | None:
    titles = ["Managing Partner", "Partner", "VP Engineering", "Director", "Founder", "Co-Founder", "CEO", "CTO", "Principal"]
    for t in titles:
        if t.lower() in text.lower():
            return t
    return None

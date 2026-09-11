"""
Contradiction & Discrepancy Detection Agent.
Detects timeline mismatches (>=3 years divergence) and role inconsistencies (junior tokens vs executive claims).
"""

from __future__ import annotations

import re
from ..schemas import ContradictionFlag, ExtractedClaim, SearchResult


class ContradictionAgent:
    def detect_contradictions(
        self,
        claims: list[ExtractedClaim],
        search_results: list[SearchResult],
    ) -> list[ContradictionFlag]:
        flags: list[ContradictionFlag] = []

        executive_titles = ["partner", "managing director", "founder", "co-founder", "ceo", "general partner"]
        junior_tokens = ["intern", "analyst", "campus ambassador", "trainee", "associate intern"]

        for c in claims:
            c_text_lower = c.claim_text.lower()
            claimed_role = (c.role_or_title or "").lower()

            # 1. Role Inconsistency Detector
            if any(ex in claimed_role or ex in c_text_lower for ex in executive_titles):
                for res in search_results:
                    res_text = f"{res.title} {res.snippet}".lower()
                    if (c.entity_name and c.entity_name.lower() in res_text) or any(w in res_text for w in c_text_lower.split() if len(w) > 5):
                        for jun in junior_tokens:
                            if jun in res_text and not any(ex in res_text for ex in executive_titles):
                                flags.append(
                                    ContradictionFlag(
                                        flag_type="ROLE_INCONSISTENCY",
                                        severity="HIGH",
                                        claim_text=c.claim_text,
                                        evidence_excerpt=res.snippet,
                                        reasoning=f"Claimed executive/leadership role '{c.role_or_title or 'Partner'}', but public snippet references junior position ('{jun}') without leadership context.",
                                    )
                                )

            # 2. Timeline Mismatch Detector (discrepancy >= 3 years)
            claimed_years = re.findall(r"\b(19\d{2}|20\d{2})\b", c.claim_text)
            if claimed_years and "present" not in c_text_lower and "ongoing" not in c_text_lower:
                claimed_year_nums = [int(y) for y in claimed_years]
                min_claimed_yr = min(claimed_year_nums)

                for res in search_results:
                    res_text = f"{res.title} {res.snippet}".lower()
                    found_years = [int(y) for y in re.findall(r"\b(19\d{2}|20\d{2})\b", res.snippet)]
                    for fy in found_years:
                        if abs(fy - min_claimed_yr) >= 3 and abs(fy - min_claimed_yr) <= 15:
                            if c.entity_name and c.entity_name.lower() in res_text:
                                flags.append(
                                    ContradictionFlag(
                                        flag_type="TIMELINE_MISMATCH",
                                        severity="MEDIUM",
                                        claim_text=c.claim_text,
                                        evidence_excerpt=res.snippet,
                                        reasoning=f"Claimed timeframe year ({min_claimed_yr}) differs by >=3 years from public footprint record year ({fy}).",
                                    )
                                )

        return flags

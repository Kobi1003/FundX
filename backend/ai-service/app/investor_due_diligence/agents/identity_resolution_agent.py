"""
Identity Resolution & Homonym Disambiguation Agent.
Scans full name against Indian common name dictionary to evaluate Homonym Collision Risk.
Calculates Identity Confidence (HIGH / MEDIUM / AMBIGUOUS) and tracks distinct public hosts.
"""

from __future__ import annotations

from urllib.parse import urlparse
from ..schemas import ExtractedClaim, IdentityResolution, SearchResult

_COMMON_INDIAN_TOKENS = {
    "aman", "rahul", "amit", "rohit", "vikram", "vibhav", "neeraj", "sumit", "anil", "sunil",
    "sharma", "patel", "singh", "kumar", "gupta", "reddy", "mehta", "shah", "verma", "rao",
    "joshi", "jain", "agarwal", "bhatia", "nair", "chawla", "khanna", "kapoor", "malhotra",
}


class IdentityResolutionAgent:
    def resolve_identity(
        self,
        investor_name: str,
        organization: str | None,
        claims: list[ExtractedClaim],
        search_results: list[SearchResult],
    ) -> Tuple[list[SearchResult], IdentityResolution]:
        name_tokens = [t.lower() for t in investor_name.split() if len(t) > 2]

        # 1. Evaluate Homonym Collision Risk
        common_matches = [t for t in name_tokens if t in _COMMON_INDIAN_TOKENS]
        homonym_risk = "HIGH" if len(common_matches) >= 1 else "LOW"

        # 2. Filter search results matching identity anchors
        relevant_results: list[SearchResult] = []
        anchor_notes: list[str] = []
        distinct_hosts: set[str] = set()

        org_lower = (organization or "").lower()

        for res in search_results:
            text = f"{res.title} {res.snippet}".lower()
            url = res.source_url.lower()
            host = urlparse(res.source_url).netloc.lower()

            name_match = all(token in text or token in url for token in name_tokens)
            org_match = org_lower and (org_lower in text or org_lower in url)

            if name_match and org_match:
                relevant_results.append(res)
                distinct_hosts.add(host)
                anchor_notes.append(f"Anchored to {investor_name} ({organization}) on {host}")
            elif name_match and not org_lower:
                relevant_results.append(res)
                distinct_hosts.add(host)
                anchor_notes.append(f"Name match for {investor_name} on {host}")
            elif org_match:
                relevant_results.append(res)
                distinct_hosts.add(host)

        if not relevant_results and search_results:
            relevant_results = search_results[:5]
            for r in relevant_results:
                distinct_hosts.add(urlparse(r.source_url).netloc.lower())

        # 3. Compute Identity Confidence Score
        confidence_score = 0
        if len(relevant_results) > 0:
            confidence_score += 1
        if any(org_lower in f"{r.title} {r.snippet}".lower() for r in relevant_results if org_lower):
            confidence_score += 2
        if len(distinct_hosts) >= 3:
            confidence_score += 1

        if confidence_score >= 3:
            identity_confidence = "HIGH"
        elif confidence_score >= 1:
            identity_confidence = "MEDIUM"
        else:
            identity_confidence = "AMBIGUOUS" if homonym_risk == "HIGH" else "MEDIUM"

        identity_res = IdentityResolution(
            identity_confidence=identity_confidence,
            homonym_collision_risk=homonym_risk,
            distinct_public_hosts=list(distinct_hosts),
            anchor_notes=anchor_notes[:5],
        )

        return relevant_results, identity_res

"""
Claim Verifier Agent.
Matches extracted claims against research evidence & registry adapters.
Produces SourceCitations with authority tiering (TIER_1..TIER_4) and builds InvestmentEvaluations for startup investments.
"""

from __future__ import annotations

from ..schemas import (
    ClaimCategory,
    ClaimVerification,
    EvidenceStrength,
    ExtractedClaim,
    InvestmentEvaluation,
    NeutralVerificationStatus,
    SearchResult,
    SourceCitation,
)


class ClaimVerifier:
    def verify_claim(
        self,
        claim: ExtractedClaim,
        relevant_search_results: list[SearchResult],
    ) -> ClaimVerification:
        claim_text_lower = claim.claim_text.lower()
        entity_lower = (claim.entity_name or "").lower()

        matched_urls: list[str] = []
        citations: list[SourceCitation] = []

        # Find corroborating search results
        for res in relevant_search_results:
            text = f"{res.title} {res.snippet}".lower()
            words_to_match = [w for w in claim_text_lower.split() if len(w) > 4 and w not in ["partner", "investor", "capital", "venture", "curriculum", "vitae"]]
            matches = [w for w in words_to_match if w in text]

            if len(matches) >= 2 or (entity_lower and entity_lower in text):
                if res.source_url not in matched_urls:
                    matched_urls.append(res.source_url)
                    citations.append(
                        SourceCitation(
                            name=res.title,
                            url=res.source_url,
                            tier=res.source_tier,
                            excerpt=res.snippet[:180] + "..." if len(res.snippet) > 180 else res.snippet,
                        )
                    )

        has_tier_1_or_2 = any(c.tier in ["TIER_1", "TIER_2"] for c in citations)

        # Determine verification status and evidence strength
        if len(matched_urls) >= 2 or has_tier_1_or_2:
            status = NeutralVerificationStatus.VERIFIED
            evidence_strength = EvidenceStrength.HIGH
            verification_notes = f"Corroborated across {len(matched_urls)} independent public web/registry sources ({'Includes Tier 1/2 Press/Gov Authority' if has_tier_1_or_2 else 'Multi-source'})."
        elif len(matched_urls) == 1:
            if claim.category == ClaimCategory.ANGEL_SYNDICATE_INVESTMENT:
                status = NeutralVerificationStatus.PARTIALLY_VERIFIED
                evidence_strength = EvidenceStrength.MEDIUM
                verification_notes = (
                    "PARTIALLY_VERIFIED (ANGEL/SYNDICATE FOOTPRINT): Angel check verified via public press release "
                    "or deal announcement. Note: Syndicate/SPV investments often list SPV trustee names on MCA Form PAS-3 rather than individual personal names."
                )
            elif claim.category == ClaimCategory.EDUCATION:
                status = NeutralVerificationStatus.PARTIALLY_VERIFIED
                evidence_strength = EvidenceStrength.MEDIUM
                verification_notes = "Single web mention. Educational degree confirmation requires primary university registrar cross-reference."
            else:
                status = NeutralVerificationStatus.PARTIALLY_VERIFIED
                evidence_strength = EvidenceStrength.MEDIUM
                verification_notes = "Single public web index source corroborating claim."
        else:
            status = NeutralVerificationStatus.UNVERIFIED
            evidence_strength = EvidenceStrength.INSUFFICIENT
            verification_notes = (
                "UNVERIFIED: No direct public web or regulatory records found for this specific claim. "
                "Unverified status does NOT mean false or fraudulent; public evidence may be unindexed or private."
            )

        return ClaimVerification(
            claim_id=claim.claim_id,
            category=claim.category,
            claim_text=claim.claim_text,
            status=status,
            evidence_strength=evidence_strength,
            corroborating_sources=matched_urls,
            source_citations=citations,
            contradiction_notes=None,
            verification_notes=verification_notes,
        )

    def build_investment_evaluations(
        self,
        verifications: list[ClaimVerification],
    ) -> list[InvestmentEvaluation]:
        evals: list[InvestmentEvaluation] = []

        for v in verifications:
            if v.category == ClaimCategory.ANGEL_SYNDICATE_INVESTMENT:
                # Extract target company name if mentioned
                comp_name = "Portfolio Startup"
                words = v.claim_text.split()
                for i, w in enumerate(words):
                    if w.lower() in ["in", "backed", "invested", "startup"] and i + 1 < len(words):
                        comp_name = words[i + 1].strip(".,()")

                evals.append(
                    InvestmentEvaluation(
                        company_name=comp_name,
                        claimed_amount=None,
                        final_status=v.status,
                        evidence_summary=f"Public evidence: {len(v.source_citations)} sources retrieved.",
                        sources=v.source_citations,
                        notes=v.verification_notes,
                    )
                )

        return evals

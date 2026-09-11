"""
Report Agent.
Compiles the final DueDiligenceReport with neutral statuses, evidence strength ratings,
overall assessment verdict, risk flags, regulatory checks, activity trace, and legal disclaimer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from ..schemas import (
    AgentActivityStep,
    ClaimVerification,
    ContradictionFlag,
    DueDiligenceReport,
    EvidenceStrength,
    IdentityResolution,
    InvestmentEvaluation,
    NeutralVerificationStatus,
    OverallAssessment,
    RegulatoryCheck,
)


class ReportAgent:
    def compile_report(
        self,
        investor_name: str,
        organization: str | None,
        designation: str | None,
        verifications: list[ClaimVerification],
        regulatory_checks: list[RegulatoryCheck],
        identity_res: IdentityResolution,
        contradictions: list[ContradictionFlag],
        investment_evals: list[InvestmentEvaluation],
        activity_trace: list[AgentActivityStep],
    ) -> DueDiligenceReport:
        total_claims = len(verifications)
        verified_cnt = sum(1 for v in verifications if v.status == NeutralVerificationStatus.VERIFIED)
        partially_cnt = sum(1 for v in verifications if v.status == NeutralVerificationStatus.PARTIALLY_VERIFIED)
        unverified_cnt = sum(1 for v in verifications if v.status == NeutralVerificationStatus.UNVERIFIED)
        contradicted_cnt = len(contradictions)

        coverage_pct = round(((verified_cnt + partially_cnt) / max(1, total_claims)) * 100, 1)

        strongly_corroborated = [v.claim_text for v in verifications if v.status == NeutralVerificationStatus.VERIFIED]
        requires_verification = [
            "Educational credentials require primary university registrar cross-reference.",
            "Private equity / angel SPV check sizes require MCA Form PAS-3 cap table confirmation.",
        ]
        risk_flags = []
        if identity_res.homonym_collision_risk == "HIGH":
            risk_flags.append(f"High Homonym Collision Risk: '{investor_name}' is a common name across Indian public registries.")
        for c in contradictions:
            risk_flags.append(f"{c.flag_type}: {c.reasoning}")

        if verified_cnt >= 2 or coverage_pct >= 60:
            overall_evidence = EvidenceStrength.HIGH
            overall_status = NeutralVerificationStatus.VERIFIED
            verdict_text = "HIGH PUBLIC CORROBORATION — SELECTIVE PRIMARY AUDIT RECOMMENDED"
        elif verified_cnt + partially_cnt >= 1:
            overall_evidence = EvidenceStrength.MEDIUM
            overall_status = NeutralVerificationStatus.PARTIALLY_VERIFIED
            verdict_text = "PARTIAL PUBLIC FOOTPRINT — SECONDARY REGISTRY VERIFICATION RECOMMENDED"
        else:
            overall_evidence = EvidenceStrength.INSUFFICIENT
            overall_status = NeutralVerificationStatus.UNVERIFIED
            verdict_text = "INSUFFICIENT PUBLIC EVIDENCE — DIRECT REGISTRAR/PAS-3 AUDIT REQUIRED"

        overall_assessment = OverallAssessment(
            verdict=verdict_text,
            identity_confidence=identity_res.identity_confidence,
            evidence_coverage_pct=coverage_pct,
            strongly_corroborated=strongly_corroborated[:5],
            requires_verification=requires_verification,
            risk_flags=risk_flags,
        )

        return DueDiligenceReport(
            investor_name=investor_name,
            claimed_organization=organization,
            claimed_designation=designation,
            investor_type="ANGEL_INVESTOR" if "angel" in (designation or "").lower() or not organization else "INSTITUTIONAL_VC",
            investigation_timestamp=datetime.utcnow().isoformat() + "Z",
            total_claims=total_claims,
            verified_count=verified_cnt,
            partially_verified_count=partially_cnt,
            unverified_count=unverified_cnt,
            contradicted_count=contradicted_cnt,
            requires_review_count=len(requires_verification),
            overall_evidence_strength=overall_evidence,
            overall_status=overall_status,
            overall_assessment=overall_assessment,
            identity_resolution=identity_res,
            regulatory_checks=regulatory_checks,
            investment_evaluations=investment_evals,
            verifications=verifications,
            contradictions=contradictions,
            activity_trace=activity_trace,
        )

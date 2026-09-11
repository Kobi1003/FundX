"""
Pydantic v2 Schemas for AI Investor Due-Diligence Engine (Indian Market PoC).
Refuses character judgment or numeric trust scores. Uses neutral verification statuses and evidence strength ratings.
Fully aligned with investor_verification_implementation_guide.md.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class EvidenceStrength(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class NeutralVerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    CONTRADICTED = "CONTRADICTED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    REQUIRES_HUMAN_REVIEW = "REQUIRES_HUMAN_REVIEW"


class SourceTier(str, Enum):
    TIER_1 = "TIER_1"  # Government / University (.gov, .edu, sebi, mca, rbi)
    TIER_2 = "TIER_2"  # Established Financial/Business Press (ET, Mint, TechCrunch, Inc42)
    TIER_3 = "TIER_3"  # Secondary Registries & Corporate Directories (ZaubaCorp, Tofler, Tracxn, Crunchbase)
    TIER_4 = "TIER_4"  # Generic Public Web & Social Media


class ClaimCategory(str, Enum):
    EMPLOYMENT = "EMPLOYMENT"
    ANGEL_SYNDICATE_INVESTMENT = "ANGEL_SYNDICATE_INVESTMENT"
    EDUCATION = "EDUCATION"
    REGULATORY_REGISTRATION = "REGULATORY_REGISTRATION"
    TRACK_RECORD_EXIT = "TRACK_RECORD_EXIT"


class ExtractedClaim(BaseModel):
    claim_id: str
    category: ClaimCategory
    claim_text: str
    entity_name: Optional[str] = None
    role_or_title: Optional[str] = None
    timeframe: Optional[str] = None
    claimed_amount_or_exit: Optional[str] = None
    anchors: list[str] = Field(default_factory=list)


class SearchQuery(BaseModel):
    query_id: str
    query_text: str
    cluster_category: ClaimCategory
    anchors_used: list[str] = Field(default_factory=list)


class SearchResult(BaseModel):
    query_id: str
    source_url: str
    title: str
    snippet: str
    search_engine: str = "Tavily"
    source_tier: SourceTier = SourceTier.TIER_4


class AdapterResult(BaseModel):
    adapter_name: str
    status: str
    details: str
    source_url: Optional[str] = None
    raw_data: Optional[dict[str, Any]] = None


class SourceCitation(BaseModel):
    name: str
    url: str
    tier: SourceTier
    excerpt: str


class InvestmentEvaluation(BaseModel):
    company_name: str
    claimed_amount: Optional[str] = None
    final_status: NeutralVerificationStatus
    evidence_summary: str
    sources: list[SourceCitation] = Field(default_factory=list)
    notes: str


class ClaimVerification(BaseModel):
    claim_id: str
    category: ClaimCategory
    claim_text: str
    status: NeutralVerificationStatus
    evidence_strength: EvidenceStrength
    corroborating_sources: list[str] = Field(default_factory=list)
    source_citations: list[SourceCitation] = Field(default_factory=list)
    contradiction_notes: Optional[str] = None
    verification_notes: str


class ContradictionFlag(BaseModel):
    flag_type: str  # TIMELINE_MISMATCH | ROLE_INCONSISTENCY
    severity: str  # HIGH | MEDIUM | LOW
    claim_text: str
    evidence_excerpt: str
    reasoning: str


class IdentityResolution(BaseModel):
    identity_confidence: str  # HIGH | MEDIUM | AMBIGUOUS
    homonym_collision_risk: str  # HIGH | LOW
    distinct_public_hosts: list[str] = Field(default_factory=list)
    anchor_notes: list[str] = Field(default_factory=list)


class RegulatoryCheck(BaseModel):
    authority: str  # MCA, SEBI, RBI, IBBI
    status: str
    badge_label: str
    summary: str
    detail_reason: str
    source_url: Optional[str] = None


class OverallAssessment(BaseModel):
    verdict: str
    identity_confidence: str
    evidence_coverage_pct: float
    strongly_corroborated: list[str] = Field(default_factory=list)
    requires_verification: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)


class AgentActivityStep(BaseModel):
    timestamp: str
    agent_name: str
    action: str
    detail: str


class DueDiligenceReport(BaseModel):
    investor_name: str
    claimed_organization: Optional[str] = None
    claimed_designation: Optional[str] = None
    investor_type: Optional[str] = "ANGEL_INVESTOR"
    investigation_timestamp: str
    total_claims: int = 0
    verified_count: int = 0
    partially_verified_count: int = 0
    unverified_count: int = 0
    contradicted_count: int = 0
    requires_review_count: int = 0
    overall_evidence_strength: EvidenceStrength
    overall_status: NeutralVerificationStatus
    overall_assessment: OverallAssessment
    identity_resolution: IdentityResolution
    regulatory_checks: list[RegulatoryCheck] = Field(default_factory=list)
    investment_evaluations: list[InvestmentEvaluation] = Field(default_factory=list)
    verifications: list[ClaimVerification] = Field(default_factory=list)
    contradictions: list[ContradictionFlag] = Field(default_factory=list)
    activity_trace: list[AgentActivityStep] = Field(default_factory=list)
    disclaimer: str = (
        "This report summarizes publicly available evidence. It does not guarantee identity, "
        "financial capacity, credibility, intentions, or future conduct. This PoC is not legal, "
        "investment, or compliance advice. It is designed to reduce defamation risk by refusing "
        "fraud/legitimacy labels and by separating missing public evidence from false claims."
    )

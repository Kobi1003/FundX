"""
Investor Due-Diligence Engine Execution Workflow.
Orchestrates PII Sanitization, Profile Extraction, Investigation Planning, Web Research,
Registry Adapters (MCA, SEBI, RBI, IBBI), Identity Resolution, Contradiction Detection, Claim Verification, and Master Report Synthesis.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .adapters.ibbi_adapter import IBBIAdapter
from .adapters.mca_adapter import MCAAdapter
from .adapters.rbi_adapter import RBIAdapter
from .adapters.sebi_adapter import SEBIAdapter

from .agents.claim_verifier import ClaimVerifier
from .agents.contradiction_agent import ContradictionAgent
from .agents.identity_resolution_agent import IdentityResolutionAgent
from .agents.investigation_planner_agent import InvestigationPlannerAgent
from .agents.profile_extraction_agent import ProfileExtractionAgent
from .agents.report_agent import ReportAgent
from .agents.research_agent import ResearchAgent

from .pii_sanitizer import extract_and_sanitize_cv
from .schemas import AgentActivityStep, DueDiligenceReport


class InvestorDueDiligenceWorkflow:
    def __init__(self):
        self.profile_agent = ProfileExtractionAgent()
        self.planner_agent = InvestigationPlannerAgent()
        self.research_agent = ResearchAgent()
        self.identity_agent = IdentityResolutionAgent()
        self.contradiction_agent = ContradictionAgent()
        self.verifier_agent = ClaimVerifier()
        self.report_agent = ReportAgent()

        self.mca_adapter = MCAAdapter()
        self.sebi_adapter = SEBIAdapter()
        self.rbi_adapter = RBIAdapter()
        self.ibbi_adapter = IBBIAdapter()

    async def run(
        self,
        investor_name: str,
        organization: str | None = None,
        designation: str | None = None,
        bio: str | None = None,
        cv_text: str | None = None,
        cv_bytes: bytes | None = None,
        cv_filename: str | None = None,
    ) -> DueDiligenceReport:
        activity_trace: list[AgentActivityStep] = []

        def log_step(agent: str, action: str, detail: str):
            activity_trace.append(
                AgentActivityStep(
                    timestamp=datetime.utcnow().isoformat() + "Z",
                    agent_name=agent,
                    action=action,
                    detail=detail,
                )
            )

        # 1. DPDP PII Sanitization
        log_step("PIISanitizer", "Sanitize Profile & CV", "Redacting Aadhaar, PAN, personal phone numbers, and address lines.")
        sanitized_text, redaction_counts = extract_and_sanitize_cv(cv_bytes, cv_filename, cv_text or bio)
        log_step(
            "PIISanitizer",
            "Sanitization Complete",
            f"Redacted {redaction_counts['aadhaar']} Aadhaar, {redaction_counts['pan']} PAN, {redaction_counts['phone']} phone, and {redaction_counts['address_lines']} address lines.",
        )

        # 2. Extract Claims
        log_step("ProfileExtractionAgent", "Extract Claims", f"Parsing claims for {investor_name} ({organization or 'Independent'}).")
        claims = self.profile_agent.extract_claims(investor_name, organization, designation, bio, sanitized_text)
        log_step("ProfileExtractionAgent", "Claims Extracted", f"Identified {len(claims)} structured claims across employment, investments, education, and regulatory.")

        # 3. Investigation Planner
        log_step("InvestigationPlannerAgent", "Plan Search Queries", "Generating 6-10 clustered queries anchored with name, org, and alma mater.")
        search_queries = self.planner_agent.generate_investigation_plan(investor_name, organization, claims)
        log_step("InvestigationPlannerAgent", "Plan Ready", f"Generated {len(search_queries)} search queries for research execution.")

        # 4. Research Agent
        log_step("ResearchAgent", "Execute Web Research", "Querying web search engines (Tavily / Serper / DDG) with source classification tiering (TIER_1..TIER_4).")
        search_results = await self.research_agent.execute_search_plan(search_queries)
        log_step("ResearchAgent", "Research Complete", f"Retrieved {len(search_results)} public search results with URL provenance.")

        # 5. Registry Adapters (MCA, SEBI, RBI, IBBI)
        log_step("RegistryAgent", "Invoke Regulatory Adapters", "Executing checks against MCA, SEBI, RBI, and IBBI adapters.")
        reg_checks = []

        mca_check = await self.mca_adapter.verify_entity(organization)
        reg_checks.append(mca_check)

        combined_text = f"{sanitized_text} {' '.join([c.claim_text for c in claims])}"
        sebi_check = self.sebi_adapter.verify_entity(organization, combined_text)
        reg_checks.append(sebi_check)

        rbi_check = self.rbi_adapter.verify_entity(organization, combined_text)
        reg_checks.append(rbi_check)

        ibbi_check = self.ibbi_adapter.verify_entity(combined_text)
        reg_checks.append(ibbi_check)
        log_step("RegistryAgent", "Adapters Complete", f"Completed {len(reg_checks)} regulatory checks.")

        # 6. Identity Resolution & Homonym Scoring
        log_step("IdentityResolutionAgent", "Resolve Identity & Homonym Risk", "Evaluating homonym collision risk and identity confidence.")
        anchored_results, identity_res = self.identity_agent.resolve_identity(investor_name, organization, claims, search_results)
        log_step("IdentityResolutionAgent", "Resolution Complete", f"Identity confidence '{identity_res.identity_confidence}', Homonym Risk '{identity_res.homonym_collision_risk}'.")

        # 7. Contradiction Detection
        log_step("ContradictionAgent", "Detect Contradictions", "Scanning for timeline mismatches (>=3 yrs) and role inconsistencies.")
        contradictions = self.contradiction_agent.detect_contradictions(claims, anchored_results)
        log_step("ContradictionAgent", "Contradiction Scan Complete", f"Found {len(contradictions)} contradiction flags.")

        # 8. Claim Verification
        log_step("ClaimVerifier", "Verify Claims", "Matching claims against search evidence and registry results.")
        verifications = []
        for c in claims:
            ver = self.verifier_agent.verify_claim(c, anchored_results)
            verifications.append(ver)
        investment_evals = self.verifier_agent.build_investment_evaluations(verifications)
        log_step("ClaimVerifier", "Verification Complete", f"Verified {len(verifications)} claims with neutral status and evidence ratings.")

        # 9. Master Report Agent
        log_step("ReportAgent", "Compile Master Report", "Assembling final DueDiligenceReport with overall assessment verdict and legal disclaimer.")
        report = self.report_agent.compile_report(
            investor_name=investor_name,
            organization=organization,
            designation=designation,
            verifications=verifications,
            regulatory_checks=reg_checks,
            identity_res=identity_res,
            contradictions=contradictions,
            investment_evals=investment_evals,
            activity_trace=activity_trace,
        )
        log_step("ReportAgent", "Report Ready", f"Final report generated with verdict '{report.overall_assessment.verdict}'.")

        return report

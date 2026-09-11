"""
Investigation Planner Agent.
Generates 6-10 clustered queries anchored with Name + Organization + Alma Mater + Prior Employer
to avoid homonym confusion.
"""

from __future__ import annotations

import uuid
from ..schemas import ClaimCategory, ExtractedClaim, SearchQuery


class InvestigationPlannerAgent:
    def generate_investigation_plan(
        self,
        investor_name: str,
        organization: str | None,
        claims: list[ExtractedClaim],
    ) -> list[SearchQuery]:
        queries: list[SearchQuery] = []
        org_anchor = organization or ""

        # Find alma mater or prior employer anchors if present in claims
        alma_mater = ""
        prior_emp = ""
        for c in claims:
            if c.category == ClaimCategory.EDUCATION and not alma_mater:
                alma_mater = c.entity_name or c.claim_text
            elif c.category == ClaimCategory.EMPLOYMENT and not prior_emp and c.entity_name != organization:
                prior_emp = c.entity_name or ""

        # Cluster 1: Entity & Employment Anchor Queries (2 queries)
        q1 = f'"{investor_name}" "{org_anchor}" investor profile' if org_anchor else f'"{investor_name}" venture investor'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q1,
                cluster_category=ClaimCategory.EMPLOYMENT,
                anchors_used=[investor_name, org_anchor],
            )
        )

        q2 = f'"{investor_name}" "{org_anchor}" partner venture capital' if org_anchor else f'"{investor_name}" angel investment track record'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q2,
                cluster_category=ClaimCategory.EMPLOYMENT,
                anchors_used=[investor_name, org_anchor],
            )
        )

        # Cluster 2: Angel / Syndicate Investments & Portfolio (2-3 queries)
        q3 = f'"{investor_name}" angel investments portfolio startups'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q3,
                cluster_category=ClaimCategory.ANGEL_SYNDICATE_INVESTMENT,
                anchors_used=[investor_name],
            )
        )

        q4 = f'"{investor_name}" syndicate lead seed round funding'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q4,
                cluster_category=ClaimCategory.ANGEL_SYNDICATE_INVESTMENT,
                anchors_used=[investor_name],
            )
        )

        # Cluster 3: Exits & Track Record (2 queries)
        q5 = f'"{investor_name}" "{org_anchor}" exit acquisition unicorn'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q5,
                cluster_category=ClaimCategory.TRACK_RECORD_EXIT,
                anchors_used=[investor_name, org_anchor],
            )
        )

        # Cluster 4: Education & Prior Career Anchors (2 queries)
        if alma_mater:
            q6 = f'"{investor_name}" "{alma_mater}" alumni'
            queries.append(
                SearchQuery(
                    query_id=f"q-{uuid.uuid4().hex[:6]}",
                    query_text=q6,
                    cluster_category=ClaimCategory.EDUCATION,
                    anchors_used=[investor_name, alma_mater],
                )
            )
        else:
            queries.append(
                SearchQuery(
                    query_id=f"q-{uuid.uuid4().hex[:6]}",
                    query_text=f'"{investor_name}" education university degree',
                    cluster_category=ClaimCategory.EDUCATION,
                    anchors_used=[investor_name],
                )
            )

        # Cluster 5: Regulatory / Corporate Footprint (1-2 queries)
        q7 = f'"{investor_name}" "{org_anchor}" zaubacorp tofler corporate director'
        queries.append(
            SearchQuery(
                query_id=f"q-{uuid.uuid4().hex[:6]}",
                query_text=q7,
                cluster_category=ClaimCategory.REGULATORY_REGISTRATION,
                anchors_used=[investor_name, org_anchor],
            )
        )

        # Cap search budget between 6 and 10 queries
        return queries[:8]

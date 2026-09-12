"""Unit tests for thesis assumption mapping (no ADK required)."""

import unittest

from app.schemas.thesis_extract import (
    ThesisAssumptions,
    assumptions_from_payload,
    enrich_revenue_valuation,
    future_analysis_from_dicts,
    merge_assumption_dict,
    parse_json_object,
)
from app.simulation.simulator import run_scenarios


class ThesisExtractTests(unittest.TestCase):
    def test_to_simulation_request(self):
        a = ThesisAssumptions(current_mrr=400_000, current_customers=80, pricing=5_000, funding=25_000_000)
        req = a.to_simulation_request()
        self.assertEqual(req.current_mrr, 400_000)
        self.assertEqual(req.current_customers, 80)
        self.assertEqual(req.funding, 25_000_000)
        self.assertEqual(req.authoritative_mrr_basis, "reported_mrr")

    def test_assumptions_from_payload_metrics(self):
        a = assumptions_from_payload(
            {"industry": "FinTech", "amount": 1_000_000, "pitch": "PayFlow"},
            {"customers": 200, "pricing": 2500, "cac": 12_000},
        )
        self.assertEqual(a.industry, "FinTech")
        self.assertEqual(a.current_customers, 200)
        self.assertEqual(a.pricing, 2500)
        self.assertEqual(a.cac, 12_000)

    def test_merge_and_parse_json(self):
        base = ThesisAssumptions()
        merged = merge_assumption_dict(base, parse_json_object('{"current_mrr": 500000, "churn": 0.04}'))
        self.assertEqual(merged.current_mrr, 500_000)
        self.assertEqual(merged.churn, 0.04)

    def test_enrich_revenue_from_scenarios(self):
        a = ThesisAssumptions(current_mrr=5_000_000, current_customers=1000, pricing=5000, funding=30_000_000, months=12)
        scenarios = run_scenarios(a.to_simulation_request())["scenarios"]
        fa = enrich_revenue_valuation(future_analysis_from_dicts(), scenarios, a.valuation_multiple)
        self.assertIsNotNone(fa.revenue_valuation.base_arr)
        self.assertGreater(fa.revenue_valuation.base_arr, 0)
        self.assertIsNotNone(fa.revenue_valuation.implied_valuation)


if __name__ == "__main__":
    unittest.main()

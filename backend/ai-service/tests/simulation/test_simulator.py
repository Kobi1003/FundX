import unittest

from app.schemas.requests import SimulationRequest
from app.simulation.assumptions import BULL, BASE, BEAR
from app.simulation.scenarios import apply_scenario
from app.simulation.sensitivity import run_sensitivity
from app.simulation.simulator import run_scenarios, run_single
from app.simulation.valuation_model import funding_valuation


class FinancialSimulationEngineTests(unittest.TestCase):

    def test_canonical_50l_mrr_case(self):
        """Test the canonical Section 36 benchmark case."""
        req = SimulationRequest(
            company_name="FinFlow Tech",
            current_mrr=5_000_000,
            funding=30_000_000,
            current_customers=1000,
            pricing=5000,
            cac=30_000,
            marketing_spend=1_000_000,
            growth_rate=0.40,
            churn=0.03,
            starting_gross_margin=0.75,
            operating_expenses=2_000_000,
            months=24,
        )

        # 1. Verify Month 0 Invariant
        consistency = req.check_month0_consistency()
        self.assertTrue(consistency["is_consistent"])
        self.assertEqual(consistency["implied_mrr"], 5_000_000)

        # 2. Run simulation
        result = run_scenarios(req)
        base = result["scenarios"]["base"]
        forecast = base["monthly_forecast"]

        # 3. Verify Month 1 Exact Values
        m1 = forecast[0]
        self.assertEqual(m1["starting_customers"], 1000.0)
        self.assertAlmostEqual(m1["new_customers"], 33.33, places=2)
        self.assertAlmostEqual(m1["churned_customers"], 30.0, places=2)
        self.assertAlmostEqual(m1["ending_customers"], 1003.33, places=2)
        self.assertEqual(m1["arpu"], 5000.0)
        self.assertAlmostEqual(m1["mrr"], 5_016_666.67, places=1)
        self.assertAlmostEqual(m1["arr"], 60_200_000.0, places=0)
        self.assertAlmostEqual(m1["gross_profit"], 3_762_500.0, places=1)
        self.assertAlmostEqual(m1["operating_expenses"], 3_000_000.0, places=1)
        self.assertAlmostEqual(m1["operating_profit"], 762_500.0, places=1)
        self.assertAlmostEqual(m1["ending_cash"], 30_762_500.0, places=1)

        # 4. Verify Break-Even and Runway
        self.assertEqual(base["break_even_month"], 0)
        self.assertIsNone(base["cash_out_month"])
        self.assertEqual(base["additional_capital_required"], 0.0)

        # 5. Verify Bull > Base > Bear for Ending ARR
        bull = result["scenarios"]["bull"]
        bear = result["scenarios"]["bear"]
        self.assertGreater(bull["ending_arr"], base["ending_arr"])
        self.assertGreater(base["ending_arr"], bear["ending_arr"])

        # 6. Verify identical Month 0 starting cash and ARR across scenarios
        self.assertEqual(bull["starting_cash"], 30_000_000)
        self.assertEqual(base["starting_cash"], 30_000_000)
        self.assertEqual(bear["starting_cash"], 30_000_000)

    def test_inconsistency_detection(self):
        """Test that Customers * ARPU != MRR triggers critical discrepancy warning."""
        # 1000 customers * 50,000 ARPU = 50,000,000 (5Cr), but reported MRR is 50L
        req = SimulationRequest(
            current_mrr=5_000_000,
            current_customers=1000,
            pricing=50_000,
            funding=30_000_000,
        )
        consistency = req.check_month0_consistency()
        self.assertFalse(consistency["is_consistent"])
        self.assertEqual(consistency["severity"], "CRITICAL")
        self.assertEqual(consistency["implied_mrr"], 50_000_000)
        self.assertEqual(consistency["reported_mrr"], 5_000_000)
        self.assertGreater(consistency["discrepancy_pct"], 80.0)

    def test_hiring_and_funding_inflow(self):
        request = SimulationRequest(
            current_revenue=0,
            current_customers=10,
            pricing=100,
            funding=1000,
            operating_expenses=100,
            months=3,
            hiring_plan=[{"role": "Engineer", "monthly_salary": 50, "hiring_month": 2}],
            funding_round={"investment_amount": 500, "equity_percentage": 0.1, "investment_month": 2},
        )
        base = run_scenarios(request)["scenarios"]["base"]["monthly_forecast"]
        self.assertEqual(base[1]["financing_inflow"], 500)
        self.assertGreater(base[1]["operating_expenses"], base[0]["operating_expenses"])

    def test_zero_churn_ltv_is_capped(self):
        request = SimulationRequest(
            current_revenue=1000,
            current_customers=10,
            pricing=100,
            cac=10,
            churn=0,
            marketing_spend=10,
            months=1,
            max_lifetime_months=24,
        )
        self.assertEqual(run_scenarios(request)["scenarios"]["base"]["ltv"], 1680)

    def test_historical_volatility_scenario_derivation(self):
        req = SimulationRequest(
            current_revenue=5_000_000,
            current_customers=1000,
            pricing=5000,
            cac=30_000,
            churn=0.03,
            marketing_spend=1_000_000,
            funding=30_000_000,
            operating_expenses=2_000_000,
            months=12,
            historical_cac=[28000.0, 30000.0, 32000.0],
            historical_churn_rates=[0.025, 0.030, 0.035],
            historical_growth_rates=[0.08, 0.10, 0.12],
        )
        bull_req = apply_scenario(req, BULL)
        base_req = apply_scenario(req, BASE)
        bear_req = apply_scenario(req, BEAR)

        # CAC: lower is better -> Bull = mean - std = 28000, Bear = mean + std = 32000
        self.assertAlmostEqual(bull_req.cac, 28000.0)
        self.assertAlmostEqual(base_req.cac, 30000.0)
        self.assertAlmostEqual(bear_req.cac, 32000.0)

        # Churn: lower is better -> Bull = mean - std = 0.025, Bear = mean + std = 0.035
        self.assertAlmostEqual(bull_req.churn, 0.025)
        self.assertAlmostEqual(base_req.churn, 0.030)
        self.assertAlmostEqual(bear_req.churn, 0.035)

    def test_sensitivity_analysis_ranking(self):
        req = SimulationRequest(
            current_mrr=5_000_000,
            current_customers=1000,
            pricing=5000,
            cac=30_000,
            marketing_spend=1_000_000,
            funding=30_000_000,
            operating_expenses=2_000_000,
            churn=0.03,
            starting_gross_margin=0.75,
            months=12,
        )
        sensitivity = run_sensitivity(req, change=0.10)
        self.assertTrue(len(sensitivity) > 0)
        # Ensure ranked in descending order of absolute ending cash impact
        for i in range(len(sensitivity) - 1):
            self.assertGreaterEqual(
                abs(sensitivity[i]["impact_on_ending_cash"]),
                abs(sensitivity[i + 1]["impact_on_ending_cash"]),
            )


if __name__ == "__main__":
    unittest.main()

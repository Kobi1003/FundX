import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://localhost:8000"

def request(method, path, body=None, headers=None):
    url = f"{BASE_URL}{path}"
    headers = headers or {}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read().decode("utf-8", errors="replace")
            parsed = None
            if "application/json" in content_type:
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = raw
            else:
                parsed = raw
            return {
                "status_code": resp.status,
                "ok": True,
                "data": parsed,
                "error": None
            }
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return {
            "status_code": e.code,
            "ok": False,
            "data": parsed,
            "error": str(e)
        }
    except Exception as e:
        return {
            "status_code": 0,
            "ok": False,
            "data": None,
            "error": str(e)
        }

def run_exhaustive_suite():
    tests = [
        # --- 1. System Health & Connectivity ---
        ("GET", "/health", None, "Gateway Health & All Downstreams"),
        ("GET", "/", None, "Gateway Root"),

        # --- 2. User Service ---
        ("GET", "/api/users/profile", None, "Get Default Profile"),
        ("GET", "/api/users/list", None, "List Users"),
        ("POST", "/api/users/login", {"email": "founder@aerogrid.io", "password": "password123"}, "User Login"),
        ("POST", "/api/users/register", {
            "name": "E2E Test Founder",
            "email": f"e2e_founder_{int(time.time())}@fundx.ai",
            "password": "password123",
            "role": "startup",
            "industry": "CleanTech"
        }, "User Registration"),

        # --- 3. Startup Service ---
        ("GET", "/api/startups", None, "List Startups"),
        ("GET", "/api/startups/startup-aerogrid", None, "Get Startup By ID (AeroGrid)"),
        ("GET", "/api/startups/startup-aerogrid/documents", None, "List Startup Documents"),
        ("PUT", "/api/startups/startup-aerogrid", {
            "tagline": "AI-orchestrated autonomous renewable micro-grids"
        }, "Update Startup"),
        ("POST", "/api/startups/startup-aerogrid/verify", None, "Trigger Startup Verification"),

        # --- 4. Investor Service ---
        ("GET", "/api/investors", None, "List Investors"),
        ("GET", "/api/investors/investor-elena", None, "Get Investor By ID (Elena)"),
        ("GET", "/api/investors/investor-elena/preferences", None, "Get Investor Preferences"),
        ("PUT", "/api/investors/investor-elena/preferences", {
            "check_size_min": 300000,
            "check_size_max": 2500000
        }, "Update Investor Preferences"),
        ("POST", "/api/investors/investor-elena/verify", None, "Verify Investor"),
        ("POST", "/api/investors/investor-elena/upload-cv", {
            "filename": "Elena_Rostova_Updated_CV.pdf",
            "cv_text": "Managing Partner at Apex Horizon Capital. 12+ years experience in venture investments."
        }, "Upload Investor CV"),

        # --- 5. Deal & Negotiation Service ---
        ("GET", "/api/deals", None, "List Marketplace Deals"),
        ("GET", "/api/deals/deal-aerogrid", None, "Get Deal By ID (deal-aerogrid)"),
        ("GET", "/api/deals/deal-aerogrid/negotiation-tree", None, "Get Negotiation Tree"),
        ("PUT", "/api/deals/deal-aerogrid", {
            "pitch": "AI-orchestrated autonomous renewable energy grids for commercial microgrids"
        }, "Update Deal"),
        ("POST", "/api/deals/deal-aerogrid/interest", {
            "investor_id": "investor-elena",
            "investor_name": "Elena Rostova"
        }, "Express Investor Interest"),
        ("POST", "/api/deals/deal-aerogrid/offers", {
            "investor_id": "investor-elena",
            "investor_name": "Elena Rostova (Apex Horizon)",
            "sender_type": "investor",
            "amount": 850000,
            "equity_pct": 7.5,
            "royalty_pct": 2.0,
            "message": "We can offer $850k with 7.5% equity."
        }, "Create Negotiation Offer"),

        # --- 6. Deal Rooms ---
        ("GET", "/api/deal-rooms/room-aerogrid", None, "Get Deal Room"),
        ("GET", "/api/deal-rooms/room-aerogrid/messages", None, "List Deal Room Messages"),
        ("POST", "/api/deal-rooms/room-aerogrid/messages", {
            "sender_id": "investor-elena",
            "sender_name": "Elena Rostova",
            "body": "Hi team, term sheet draft looks great!"
        }, "Post Message in Deal Room"),

        # --- 7. AI Workflows ---
        ("GET", "/api/ai/demo/sample", None, "AI Demo Sample"),
        ("POST", "/api/ai/analyze-thesis", {
            "thesis": "Distributed renewable microgrids reduce transmission curtailment by 40% using edge AI frequency prediction.",
            "stage": "Seed",
            "industries": ["CleanTech", "AI"]
        }, "AI Analyze Thesis"),
        ("POST", "/api/ai/verify/startup", {
            "startup_id": "startup-aerogrid",
            "gst_number": "27AABCA1234F1Z8",
            "incorporation_cert": "AEROGRID_INCORPORATION_ROC_2024.pdf"
        }, "AI Verify Startup"),
        ("POST", "/api/ai/verify/investor", {
            "investor_id": "investor-elena",
            "cv_filename": "ELENA_ROSTOVA_CV_2026.pdf"
        }, "AI Verify Investor"),
        ("POST", "/api/ai/startup-analysis", {
            "startup": {
                "name": "AeroGrid Tech",
                "industry": "CleanTech",
                "stage": "Seed",
                "thesis": "Grid edge optimization",
                "metrics": {
                    "market_size": 12000000000,
                    "growth_rate": 0.35,
                    "cac": 420,
                    "churn": 0.04,
                    "customers": 180,
                    "revenue": 540000,
                    "operating_cost": 320000
                }
            }
        }, "AI Run Startup Analysis"),
        ("POST", "/api/ai/simulate", {
            "startup": {
                "name": "AeroGrid Tech",
                "industry": "CleanTech",
                "stage": "Seed",
                "metrics": {
                    "market_size": 12000000000,
                    "growth_rate": 0.35,
                    "cac": 420,
                    "churn": 0.04,
                    "customers": 180,
                    "revenue": 540000,
                    "operating_cost": 320000
                }
            },
            "deal_terms": {
                "investment_amount": 750000,
                "equity_percentage": 7.0,
                "royalty_percentage": 2.5,
                "royalty_cap_multiple": 2.0
            }
        }, "AI Financial Simulation"),
    ]

    print(f"{'#':<3} | {'METHOD':<6} | {'ENDPOINT PATH':<45} | {'STATUS':<6} | {'RESULT':<6} | {'FEATURE / DESCRIPTION'}")
    print("=" * 110)

    passed = 0
    failed = 0
    results = []

    for i, (method, path, body, desc) in enumerate(tests, 1):
        res = request(method, path, body)
        is_ok = res["ok"]
        if is_ok:
            passed += 1
            res_str = "PASS"
        else:
            failed += 1
            res_str = "FAIL"
            
        print(f"{i:<3} | {method:<6} | {path:<45} | {res['status_code']:<6} | {res_str:<6} | {desc}")
        if not is_ok:
            print(f"    --> Error Detail: {res['error']} | Body: {res['data']}")

        results.append({
            "step": i,
            "method": method,
            "path": path,
            "desc": desc,
            "status": res["status_code"],
            "ok": is_ok,
            "data": res["data"]
        })

    print("=" * 110)
    print(f"Summary: Total Tests: {len(tests)} | Passed: {passed} | Failed: {failed}")
    return results

if __name__ == "__main__":
    run_exhaustive_suite()

#!/usr/bin/env python3
"""
AI Investment Arena — Demo Dataset Seeder

Seeds:
- 3 Startups (NovaGrid Energy, HealthPulse AI, AgroLogix) with claims, metrics, thesis
- 5 Investors (Asha Rao, Marcus Chen, Elena Rostova, Vikram Malhotra, Sarah Jenkins) with preferences
- Deals, deal interests, deal rooms, and sample offers
- Neo4j graph nodes and relationships (if Neo4j is available)

Usage:
  python scripts/seed_demo_data.py [--gateway http://localhost:8000] [--neo4j bolt://localhost:7687]
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

STARTUPS = [
    {
        "id": "33333333-3333-3333-3333-333333333301",
        "name": "NovaGrid Energy",
        "tagline": "Intelligent B2B Microgrid & Battery Energy Arbitrage",
        "description": "NovaGrid deploys edge-AI controllers to reduce commercial facility power costs by 32% via dynamic battery dispatch and peak shaving.",
        "industry": "CleanTech",
        "stage": "Seed",
        "thesis": "Commercial solar + storage is economically constrained by passive battery management; predictive optimization unlocks 3x ROI.",
        "documents": [
            {"filename": "novagrid_executive_summary.pdf", "doc_type": "pitch_deck"},
            {"filename": "novagrid_pilots_q3_telemetry.csv", "doc_type": "traction_proof"},
            {"filename": "novagrid_financial_model_v2.xlsx", "doc_type": "financial_model"},
        ],
        "claims": [
            "Achieved 32% reduction in peak commercial power bills across 8 commercial sites",
            "Target TAM in commercial real estate microgrids is $14.2B with 24% CAGR",
            "Customer payback period validated at 10.5 months under standard utility tariffs",
        ],
    },
    {
        "id": "33333333-3333-3333-3333-333333333302",
        "name": "HealthPulse AI",
        "tagline": "Autonomous ICU Clinical Workflow & Deterioration Triage",
        "description": "HealthPulse synthesizes multivariable hospital telemetry to alert intensivists of septic shock up to 4 hours prior to clinical onset.",
        "industry": "HealthTech",
        "stage": "Pre-Seed",
        "thesis": "ICU nurse fatigue and delayed triage cost thousands of lives annually; sensor-fusion AI predicts acute decompensation with 94% specificity.",
        "documents": [
            {"filename": "healthpulse_clinical_trial_summary.pdf", "doc_type": "clinical_data"},
            {"filename": "healthpulse_irb_approval.pdf", "doc_type": "regulatory"},
        ],
        "claims": [
            "94% specificity for 4-hour advance septic shock notification in retrospective ICU validation",
            "Reduces false-positive monitor alarms by 68%",
        ],
    },
    {
        "id": "33333333-3333-3333-3333-333333333303",
        "name": "AgroLogix",
        "tagline": "Cold-Chain Traceability & Direct B2B Fresh Produce Exchange",
        "description": "AgroLogix connects rural farmer aggregators directly to urban supermarket chains using active spoilage-sensing IoT tags and guaranteed buybacks.",
        "industry": "AgriTech",
        "stage": "Seed",
        "thesis": "Post-harvest loss in fresh perishables exceeds 30% due to broken cold chains; smart real-time routing preserves freshness and margins.",
        "documents": [
            {"filename": "agrologix_pitch_deck.pdf", "doc_type": "pitch_deck"},
            {"filename": "agrologix_fpo_contracts.pdf", "doc_type": "contracts"},
        ],
        "claims": [
            "Reduces transit produce spoilage from 28% down to 5.2%",
            "Over $1.25M GMV transacted across 310 participating farmer cooperatives",
        ],
    },
]

INVESTORS = [
    {
        "id": "44444444-4444-4444-4444-444444444401",
        "display_name": "Asha Rao",
        "firm": "Horizon Ventures",
        "bio": "Partner leading sustainability, energy transition, and hardware-enabled software investments across South & Southeast Asia.",
        "thesis": "Backing capital-efficient climate infrastructure and intelligent energy decarbonization software.",
        "preferences": {
            "industries": ["CleanTech", "Industrial", "DeepTech"],
            "stages": ["Seed", "Series A"],
            "check_size_min": 300000,
            "check_size_max": 1500000,
            "geographies": ["Asia", "Global"],
            "notes": "Look for verified pilot revenue and defensible edge algorithms.",
        },
    },
    {
        "id": "44444444-4444-4444-4444-444444444402",
        "display_name": "Marcus Chen",
        "firm": "Apex Capital",
        "bio": "Managing Director investing in enterprise B2B SaaS, AI infrastructure, and autonomous control platforms.",
        "thesis": "High conviction in domain-specific AI workflows with deterministic execution guardrails.",
        "preferences": {
            "industries": ["CleanTech", "DeepTech", "B2B SaaS"],
            "stages": ["Pre-Seed", "Seed"],
            "check_size_min": 250000,
            "check_size_max": 1000000,
            "geographies": ["North America", "Global"],
            "notes": "Strong founder technical backgrounds required.",
        },
    },
    {
        "id": "44444444-4444-4444-4444-444444444403",
        "display_name": "Elena Rostova",
        "firm": "Nordic Seed Fund",
        "bio": "Principal specializing in regulated digital health, clinical triage algorithms, and medtech hardware.",
        "thesis": "Empowering overburdened hospital clinical staff through high-trust AI assistive diagnostics.",
        "preferences": {
            "industries": ["HealthTech", "BioTech"],
            "stages": ["Pre-Seed", "Seed"],
            "check_size_min": 200000,
            "check_size_max": 800000,
            "geographies": ["Europe", "Global"],
            "notes": "Must have retrospective or prospective clinical validation.",
        },
    },
    {
        "id": "44444444-4444-4444-4444-444444444404",
        "display_name": "Vikram Malhotra",
        "firm": "Blue Ocean Angels",
        "bio": "Serial entrepreneur turned angel syndicate lead with 25+ early-stage supply chain and B2B marketplace exits.",
        "thesis": "Hyper-focused on margin-expanding supply chain logistics with proven unit economics.",
        "preferences": {
            "industries": ["AgriTech", "Logistics", "Marketplace"],
            "stages": ["Seed"],
            "check_size_min": 150000,
            "check_size_max": 750000,
            "geographies": ["India", "Southeast Asia"],
            "notes": "Demonstrated positive unit contribution margins per transaction.",
        },
    },
    {
        "id": "44444444-4444-4444-4444-444444444405",
        "display_name": "Sarah Jenkins",
        "firm": "Catalyst Seed Fund",
        "bio": "Early-stage partner backing resilient founders tackling global infrastructure bottlenecks.",
        "thesis": "Seed stage syndicate participant backing high-conviction pre-Series A rounds.",
        "preferences": {
            "industries": ["CleanTech", "AgriTech", "SaaS"],
            "stages": ["Pre-Seed", "Seed"],
            "check_size_min": 100000,
            "check_size_max": 500000,
            "geographies": ["Global"],
            "notes": "Collaborative co-investor across cross-border syndicates.",
        },
    },
]


def make_request(url: str, method: str = "GET", data: dict = None):
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            detail = err.read().decode("utf-8")
        except Exception:
            detail = str(err)
        print(f"  [HTTP {err.code}] {url} -> {detail}")
        return None
    except Exception as exc:
        print(f"  [Error] {url} -> {exc}")
        return None


def seed_http(gateway_url: str):
    print(f"--- Seeding Services via API Gateway ({gateway_url}) ---")

    # Verify Gateway health
    health = make_request(f"{gateway_url}/health")
    if not health:
        print("Warning: API Gateway is not responding yet. Ensure Docker containers are running.")
        return

    print(f"API Gateway status: {health.get('status', 'unknown')}")

    # Seed Startups
    startup_ids = []
    for s in STARTUPS:
        payload = {
            "name": s["name"],
            "tagline": s["tagline"],
            "description": s["description"],
            "industry": s["industry"],
            "stage": s["stage"],
            "thesis": s["thesis"],
        }
        res = make_request(f"{gateway_url}/api/startups", method="POST", data=payload)
        if res and "id" in res:
            sid = res["id"]
            startup_ids.append(sid)
            print(f"  + Created Startup: {s['name']} (ID: {sid})")

            # Add documents
            for doc in s.get("documents", []):
                make_request(f"{gateway_url}/api/startups/{sid}/documents", method="POST", data=doc)
        else:
            print(f"  - Failed creating startup: {s['name']}")

    # Seed Investors
    investor_ids = []
    for inv in INVESTORS:
        payload = {
            "display_name": inv["display_name"],
            "firm": inv["firm"],
            "bio": inv["bio"],
            "thesis": inv["thesis"],
        }
        res = make_request(f"{gateway_url}/api/investors", method="POST", data=payload)
        if res and "id" in res:
            iid = res["id"]
            investor_ids.append(iid)
            print(f"  + Created Investor: {inv['display_name']} (ID: {iid})")

            # Update preferences
            if "preferences" in inv:
                make_request(f"{gateway_url}/api/investors/{iid}/preferences", method="PUT", data=inv["preferences"])
        else:
            print(f"  - Failed creating investor: {inv['display_name']}")

    # Seed Deals
    if startup_ids:
        deals_to_create = [
            {"startup_id": startup_ids[0], "title": "NovaGrid Energy - Seed Round", "target_raise": 1200000},
        ]
        if len(startup_ids) > 1:
            deals_to_create.append({"startup_id": startup_ids[1], "title": "HealthPulse AI - Pre-Seed Syndicate", "target_raise": 600000})
        if len(startup_ids) > 2:
            deals_to_create.append({"startup_id": startup_ids[2], "title": "AgroLogix - Seed Acceleration Round", "target_raise": 1500000})

        for d in deals_to_create:
            deal_res = make_request(f"{gateway_url}/api/deals", method="POST", data=d)
            if deal_res and "id" in deal_res:
                did = deal_res["id"]
                print(f"  + Created Deal: {d['title']} (ID: {did})")

                # If we have investors, express interest and create a deal room
                if investor_ids:
                    make_request(f"{gateway_url}/api/deals/{did}/interest", method="POST", data={"investor_id": investor_ids[0], "status": "interested"})
                    room_res = make_request(f"{gateway_url}/api/deal-rooms", method="POST", data={
                        "deal_id": did,
                        "name": f"Deal Room - {d['title']}",
                        "participant_ids": [investor_ids[0]],
                    })
                    if room_res and "id" in room_res:
                        rid = room_res["id"]
                        make_request(f"{gateway_url}/api/deal-rooms/{rid}/messages", method="POST", data={
                            "sender_id": investor_ids[0],
                            "body": "Hi, we reviewed your telemetry pilot logs and are interested in discussing terms.",
                        })
                        make_request(f"{gateway_url}/api/deal-rooms/{rid}/offers", method="POST", data={
                            "investor_id": investor_ids[0],
                            "amount": 500000,
                            "equity_pct": 10.0,
                            "terms": {"board_seat": True, "pro_rata": True},
                        })

    print("\n[SUCCESS] Demo seed dataset successfully dispatched to API Gateway!")


def seed_neo4j(uri: str, user: str = "neo4j", password: str = "fundx_neo4j_password"):
    try:
        from neo4j import GraphDatabase
        print(f"\n--- Seeding Neo4j Graph Database ({uri}) ---")
        cypher_file = os.path.join(os.path.dirname(__file__), "..", "database", "neo4j", "seed", "seed.cypher")
        if not os.path.exists(cypher_file):
            cypher_file = os.path.join(os.path.dirname(__file__), "..", "backend", "shared", "neo4j", "seed.cypher")
        if not os.path.exists(cypher_file):
            print("  Cypher seed file not found, skipping Neo4j seeding.")
            return

        with open(cypher_file, "r", encoding="utf-8") as f:
            statements = [s.strip() for s in f.read().split(";") if s.strip()]

        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session() as session:
            for stmt in statements:
                if stmt.startswith("//"):
                    continue
                session.run(stmt)
        driver.close()
        print("[SUCCESS] Neo4j graph nodes & relationships seeded successfully!")
    except ImportError:
        print("  Notice: `neo4j` Python driver not installed in host python; skipping direct Neo4j seed.")
    except Exception as exc:
        print(f"  Notice: Could not connect to Neo4j on {uri}: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Seed AI Investment Arena Demo Data")
    parser.add_argument("--gateway", default="http://localhost:8000", help="API Gateway URL")
    parser.add_argument("--neo4j", default="bolt://localhost:7687", help="Neo4j URI")
    parser.add_argument("--neo4j-user", default="neo4j", help="Neo4j username")
    parser.add_argument("--neo4j-password", default="fundx_neo4j_password", help="Neo4j password")
    args = parser.parse_args()

    seed_http(args.gateway)
    seed_neo4j(args.neo4j, args.neo4j_user, args.neo4j_password)


if __name__ == "__main__":
    main()

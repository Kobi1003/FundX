// =============================================================================
// Neo4j Relationship Graph Seed Data
// Startup, Investor, Industry, Market, Claim, Evidence, Competitor nodes & edges
// =============================================================================

// Industries
MERGE (iCleanTech:Industry {name: 'CleanTech'})
MERGE (iHealthTech:Industry {name: 'HealthTech'})
MERGE (iAgriTech:Industry {name: 'AgriTech'})
MERGE (iDeepTech:Industry {name: 'DeepTech'})

// Markets
MERGE (mMicrogrid:Market {name: 'Commercial Energy Storage SaaS', tam_usd: 14200000000})
MERGE (mICU:Market {name: 'ICU Telemetry & Clinical AI', tam_usd: 8900000000})
MERGE (mColdChain:Market {name: 'Fresh Agri Cold-Chain Logistics', tam_usd: 21000000000})

// Startups
MERGE (s1:Startup {id: '33333333-3333-3333-3333-333333333301', name: 'NovaGrid Energy', stage: 'Seed'})
MERGE (s2:Startup {id: '33333333-3333-3333-3333-333333333302', name: 'HealthPulse AI', stage: 'Pre-Seed'})
MERGE (s3:Startup {id: '33333333-3333-3333-3333-333333333303', name: 'AgroLogix', stage: 'Seed'})

// Competitors
MERGE (comp1:Startup {id: 'comp-stem-energy', name: 'Stem Inc (Public)', stage: 'Public'})
MERGE (comp2:Startup {id: 'comp-clean-spark', name: 'CleanSpark', stage: 'Public'})
MERGE (comp3:Startup {id: 'comp-epic-ai', name: 'Epic Systems Cognitive Suite', stage: 'Enterprise'})

// Startup relationships
MERGE (s1)-[:OPERATES_IN]->(iCleanTech)
MERGE (s1)-[:TARGETS]->(mMicrogrid)
MERGE (s1)-[:COMPETES_WITH]->(comp1)
MERGE (s1)-[:COMPETES_WITH]->(comp2)

MERGE (s2)-[:OPERATES_IN]->(iHealthTech)
MERGE (s2)-[:TARGETS]->(mICU)
MERGE (s2)-[:COMPETES_WITH]->(comp3)

MERGE (s3)-[:OPERATES_IN]->(iAgriTech)
MERGE (s3)-[:TARGETS]->(mColdChain)

// Claims & Evidence for NovaGrid
MERGE (c1:Claim {id: 'claim-1', text: '32% reduction in peak commercial power bills'})
MERGE (c2:Claim {id: 'claim-2', text: 'Target TAM is $14.2B with 24% CAGR'})
MERGE (e1:Evidence {id: 'ev-1', text: '8 commercial pilot telemetry logs verified'})
MERGE (e2:Evidence {id: 'ev-2', text: 'BNEF Energy Storage Market Outlook 2025'})

MERGE (s1)-[:MAKES_CLAIM]->(c1)
MERGE (s1)-[:MAKES_CLAIM]->(c2)
MERGE (c1)-[:SUPPORTED_BY]->(e1)
MERGE (c2)-[:SUPPORTED_BY]->(e2)

// Investors
MERGE (inv1:Investor {id: '44444444-4444-4444-4444-444444444401', name: 'Asha Rao', firm: 'Horizon Ventures'})
MERGE (inv2:Investor {id: '44444444-4444-4444-4444-444444444402', name: 'Marcus Chen', firm: 'Apex Capital'})
MERGE (inv3:Investor {id: '44444444-4444-4444-4444-444444444403', name: 'Elena Rostova', firm: 'Nordic Seed Fund'})
MERGE (inv4:Investor {id: '44444444-4444-4444-4444-444444444404', name: 'Vikram Malhotra', firm: 'Blue Ocean Angels'})
MERGE (inv5:Investor {id: '44444444-4444-4444-4444-444444444405', name: 'Sarah Jenkins', firm: 'Catalyst Seed Fund'})

// Investor interest links
MERGE (inv1)-[:INTERESTED_IN]->(iCleanTech)
MERGE (inv1)-[:INTERESTED_IN]->(s1)

MERGE (inv2)-[:INTERESTED_IN]->(iCleanTech)
MERGE (inv2)-[:INTERESTED_IN]->(iDeepTech)
MERGE (inv2)-[:INTERESTED_IN]->(s1)

MERGE (inv3)-[:INTERESTED_IN]->(iHealthTech)
MERGE (inv3)-[:INTERESTED_IN]->(s2)

MERGE (inv4)-[:INTERESTED_IN]->(iAgriTech)
MERGE (inv4)-[:INTERESTED_IN]->(s3)

MERGE (inv5)-[:INTERESTED_IN]->(iCleanTech)
MERGE (inv5)-[:INTERESTED_IN]->(iAgriTech)
MERGE (inv5)-[:INTERESTED_IN]->(s1)

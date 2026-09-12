// =============================================================================
// Neo4j seed aligned with database/init.sql demo accounts
// Node IDs match Postgres primary keys for join-by-id.
// =============================================================================

// Industries
MERGE (iCleanTech:Industry {name: 'CleanTech'})
MERGE (iFinTech:Industry {name: 'FinTech'})
MERGE (iHealthTech:Industry {name: 'HealthTech'})
MERGE (iDeepTech:Industry {name: 'AI / DeepTech'})
MERGE (iClimate:Industry {name: 'ClimateTech'})
MERGE (iSaaS:Industry {name: 'B2B SaaS'})
MERGE (iDevTools:Industry {name: 'DevTools'})
MERGE (iTechnology:Industry {name: 'Technology'})

// Markets
MERGE (mMicrogrid:Market {name: 'Commercial Energy Microgrids', tam_usd: 14200000000})
MERGE (mTreasury:Market {name: 'B2B Cross-Border Settlement', tam_usd: 8900000000})
MERGE (mOncology:Market {name: 'Generative Protein Design', tam_usd: 21000000000})
MERGE (mPQC:Market {name: 'Post-Quantum Asset Custody', tam_usd: 15000000000})

// Users (profiles)
MERGE (uAdmin:User {id: 'admin-user', email: 'admin@fundx.ai', full_name: 'FundX Platform Super Admin', role: 'admin'})
MERGE (uPriya:User {id: 'founder-aerogrid', email: 'founder@aerogrid.io', full_name: 'Priya Sharma', role: 'startup'})
MERGE (uArjun:User {id: 'founder-finpulse', email: 'contact@finpulse.ai', full_name: 'Arjun Nambiar', role: 'startup'})
MERGE (uSarah:User {id: 'founder-biosynthetix', email: 'team@biosynthetix.io', full_name: 'Dr. Sarah Chen', role: 'startup'})
MERGE (uAlex:User {id: 'founder-quantumledger', email: 'alex@quantumledger.ai', full_name: 'Alex Mercer', role: 'startup'})
MERGE (uElena:User {id: 'investor-elena', email: 'elena@apexhorizon.com', full_name: 'Elena Rostova', role: 'investor'})
MERGE (uVikram:User {id: 'investor-vikram', email: 'vikram@nexusangels.io', full_name: 'Vikram Mehta', role: 'investor'})
MERGE (uDavid:User {id: 'investor-david', email: 'david.miller@angelinvest.org', full_name: 'David Miller', role: 'investor'})

// Startups
MERGE (s1:Startup {id: 'startup-aerogrid', name: 'AeroGrid Tech', stage: 'Seed', email: 'founder@aerogrid.io'})
MERGE (s2:Startup {id: 'startup-finpulse', name: 'FinPulse AI', stage: 'Series A', email: 'contact@finpulse.ai'})
MERGE (s3:Startup {id: 'startup-biosynthetix', name: 'BioSynthetix Labs', stage: 'Pre-Seed', email: 'team@biosynthetix.io'})
MERGE (s4:Startup {id: 'startup-quantumledger', name: 'QuantumLedger AI', stage: 'Seed', email: 'alex@quantumledger.ai'})

MERGE (uPriya)-[:OWNS]->(s1)
MERGE (uArjun)-[:OWNS]->(s2)
MERGE (uSarah)-[:OWNS]->(s3)
MERGE (uAlex)-[:OWNS]->(s4)

MERGE (s1)-[:OPERATES_IN]->(iCleanTech)
MERGE (s1)-[:TARGETS]->(mMicrogrid)
MERGE (s2)-[:OPERATES_IN]->(iFinTech)
MERGE (s2)-[:TARGETS]->(mTreasury)
MERGE (s3)-[:OPERATES_IN]->(iHealthTech)
MERGE (s3)-[:TARGETS]->(mOncology)
MERGE (s4)-[:OPERATES_IN]->(iDeepTech)
MERGE (s4)-[:TARGETS]->(mPQC)

// Competitors (external)
MERGE (comp1:Startup {id: 'comp-stem-energy', name: 'Stem Inc (Public)', stage: 'Public'})
MERGE (comp2:Startup {id: 'comp-ripple', name: 'RippleNet Treasury', stage: 'Public'})
MERGE (s1)-[:COMPETES_WITH]->(comp1)
MERGE (s2)-[:COMPETES_WITH]->(comp2)

// Investors
MERGE (inv1:Investor {id: 'investor-elena', name: 'Elena Rostova', firm: 'Apex Horizon Capital', email: 'elena@apexhorizon.com'})
MERGE (inv2:Investor {id: 'investor-vikram', name: 'Vikram Mehta', firm: 'Nexus Angel Syndicate', email: 'vikram@nexusangels.io'})
MERGE (inv3:Investor {id: 'investor-david', name: 'David Miller', firm: 'Private Angel', email: 'david.miller@angelinvest.org'})

MERGE (uElena)-[:OWNS]->(inv1)
MERGE (uVikram)-[:OWNS]->(inv2)
MERGE (uDavid)-[:OWNS]->(inv3)

MERGE (inv1)-[:INTERESTED_IN]->(iCleanTech)
MERGE (inv1)-[:INTERESTED_IN]->(iClimate)
MERGE (inv1)-[:INTERESTED_IN]->(iDeepTech)
MERGE (inv1)-[:INTERESTED_IN]->(iSaaS)

MERGE (inv2)-[:INTERESTED_IN]->(iFinTech)
MERGE (inv2)-[:INTERESTED_IN]->(iSaaS)
MERGE (inv2)-[:INTERESTED_IN]->(iDevTools)

MERGE (inv3)-[:INTERESTED_IN]->(iTechnology)
MERGE (inv3)-[:INTERESTED_IN]->(iHealthTech)

// Deals
MERGE (d1:Deal {id: 'deal-aerogrid', title: 'Autonomous Renewable Microgrid Grid-Edge Infrastructure', status: 'negotiating', industry: 'CleanTech', funding_stage: 'Seed', target_raise: 750000})
MERGE (d2:Deal {id: 'deal-finpulse', title: 'Sub-second B2B Treasury & Global FX Settlement Protocol', status: 'closed', industry: 'FinTech', funding_stage: 'Series A', target_raise: 1500000})
MERGE (d3:Deal {id: 'deal-biosynthetix', title: 'Generative Protein Design Platform for Targeted Oncology', status: 'draft', industry: 'HealthTech', funding_stage: 'Pre-Seed', target_raise: 400000})
MERGE (d4:Deal {id: 'deal-quantumledger', title: 'Post-Quantum Cryptographic Audit Engine & Tokenization Protocol', status: 'active', industry: 'AI / DeepTech', funding_stage: 'Seed', target_raise: 1200000})

MERGE (s1)-[:LISTED]->(d1)
MERGE (s2)-[:LISTED]->(d2)
MERGE (s3)-[:LISTED]->(d3)
MERGE (s4)-[:LISTED]->(d4)

// Interests
MERGE (inv1)-[:INTERESTED_IN {status: 'active_negotiation'}]->(d1)
MERGE (inv1)-[:INTERESTED_IN]->(s1)
MERGE (inv2)-[:INTERESTED_IN {status: 'interested'}]->(d1)
MERGE (inv2)-[:INTERESTED_IN]->(s1)
MERGE (inv1)-[:INTERESTED_IN]->(s2)

// Offers / negotiations
MERGE (o1:Offer {id: 'offer-ag-1', sender_type: 'startup', amount: 750000, equity_pct: 7.0, royalty_pct: 2.5, status: 'superseded'})
MERGE (o2:Offer {id: 'offer-ag-2', sender_type: 'investor', amount: 800000, equity_pct: 8.0, royalty_pct: 2.0, status: 'countered'})
MERGE (o3:Offer {id: 'offer-ag-3', sender_type: 'startup', amount: 800000, equity_pct: 7.5, royalty_pct: 2.2, status: 'active'})
MERGE (o4:Offer {id: 'offer-fp-1', sender_type: 'investor', amount: 1500000, equity_pct: 8.5, royalty_pct: 1.5, status: 'accepted'})

MERGE (o1)-[:ON_DEAL]->(d1)
MERGE (o2)-[:ON_DEAL]->(d1)
MERGE (o3)-[:ON_DEAL]->(d1)
MERGE (o4)-[:ON_DEAL]->(d2)

MERGE (inv1)-[:MADE_OFFER]->(o2)
MERGE (inv1)-[:MADE_OFFER]->(o4)
MERGE (inv1)-[:NEGOTIATED {last_offer_id: 'offer-ag-3'}]->(d1)
MERGE (inv1)-[:NEGOTIATED {last_offer_id: 'offer-fp-1'}]->(d2)

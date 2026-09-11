// Optional Cypher seeds for local Neo4j exploration.
// Node ids should match Supabase UUIDs when real data exists.

MERGE (i:Industry {name: 'CleanTech'})
MERGE (m:Market {name: 'Commercial Energy SaaS'})
MERGE (s:Startup {id: 'demo-startup-1', name: 'NovaGrid Energy'})
MERGE (inv:Investor {id: 'demo-investor-1', name: 'Asha Rao'})
MERGE (c:Claim {id: 'demo-claim-1', text: 'Expanding pilot ARR'})
MERGE (e:Evidence {id: 'demo-evidence-1', text: '3 signed LOIs'})

MERGE (s)-[:OPERATES_IN]->(i)
MERGE (s)-[:TARGETS]->(m)
MERGE (s)-[:MAKES_CLAIM]->(c)
MERGE (c)-[:SUPPORTED_BY]->(e)
MERGE (inv)-[:INTERESTED_IN]->(i)
MERGE (inv)-[:INTERESTED_IN]->(s)

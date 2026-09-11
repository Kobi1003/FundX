const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  }
  // Don't force JSON content-type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      } else if (data && data.message) {
        errorMsg = data.message
      }
    } catch {
      const text = await res.text()
      if (text) errorMsg = text
    }
    throw new Error(errorMsg)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

const MOCK_DEALS = [
  {
    id: 'deal-aerogrid',
    startup_id: 'startup-aerogrid',
    startup_name: 'AeroGrid Tech',
    startup_verified: true,
    title: 'Autonomous Renewable Microgrid Grid-Edge Infrastructure',
    pitch: 'AI-orchestrated autonomous renewable energy grids for commercial microgrids and storage facilities',
    industry: 'CleanTech',
    funding_stage: 'Seed',
    target_raise: 750000,
    equity_pct: 7.0,
    royalty_pct: 2.5,
    royalty_payout_terms: '2.5% of quarterly gross revenue until 2.0x return cap',
    status: 'negotiating',
    thesis: 'Decentralized renewables will hit 32% grid penetration by 2030. AeroGrid combines frequency stabilization algorithms with IoT telemetry to cut curtailment by 40%.',
    ai_score: 88,
  },
  {
    id: 'deal-finpulse',
    startup_id: 'startup-finpulse',
    startup_name: 'FinPulse AI',
    startup_verified: true,
    title: 'Sub-second B2B Treasury & Global FX Settlement Protocol',
    pitch: 'Unified liquidity routing and automated compliance for multinational enterprises',
    industry: 'FinTech',
    funding_stage: 'Series A',
    target_raise: 1500000,
    equity_pct: 8.5,
    royalty_pct: 1.5,
    royalty_payout_terms: '1.5% of quarterly revenues until 1.75x payback cap',
    status: 'closed',
    thesis: 'Eliminates multi-day settlement delays and 2.4% FX friction for cross-border B2B transactions.',
    ai_score: 92,
  },
  {
    id: 'deal-biosynthetix',
    startup_id: 'startup-biosynthetix',
    startup_name: 'BioSynthetix Labs',
    startup_verified: false,
    title: 'Generative Protein Design Platform for Targeted Oncology',
    pitch: 'Deep learning diffusion models predicting antibody-antigen binding affinities in weeks',
    industry: 'HealthTech',
    funding_stage: 'Pre-Seed',
    target_raise: 400000,
    equity_pct: 6.0,
    royalty_pct: 3.0,
    royalty_payout_terms: '3.0% of licensing revenues until 2.5x payback',
    status: 'published',
    thesis: 'Generative chemistry slashing oncology synthesis cycles.',
    ai_score: 85,
  },
  {
    id: 'deal-quantumledger',
    startup_id: 'startup-quantumledger',
    startup_name: 'QuantumLedger AI',
    startup_verified: true,
    title: 'Post-Quantum Cryptographic Audit Engine & Tokenization Protocol',
    pitch: 'Lattice-based cryptography securing financial transactions against quantum decryption threats',
    industry: 'Cybersecurity',
    funding_stage: 'Series A',
    target_raise: 1200000,
    equity_pct: 9.0,
    royalty_pct: 2.0,
    royalty_payout_terms: '2.0% quarterly revenue share capped at 2.0x',
    status: 'published',
    thesis: 'Quantum computing poses an existential threat to RSA/ECC encryption.',
    ai_score: 90,
  },
]

export const api = {
  health: () => request('/health'),

  // Auth & Profiles
  login: (body) =>
    request('/api/users/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) =>
    request('/api/users/register', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/api/users/profile'),
  listUsers: () => request('/api/users/list'),
  verifyCin: (cin) => request(`/api/users/verify-cin/${encodeURIComponent(cin)}`),

  // Startups
  listStartups: () => request('/api/startups'),
  getStartup: (id) => request(`/api/startups/${id}`),
  createStartup: (body) =>
    request('/api/startups', { method: 'POST', body: JSON.stringify(body) }),
  updateStartup: (id, body) =>
    request(`/api/startups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  verifyStartup: (id) =>
    request(`/api/startups/${id}/verify`, { method: 'POST' }),
  listStartupDocs: (id) => request(`/api/startups/${id}/documents`),
  uploadStartupDocument: (id, file, docType = 'general') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('doc_type', docType)
    return request(`/api/startups/${id}/upload-document`, { method: 'POST', body: fd })
  },

  // Investors
  listInvestors: () => request('/api/investors'),
  getInvestor: (id) => request(`/api/investors/${id}`).catch(() => null),
  createInvestor: (body) =>
    request('/api/investors', { method: 'POST', body: JSON.stringify(body) }),
  updateInvestor: (id, body) =>
    request(`/api/investors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadInvestorCv: (id, { file, filename, cv_text } = {}) => {
    const fd = new FormData()
    if (file) fd.append('file', file)
    if (filename) fd.append('filename', filename)
    if (cv_text) fd.append('cv_text', cv_text)
    return request(`/api/investors/${id}/upload-cv`, { method: 'POST', body: fd })
  },
  uploadInvestorCvJson: (id, body) =>
    request(`/api/investors/${id}/upload-cv-json`, { method: 'POST', body: JSON.stringify(body) }),
  verifyInvestor: (id) =>
    request(`/api/investors/${id}/verify`, { method: 'POST' }),
  getInvestorPreferences: (id) => request(`/api/investors/${id}/preferences`),
  updateInvestorPreferences: (id, body) =>
    request(`/api/investors/${id}/preferences`, { method: 'PUT', body: JSON.stringify(body) }),

  // Deals & Dealroom
  listDeals: (params = '') =>
    request(`/api/deals${params ? '?' + params : ''}`).catch(() => MOCK_DEALS),
  getDeal: (id) =>
    request(`/api/deals/${id}`).catch(() => MOCK_DEALS.find((d) => d.id === id) || MOCK_DEALS[0]),
  createDeal: (body) =>
    request('/api/deals', { method: 'POST', body: JSON.stringify(body) }),
  updateDeal: (id, body) =>
    request(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  publishDeal: (id) =>
    request(`/api/deals/${id}/publish`, { method: 'POST' }),
  expressInterest: (dealId, body) =>
    request(`/api/deals/${dealId}/interest`, { method: 'POST', body: JSON.stringify(body) }).catch(() => ({ status: 'interested' })),
  getNegotiationTree: (dealId) => request(`/api/deals/${dealId}/negotiation-tree`),
  createOffer: (dealId, body) =>
    request(`/api/deals/${dealId}/offers`, { method: 'POST', body: JSON.stringify(body) }),
  respondOffer: (dealId, offerId, body) =>
    request(`/api/deals/${dealId}/offers/${offerId}`, { method: 'PUT', body: JSON.stringify(body) }),
  getDealRoom: (id) => request(`/api/deal-rooms/${id}`),
  listMessages: (roomId) => request(`/api/deal-rooms/${roomId}/messages`).catch(() => []),
  postMessage: (roomId, body) =>
    request(`/api/deal-rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(body) }).catch(() => ({ ...body, id: Date.now() })),

  // AI Workflows
  verifyStartupAi: (body) =>
    request('/api/ai/verify/startup', { method: 'POST', body: JSON.stringify(body) }),
  verifyInvestorAi: (body) =>
    request('/api/ai/verify/investor', { method: 'POST', body: JSON.stringify(body) }),
  analyzeThesis: (body) =>
    request('/api/ai/analyze-thesis', { method: 'POST', body: JSON.stringify(body) }),
  runStartupAnalysis: (body) =>
    request('/api/ai/startup-analysis', { method: 'POST', body: JSON.stringify(body) }),
  runInvestorAnalysis: (body) =>
    request('/api/ai/investor-analysis', { method: 'POST', body: JSON.stringify(body) }),
  runNegotiation: (body) =>
    request('/api/ai/negotiation', { method: 'POST', body: JSON.stringify(body) }),
  simulate: (body) =>
    request('/api/ai/simulate', { method: 'POST', body: JSON.stringify(body) }),
  demoSample: () => request('/api/ai/demo/sample'),
}

export default api

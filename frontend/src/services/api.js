const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
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

export const api = {
  health: () => request('/health'),

  // Auth & Profiles
  login: (body) =>
    request('/api/users/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) =>
    request('/api/users/register', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/api/users/profile'),
  listUsers: () => request('/api/users/list'),

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

  // Investors
  listInvestors: () => request('/api/investors'),
  getInvestor: (id) => request(`/api/investors/${id}`),
  createInvestor: (body) =>
    request('/api/investors', { method: 'POST', body: JSON.stringify(body) }),
  updateInvestor: (id, body) =>
    request(`/api/investors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadInvestorCv: (id, body) =>
    request(`/api/investors/${id}/upload-cv`, { method: 'POST', body: JSON.stringify(body) }),
  verifyInvestor: (id) =>
    request(`/api/investors/${id}/verify`, { method: 'POST' }),
  getInvestorPreferences: (id) => request(`/api/investors/${id}/preferences`),
  updateInvestorPreferences: (id, body) =>
    request(`/api/investors/${id}/preferences`, { method: 'PUT', body: JSON.stringify(body) }),

  // Deals & Dealroom
  listDeals: (params = '') => request(`/api/deals${params ? '?' + params : ''}`),
  getDeal: (id) => request(`/api/deals/${id}`),
  createDeal: (body) =>
    request('/api/deals', { method: 'POST', body: JSON.stringify(body) }),
  updateDeal: (id, body) =>
    request(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  publishDeal: (id) =>
    request(`/api/deals/${id}/publish`, { method: 'POST' }),
  expressInterest: (dealId, body) =>
    request(`/api/deals/${dealId}/interest`, { method: 'POST', body: JSON.stringify(body) }),
  getNegotiationTree: (dealId) => request(`/api/deals/${dealId}/negotiation-tree`),
  createOffer: (dealId, body) =>
    request(`/api/deals/${dealId}/offers`, { method: 'POST', body: JSON.stringify(body) }),
  respondOffer: (dealId, offerId, body) =>
    request(`/api/deals/${dealId}/offers/${offerId}`, { method: 'PUT', body: JSON.stringify(body) }),
  getDealRoom: (id) => request(`/api/deal-rooms/${id}`),
  listMessages: (roomId) => request(`/api/deal-rooms/${roomId}/messages`),
  postMessage: (roomId, body) =>
    request(`/api/deal-rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify(body) }),

  // AI Workflows
  verifyStartupAi: (body) =>
    request('/api/ai/verify/startup', { method: 'POST', body: JSON.stringify(body) }),
  verifyInvestorAi: (body) =>
    request('/api/ai/verify/investor', { method: 'POST', body: JSON.stringify(body) }),
  analyzeThesis: (body) =>
    request('/api/ai/analyze-thesis', { method: 'POST', body: JSON.stringify(body) }),
  runStartupAnalysis: (body) =>
    request('/api/ai/startup-analysis', { method: 'POST', body: JSON.stringify(body) }),
  simulate: (body) =>
    request('/api/ai/simulate', { method: 'POST', body: JSON.stringify(body) }),
  demoSample: () => request('/api/ai/demo/sample'),
}

export default api

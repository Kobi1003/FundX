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
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  health: () => request('/health'),
  getProfile: () => request('/api/users/profile'),
  listStartups: () => request('/api/startups'),
  getStartup: (id) => request(`/api/startups/${id}`),
  createStartup: (body) =>
    request('/api/startups', { method: 'POST', body: JSON.stringify(body) }),
  listInvestors: () => request('/api/investors'),
  getInvestor: (id) => request(`/api/investors/${id}`),
  listDeals: () => request('/api/deals'),
  getDeal: (id) => request(`/api/deals/${id}`),
  getDealRoom: (id) => request(`/api/deal-rooms/${id}`),
  runStartupAnalysis: (body) =>
    request('/api/ai/startup-analysis', { method: 'POST', body: JSON.stringify(body) }),
  demoSample: () => request('/api/ai/demo/sample'),
}

export default api

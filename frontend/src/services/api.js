import { supabase } from '../lib/supabase'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const authHeaders = {}
  
  // Attach Bearer token from active Supabase session or local demo fallback
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      authHeaders['Authorization'] = `Bearer ${session.access_token}`
    } else {
      const localToken = sessionStorage.getItem('fundx_demo_token') || 'demo-user'
      authHeaders['Authorization'] = `Bearer ${localToken}`
    }
  } catch {
    const localToken = sessionStorage.getItem('fundx_demo_token') || 'demo-user'
    authHeaders['Authorization'] = `Bearer ${localToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    let errorDetail = text
    try {
      const parsed = JSON.parse(text)
      if (parsed.detail) errorDetail = parsed.detail
    } catch {
      // Use raw text fallback
    }
    throw new Error(errorDetail || `Request failed: ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export const api = {
  health: () => request('/health'),
  
  // Profile
  getProfile: () => request('/api/users/profile'),
  createProfile: (body) => request('/api/users/profile', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (body) => request('/api/users/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Startups
  listStartups: () => request('/api/startups'),
  getStartup: (id) => request(`/api/startups/${id}`),
  getStartupMe: () => request('/api/startups/me'),
  createStartup: (body) => request('/api/startups', { method: 'POST', body: JSON.stringify(body) }),
  updateStartup: (id, body) => request(`/api/startups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Investors
  listInvestors: () => request('/api/investors'),
  getInvestor: (id) => request(`/api/investors/${id}`),
  getInvestorMe: () => request('/api/investors/me'),
  createInvestor: (body) => request('/api/investors', { method: 'POST', body: JSON.stringify(body) }),
  updateInvestor: (id, body) => request(`/api/investors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getInvestorPreferences: (id) => request(`/api/investors/${id}/preferences`),
  updateInvestorPreferences: (id, body) => request(`/api/investors/${id}/preferences`, { method: 'PUT', body: JSON.stringify(body) }),

  // Deals & AI
  listDeals: () => request('/api/deals'),
  getDeal: (id) => request(`/api/deals/${id}`),
  getDealRoom: (id) => request(`/api/deal-rooms/${id}`),
  runStartupAnalysis: (body) => request('/api/ai/startup-analysis', { method: 'POST', body: JSON.stringify(body) }),
  demoSample: () => request('/api/ai/demo/sample'),
}

export default api

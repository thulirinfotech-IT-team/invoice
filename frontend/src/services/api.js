import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach token if present at load time
const token = localStorage.getItem('access_token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Request interceptor — always use latest token from localStorage
api.interceptors.request.use((config) => {
  const latestToken = localStorage.getItem('access_token')
  if (latestToken) {
    config.headers['Authorization'] = `Bearer ${latestToken}`
  }
  return config
})

// Response interceptor — handle 401 with refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }

    // Show error toast for 5xx
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }

    return Promise.reject(error)
  }
)

// ── Client API ───────────────────────────────────────────────────────────────
export const clientsAPI = {
  list: (params) => api.get('/api/clients/', { params }),
  get: (id) => api.get(`/api/clients/${id}/`),
  create: (data) => api.post('/api/clients/', data),
  update: (id, data) => api.put(`/api/clients/${id}/`, data),
  patch: (id, data) => api.patch(`/api/clients/${id}/`, data),
  delete: (id) => api.delete(`/api/clients/${id}/`),
  invoices: (id) => api.get(`/api/clients/${id}/invoices/`),
  stats: () => api.get('/api/clients/stats/'),
}

// ── Service API ──────────────────────────────────────────────────────────────
export const servicesAPI = {
  list: (params) => api.get('/api/services/', { params }),
  create: (data) => api.post('/api/services/', data),
  update: (id, data) => api.put(`/api/services/${id}/`, data),
  delete: (id) => api.delete(`/api/services/${id}/`),
}

// ── Invoice API ──────────────────────────────────────────────────────────────
export const invoicesAPI = {
  list: (params) => api.get('/api/invoices/', { params }),
  get: (id) => api.get(`/api/invoices/${id}/`),
  create: (data) => api.post('/api/invoices/', data),
  update: (id, data) => api.put(`/api/invoices/${id}/`, data),
  patch: (id, data) => api.patch(`/api/invoices/${id}/`, data),
  delete: (id) => api.delete(`/api/invoices/${id}/`),
  markPaid: (id) => api.post(`/api/invoices/${id}/mark_paid/`),
  markUnpaid: (id) => api.post(`/api/invoices/${id}/mark_unpaid/`),
  regeneratePdf: (id) => api.post(`/api/invoices/${id}/regenerate_pdf/`),
  downloadPdfUrl: (id) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/api/invoices/${id}/download_pdf/`,
  dashboardStats: () => api.get('/api/invoices/dashboard_stats/'),
}

export default api

import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true, // sends HttpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
})

// Intercept 401 → try refresh once then redirect to login
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (r: unknown) => void }> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(undefined)))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        await api.post('/api/auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr)
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  },
)

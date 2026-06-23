import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: () => void; reject: (reason: unknown) => void }> = []

function processQueue(error?: unknown) {
  failedQueue.forEach(item => (error ? item.reject(error) : item.resolve()))
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean })
    const requestUrl = originalRequest?.url ?? ''
    const isAuthEndpoint = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register') || requestUrl.includes('/api/auth/refresh')

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => failedQueue.push({ resolve, reject })).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true
      try {
        await api.post('/api/auth/refresh')
        processQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        useAuthStore.getState().logout()
        if (!window.location.pathname.startsWith('/auth/')) window.location.assign('/auth/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export function getApiError(error: unknown, fallback = 'Something went wrong') {
  const response = (error as { response?: { data?: { detail?: string | { message?: string }; message?: string } } }).response
  const detail = response?.data?.detail
  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  return response?.data?.message ?? fallback
}

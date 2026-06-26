import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

const ACCESS_TOKEN_KEY = 'openstudy-access-token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let isRefreshing = false

let failedQueue: Array<{
  resolve: () => void
  reject: (reason: unknown) => void
}> = []

function processQueue(error?: unknown) {
  failedQueue.forEach(item => {
    if (error) item.reject(error)
    else item.resolve()
  })

  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined

    const requestUrl = originalRequest?.url ?? ''

    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/refresh')

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResponse = await api.post('/api/auth/refresh')

        const refreshData = refreshResponse.data as {
          access_token?: string
          token?: string
        }

        const newToken =
          refreshData.access_token ??
          refreshData.token

        if (newToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, newToken)
        }

        processQueue()
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        useAuthStore.getState().logout()

        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.assign('/auth/login')
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export function getApiError(
  error: unknown,
  fallback = 'Something went wrong',
) {
  const response = (
    error as {
      response?: {
        data?: {
          detail?: string | { message?: string }
          message?: string
        }
      }
    }
  ).response

  const detail = response?.data?.detail

  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message

  return response?.data?.message ?? fallback
}

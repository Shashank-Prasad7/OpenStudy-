import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { Preference, StudyPlan, StudyPlanRequest, User, UserStats } from '@/types'

export function useMe(enabled = true) {
  const setUser = useAuthStore(state => state.setUser)
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/api/users/me')
      setUser(response.data)
      return response.data
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore(state => state.setUser)
  return useMutation({
    mutationFn: (data: Partial<Pick<User, 'name' | 'bio' | 'timezone' | 'avatar_url'>>) =>
      api.patch<User>('/api/users/me', data).then(response => response.data),
    onSuccess: user => {
      setUser(user)
      queryClient.setQueryData(['me'], user)
    },
  })
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ['me', 'stats'],
    queryFn: () => api.get<UserStats>('/api/users/me/stats').then(response => response.data),
  })
}

export function usePreferences() {
  return useQuery<Preference | null>({
    queryKey: ['me', 'preferences'],
    queryFn: async () => {
      try {
        return (await api.get<Preference>('/api/users/me/preferences')).data
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 404) return null
        throw error
      }
    },
    retry: false,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Pick<Preference, 'subjects' | 'study_time' | 'style'>) =>
      api.patch<Preference>('/api/users/me/preferences', data).then(response => response.data),
    onSuccess: preference => queryClient.setQueryData(['me', 'preferences'], preference),
  })
}

export function useStudyPlan() {
  return useMutation({
    mutationFn: (payload: StudyPlanRequest) =>
      api.post<StudyPlan>('/api/ai/study-plan', payload).then(response => response.data),
  })
}

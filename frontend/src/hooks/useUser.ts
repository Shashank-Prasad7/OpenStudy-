import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

export function useMe() {
  const setUser = useAuthStore(s => s.setUser)
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/users/me')
      setUser(res.data)
      return res.data
    },
    staleTime: 60_000,
  })
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: (data: Partial<User>) =>
      api.patch('/api/users/me', data).then(r => r.data),
  })
}

export function useStudyPlan() {
  return useMutation({
    mutationFn: (payload: { subject: string; exam_date: string; hours_per_day: number; current_level: string }) =>
      api.post('/api/ai/study-plan', payload).then(r => r.data),
  })
}

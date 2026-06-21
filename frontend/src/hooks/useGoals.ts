import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Goal, SessionNote } from '@/types'

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get<Goal[]>('/api/goals').then(response => response.data),
  })
}

export function useSessionNotes() {
  return useQuery<SessionNote[]>({
    queryKey: ['session-notes'],
    queryFn: () => api.get<SessionNote[]>('/api/goals/session-notes').then(response => response.data),
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; deadline?: string | null }) =>
      api.post<Goal>('/api/goals', data).then(response => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useToggleGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.patch<Goal>(`/api/goals/${id}`, { completed }).then(response => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/goals/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useCreateSessionNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ session_id, note_text }: { session_id: string; note_text: string }) =>
      api.post<SessionNote>('/api/goals/session-notes', { session_id, note_text }).then(response => response.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['session-notes'] }),
  })
}

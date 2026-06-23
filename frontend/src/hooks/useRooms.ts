import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PaginatedRooms, RoomDetail } from '@/types'

export interface CreateRoomPayload {
  name: string
  description?: string
  subject_tags: string[]
  visibility: 'public' | 'private'
  max_members: number
}

export function useRooms(limit = 20, offset = 0) {
  return useQuery<PaginatedRooms>({
    queryKey: ['rooms', limit, offset],
    queryFn: () => api.get<PaginatedRooms>(`/api/rooms?limit=${limit}&offset=${offset}`).then(response => response.data),
  })
}

export function useRoom(id: string | undefined) {
  return useQuery<RoomDetail>({
    queryKey: ['rooms', id],
    queryFn: () => api.get<RoomDetail>(`/api/rooms/${id}`).then(response => response.data),
    enabled: Boolean(id),
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoomPayload) => api.post<RoomDetail>('/api/rooms', data).then(response => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useJoinRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<RoomDetail>(`/api/rooms/${id}/join`).then(response => response.data),
    onSuccess: (room, id) => {
      queryClient.setQueryData(['rooms', id], room)
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useLeaveRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<RoomDetail>(`/api/rooms/${id}/leave`).then(response => response.data),
    onSuccess: (room, id) => {
      queryClient.setQueryData(['rooms', id], room)
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'stats'] })
    },
  })
}

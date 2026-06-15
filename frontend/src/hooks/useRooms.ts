import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { StudyRoom, RoomDetail, PaginatedRooms } from '@/types'

export function useRooms(limit = 20, offset = 0) {
  return useQuery<PaginatedRooms>({
    queryKey: ['rooms', limit, offset],
    queryFn: async () => {
      const res = await api.get(`/api/rooms?limit=${limit}&offset=${offset}`)
      return res.data
    },
  })
}

export function useRoom(id: string | undefined) {
  return useQuery<RoomDetail>({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const res = await api.get(`/api/rooms/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<StudyRoom>) => api.post('/api/rooms', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

export function useJoinRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/rooms/${id}/join`).then(r => r.data),
    onSuccess: (_data, id) => qc.invalidateQueries({ queryKey: ['rooms', id] }),
  })
}

export function useLeaveRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/rooms/${id}/leave`).then(r => r.data),
    onSuccess: (_data, id) => qc.invalidateQueries({ queryKey: ['rooms', id] }),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  })
}

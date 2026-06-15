import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { MatchSuggestion } from '@/types'

export function useMatches(limit = 10) {
  return useQuery<MatchSuggestion[]>({
    queryKey: ['matches', limit],
    queryFn: async () => {
      const res = await api.get(`/api/matches?limit=${limit}`)
      return res.data
    },
  })
}

export function useAcceptMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (matchId: string) =>
      api.post(`/api/matches/${matchId}/accept`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { MatchSuggestion, PartnerMatch } from '@/types'

export function useMatches(limit = 10, enabled = true) {
  return useQuery<MatchSuggestion[]>({
    queryKey: ['matches', limit],
    queryFn: () => api.get<MatchSuggestion[]>(`/api/matches?limit=${limit}`).then(response => response.data),
    enabled,
  })
}

export function useAcceptMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (matchId: string) => api.post<PartnerMatch>(`/api/matches/${matchId}/accept`).then(response => response.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['matches'] }),
  })
}

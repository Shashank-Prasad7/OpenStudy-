import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AIStudyPlannerRequest, AIStudyPlannerResponse, SavedPlan } from '@/types'

export function useGenerateRoadmap() {
  return useMutation({
    mutationFn: (payload: AIStudyPlannerRequest) =>
      api.post<AIStudyPlannerResponse>('/api/ai/study-planner/generate', payload).then(r => r.data),
  })
}

export function useSavePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      subject: string
      exam: string
      level: string
      hours_per_day: number
      exam_date: string
      notes?: string | null
      plan_data: AIStudyPlannerResponse
    }) => api.post<SavedPlan>('/api/ai/study-planner/save', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-plans'] }),
  })
}

export function useSavedPlans() {
  return useQuery<SavedPlan[]>({
    queryKey: ['saved-plans'],
    queryFn: () => api.get<SavedPlan[]>('/api/ai/study-planner/saved').then(r => r.data),
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => api.delete(`/api/ai/study-planner/saved/${planId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-plans'] }),
  })
}

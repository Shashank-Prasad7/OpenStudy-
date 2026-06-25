import { useState } from 'react'
import {
  BookmarkCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/AsyncState'
import { useDeletePlan, useSavedPlans } from '@/hooks/useStudyPlanner'
import { formatDate } from '@/lib/utils'
import type { AIStudyPlannerResponse, SavedPlan } from '@/types'

interface Props {
  onViewPlan: (plan: AIStudyPlannerResponse, meta: SavedPlan) => void
}

export default function SavedPlans({ onViewPlan }: Props) {
  const { data: plans, isLoading } = useSavedPlans()
  const deletePlan = useDeletePlan()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    try {
      await deletePlan.mutateAsync(id)
      toast.success('Plan deleted')
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete plan'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!plans?.length) {
    return (
      <EmptyState
        icon={<BookmarkCheck className="h-7 w-7" />}
        title="No saved plans yet"
        description="Generate a study roadmap and save it to access it here anytime."
      />
    )
  }

  return (
    <div className="space-y-4">
      {plans.map(plan => {
        const isExpanded = expandedId === plan.id
        const data = plan.plan_data as AIStudyPlannerResponse

        return (
          <Card
            key={plan.id}
            className="glass border-white/[0.06] transition-all duration-300 hover:border-white/[0.12]"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{plan.subject}</CardTitle>
                    <Badge variant="outline" className="text-[10px] capitalize">{plan.level}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {plan.exam}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {plan.exam_date}</span>
                    <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {plan.hours_per_day}h/day</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/60">Saved {formatDate(plan.created_at)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPlan(data, plan)}
                    className="gap-1 text-xs"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletePlan.isPending}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && data && (
              <CardContent className="pt-0">
                <div className="mt-2 rounded-xl bg-white/[0.02] p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-semibold text-foreground">{data.overview}</p>
                  {data.assessment && <p className="mt-2">{data.assessment}</p>}
                  {data.phases.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Phases</p>
                      <ul className="mt-1.5 space-y-1">
                        {data.phases.map((phase, i) => (
                          <li key={i}>• {phase.title} ({phase.duration})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

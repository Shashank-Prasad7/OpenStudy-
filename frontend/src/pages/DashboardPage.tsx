import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Clock3, Flame, Plus, Target, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGoals } from '@/hooks/useGoals'
import { useRooms } from '@/hooks/useRooms'
import { useUserStats } from '@/hooks/useUser'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'

interface StatCardData {
  label: string
  value: string | number
  suffix: string
  icon: LucideIcon
}

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
      <CardContent className="p-5">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary transition group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-black tracking-tight">{stat.value}</p>
          <p className="pb-1 text-xs text-muted-foreground">{stat.suffix}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(state => state.user)
  const statsQuery = useUserStats()
  const goalsQuery = useGoals()
  const roomsQuery = useRooms(6, 0)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [])

  const stats = statsQuery.data
  const statCards: StatCardData[] = [
    { label: 'Current streak', value: stats?.streak_count ?? user?.streak_count ?? 0, suffix: 'days', icon: Flame },
    { label: 'Focus completed', value: stats?.focus_minutes ?? 0, suffix: 'minutes', icon: Clock3 },
    { label: 'Goals completed', value: stats?.completed_goals ?? 0, suffix: 'total', icon: CheckCircle2 },
    { label: 'Joined rooms', value: stats?.active_rooms ?? 0, suffix: 'rooms', icon: Users },
  ]

  const week = stats?.weekly_focus ?? []
  const chartDays = week.length
    ? week.map(day => ({ ...day, label: new Intl.DateTimeFormat('en', { weekday: 'narrow' }).format(new Date(day.date)) }))
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => ({ date: `empty-${index}`, minutes: 0, label }))
  const maxMinutes = Math.max(...week.map(day => day.minutes), 1)
  const openGoals = goalsQuery.data?.filter(goal => !goal.completed).slice(0, 4) ?? []
  const rooms = roomsQuery.data?.items.slice(0, 4) ?? []

  return (
    <div>
      <header className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-card to-purple-500/10 p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-4">{formatDate(new Date().toISOString())}</Badge>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              {greeting}, <span className="gradient-text">{user?.name.split(' ')[0] ?? 'student'}</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Choose one clear goal, enter a room, and let shared accountability carry the session.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/goals"><Plus className="h-4 w-4" /> New goal</Link></Button>
            <Button asChild><Link to="/rooms"><BookOpen className="h-4 w-4" /> Start studying</Link></Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(stat => <StatCard key={stat.label} stat={stat} />)}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly focus</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Completed Pomodoro minutes from Monday to Sunday.</p>
            </div>
            <Badge variant="outline">{week.reduce((total, day) => total + day.minutes, 0)} min</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-3 rounded-3xl border border-white/10 bg-black/20 p-5">
              {chartDays.map(day => (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-3">
                  <div className="relative flex h-44 w-full items-end rounded-full bg-white/[0.04]">
                    <div className="w-full rounded-full bg-gradient-to-t from-primary to-violet-400 transition-all duration-700" style={{ height: `${Math.max(day.minutes ? 10 : 2, (day.minutes / maxMinutes) * 100)}%` }} title={`${day.minutes} minutes`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Smart next step</CardTitle>
            <p className="text-sm text-muted-foreground">Use the planner when your syllabus feels too large to start.</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <p className="text-lg font-bold">Turn your exam into daily actions.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Add the date, topics, hours available, and constraints. OpenStudy creates a revision-first plan with Pomodoro counts.</p>
              <Button asChild className="mt-5 w-full"><Link to="/planner">Open AI planner <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Next goals</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Your highest-priority open intentions.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/goals">View all <ArrowRight className="h-3 w-3" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {openGoals.length ? openGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Target className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{goal.title}</p><p className="mt-1 text-xs text-muted-foreground">{goal.deadline ? `Due ${formatDate(goal.deadline)}` : 'No deadline'}</p></div>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-muted-foreground">No open goals. Add one concrete intention for your next session.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Public rooms</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Join students already working.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/rooms">Browse <ArrowRight className="h-3 w-3" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {rooms.length ? rooms.map(room => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><BookOpen className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{room.name}</p><p className="mt-1 text-xs text-muted-foreground">{room.member_count}/{room.max_members} members</p></div>
                <Badge variant="secondary">{room.subject_tags[0] ?? 'General'}</Badge>
              </Link>
            )) : <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-muted-foreground">No public rooms yet. Create one and invite your study group.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/libs/utils'

const navItems = [
  { label: 'Dashboard', icon: BarChart3, active: true },
  { label: 'Study Rooms', icon: Users },
  { label: 'Goals', icon: Target },
  { label: 'Planner', icon: BrainCircuit },
]

const stats = [
  { label: 'Study streak', value: '12', suffix: 'days', icon: Flame, tone: 'from-orange-500 to-rose-500' },
  { label: 'Focus time', value: '18.5', suffix: 'hrs', icon: Clock3, tone: 'from-indigo-500 to-violet-500' },
  { label: 'Goals done', value: '27', suffix: 'tasks', icon: CheckCircle2, tone: 'from-emerald-500 to-teal-500' },
  { label: 'Room rank', value: '#4', suffix: 'weekly', icon: Trophy, tone: 'from-amber-500 to-orange-500' },
]

const tasks = [
  { title: 'Revise DBMS normalization notes', time: '09:45 AM', done: true },
  { title: 'Complete Java OOP viva questions', time: '11:30 AM', done: false },
  { title: '30 min focused maths practice', time: '05:00 PM', done: false },
]

const rooms = [
  { name: 'Java Viva Sprint', members: 18, tag: 'Live', accent: 'bg-emerald-500' },
  { name: 'DBMS Night Study', members: 11, tag: 'Open', accent: 'bg-indigo-500' },
  { name: 'Maths Problem Solvers', members: 24, tag: 'Hot', accent: 'bg-orange-500' },
]

const week = [62, 74, 46, 88, 68, 92, 77]

function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-white/10 bg-background/80 backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-brand shadow-lg shadow-primary/25">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-extrabold tracking-tight gradient-text">OpenStudy</p>
          <p className="text-xs text-muted-foreground">Focus together</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-4">
        {navItems.map(item => (
          <Link
            key={item.label}
            to="/dashboard"
            className={cn(
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/[0.06] hover:text-foreground',
              item.active && 'bg-primary/15 text-primary shadow-lg shadow-primary/5',
            )}
          >
            <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span>{item.label}</span>
            {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
          </Link>
        ))}
      </nav>

      <div className="m-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">AI Study Tip</p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Use 25-minute focus blocks and write one-line summaries after each session.</p>
      </div>
    </aside>
  )
}

function StatCard({ stat, index }: { stat: typeof stats[number]; index: number }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/10" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="relative p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} shadow-lg`}>
            <stat.icon className="h-5 w-5 text-white" />
          </div>
          <Zap className="h-4 w-4 text-muted-foreground opacity-50" />
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
  const user = useAuthStore(s => s.user)
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <Sidebar />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-3 bg-primary/15 text-primary">Tuesday, June 16</Badge>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'Anmol'}</span> 👋
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Your study dashboard is ready. Pick one focus goal and start strong.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden min-w-64 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-muted-foreground md:flex">
                <Search className="h-4 w-4" />
                <span className="text-sm">Search notes, rooms, goals...</span>
              </div>
              <Button variant="outline" size="icon" className="rounded-2xl bg-white/[0.04]">
                <Bell className="h-4 w-4" />
              </Button>
              <Button className="rounded-2xl gradient-brand text-white">
                <Plus className="h-4 w-4" /> New goal
              </Button>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => <StatCard key={stat.label} stat={stat} index={index} />)}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Weekly progress</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Focus minutes completed this week</p>
                </div>
                <Badge variant="outline">+18% this week</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end gap-3 rounded-3xl border border-white/10 bg-black/20 p-5">
                  {week.map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-3">
                      <div className="relative flex w-full items-end rounded-full bg-white/[0.04]" style={{ height: 190 }}>
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-primary to-violet-400 shadow-lg shadow-primary/20 transition-all duration-700 hover:from-violet-400 hover:to-primary"
                          style={{ height: `${height}%`, animationDelay: `${index * 100}ms` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /> Pomodoro</CardTitle>
                <p className="text-sm text-muted-foreground">Next focus sprint</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <div className="relative grid h-44 w-44 place-items-center rounded-full border border-primary/30 bg-primary/10 shadow-2xl shadow-primary/10">
                  <div className="absolute inset-3 rounded-full border border-primary/20" />
                  <div>
                    <p className="text-5xl font-black tracking-tighter">25:00</p>
                    <p className="mt-1 text-xs text-muted-foreground">Deep focus</p>
                  </div>
                </div>
                <Button className="mt-6 w-full rounded-2xl gradient-brand text-white">
                  <Play className="h-4 w-4" /> Start session
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Today's tasks</CardTitle>
                <Button variant="ghost" size="sm">View all <ArrowRight className="h-3 w-3" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.map(task => (
                  <div key={task.title} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                    <div className={cn('grid h-10 w-10 place-items-center rounded-xl', task.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/15 text-primary')}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm font-semibold', task.done && 'text-muted-foreground line-through')}>{task.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> {task.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Active rooms</CardTitle>
                <Button variant="ghost" size="sm">Browse <ArrowRight className="h-3 w-3" /></Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {rooms.map(room => (
                  <div key={room.name} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                    <div className={cn('h-3 w-3 rounded-full shadow-lg', room.accent)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{room.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{room.members} students online</p>
                    </div>
                    <Badge variant="outline">{room.tag}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

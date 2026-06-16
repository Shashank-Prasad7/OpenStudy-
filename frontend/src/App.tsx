import { useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Menu,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'

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

const nav = [
  { label: 'Dashboard', icon: BrainCircuit, active: true },
  { label: 'Study Rooms', icon: Users },
  { label: 'Goals', icon: Target },
  { label: 'Planner', icon: CalendarDays },
]

const week = [62, 74, 46, 88, 68, 92, 77]

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx(
        'fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-[#070b16]/95 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-lg font-extrabold text-transparent">OpenStudy</p>
              <p className="text-xs text-slate-400">Focus together</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-2 px-4 py-4">
          {nav.map(item => (
            <button key={item.label} className={cx(
              'group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-white/[0.06] hover:text-white',
              item.active ? 'bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-500/5' : 'text-slate-400',
            )}>
              <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span>{item.label}</span>
              {item.active && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-400" />}
            </button>
          ))}
        </nav>
        <div className="m-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-300" /><p className="text-sm font-semibold text-white">AI Study Tip</p></div>
          <p className="text-xs leading-5 text-slate-400">Use 25-minute focus blocks and write one-line summaries after each session.</p>
        </div>
      </aside>
    </>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070b16] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.07)_1px,transparent_0)] [background-size:28px_28px] opacity-30" />
      </div>

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main className="relative lg:pl-72">
        <div className="mx-auto max-w-7xl px-5 py-6 pt-20 sm:px-8 lg:px-10 lg:pt-6">
          <header className="mb-8 animate-[fade-in_.5s_ease-out] rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:flex md:items-center md:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">Tuesday, June 16</span>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{greeting}, <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Anmol</span> 👋</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">Your study dashboard is ready. Pick one focus goal and start strong.</p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-0">
              <div className="hidden min-w-64 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-slate-400 md:flex"><Search className="h-4 w-4" /><span className="text-sm">Search notes, rooms...</span></div>
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]"><Bell className="h-4 w-4" /></button>
              <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-bold shadow-lg shadow-indigo-500/25"><Plus className="h-4 w-4" /> New goal</button>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="mb-5 flex items-center justify-between"><div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} shadow-lg`}><stat.icon className="h-5 w-5 text-white" /></div><Zap className="h-4 w-4 text-slate-500" /></div>
                <div className="flex items-end gap-2"><p className="text-3xl font-black tracking-tight">{stat.value}</p><p className="pb-1 text-xs text-slate-400">{stat.suffix}</p></div>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">Weekly progress</h2><p className="text-sm text-slate-400">Focus minutes completed this week</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">+18%</span></div>
              <div className="flex h-64 items-end gap-3 rounded-3xl border border-white/10 bg-black/20 p-5">
                {week.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-3"><div className="relative flex w-full items-end rounded-full bg-white/[0.04]" style={{ height: 190 }}><div className="w-full rounded-full bg-gradient-to-t from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/20 transition-all duration-700" style={{ height: `${height}%` }} /></div><span className="text-xs text-slate-500">{['M','T','W','T','F','S','S'][index]}</span></div>)}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
              <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-bold"><Clock3 className="h-5 w-5 text-indigo-300" /> Pomodoro</h2>
              <p className="mb-6 text-sm text-slate-400">Next focus sprint</p>
              <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border border-indigo-400/30 bg-indigo-400/10 shadow-2xl shadow-indigo-500/10"><div><p className="text-5xl font-black tracking-tighter">25:00</p><p className="mt-1 text-xs text-slate-400">Deep focus</p></div></div>
              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-bold"><Play className="h-4 w-4" /> Start session</button>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Target className="h-5 w-5 text-indigo-300" /> Today's tasks</h2><div className="space-y-3">{tasks.map(task => <div key={task.title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"><div className={cx('grid h-10 w-10 place-items-center rounded-xl', task.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500/15 text-indigo-300')}><CheckCircle2 className="h-5 w-5" /></div><div><p className={cx('text-sm font-semibold', task.done && 'text-slate-500 line-through')}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.time}</p></div></div>)}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"><h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-indigo-300" /> Active rooms</h2><div className="space-y-3">{rooms.map(room => <div key={room.name} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"><div className={cx('h-3 w-3 rounded-full', room.accent)} /><div className="flex-1"><p className="text-sm font-semibold">{room.name}</p><p className="mt-1 text-xs text-slate-500">{room.members} students online</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{room.tag}</span></div>)}</div></div>
          </section>
        </div>
      </main>
    </div>
  )
}

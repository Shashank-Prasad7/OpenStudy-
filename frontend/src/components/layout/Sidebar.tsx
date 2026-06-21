import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'
import {
  BrainCircuit,
  BookOpen,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BookOpen, label: 'Study Rooms' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/matches', icon: Users, label: 'Partners' },
  { to: '/planner', icon: BrainCircuit, label: 'AI Planner' },
]

function NavItems({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              compact
                ? 'flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] text-muted-foreground'
                : 'sidebar-item',
              isActive && (compact ? 'bg-primary/15 text-primary' : 'active'),
            )
          }
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-4 w-4 shrink-0'} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout')
    } finally {
      logout()
      navigate('/auth/login')
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/10 bg-[hsl(var(--sidebar-background))]/95 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand shadow-lg shadow-primary/20">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-black tracking-tight gradient-text">OpenStudy</p>
          <p className="text-[11px] text-muted-foreground">Study together, consistently.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <NavItems />
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <NavLink to="/profile" className={({ isActive }) => cn('sidebar-item', isActive && 'active')}>
          <Settings className="h-4 w-4" />
          Profile
        </NavLink>

        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-brand text-xs text-white">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Flame className="h-3 w-3 text-orange-400" /> {user.streak_count} day streak
              </p>
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleLogout} className="sidebar-item mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out securely</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}

export function MobileNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-background/95 px-3 py-2 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <NavLink to="/dashboard" className="flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl gradient-brand">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="hidden font-black gradient-text sm:inline">OpenStudy</span>
        </NavLink>
        <nav className="flex flex-1 justify-end overflow-x-auto">
          <NavItems compact />
          <NavLink to="/profile" className={({ isActive }) => cn('flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] text-muted-foreground', isActive && 'bg-primary/15 text-primary')}>
            <Settings className="h-4 w-4" /> Profile
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

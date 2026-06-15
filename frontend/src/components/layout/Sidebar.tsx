import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'
import { toast } from 'sonner'
import {
  LayoutDashboard, BookOpen, Target, Users, BrainCircuit,
  LogOut, GraduationCap, Settings, Flame,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BookOpen, label: 'Study Rooms' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/matches', icon: Users, label: 'Find Partners' },
  { to: '/planner', icon: BrainCircuit, label: 'AI Planner' },
]

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
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight gradient-text">OpenStudy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active')
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: profile + settings */}
      <div className="px-3 pb-4 space-y-1 border-t border-[hsl(var(--sidebar-border))] pt-3">
        <NavLink
          to="/profile"
          className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Profile</span>
        </NavLink>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-xs gradient-brand text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="text-[11px] text-muted-foreground">{user.streak_count} day streak</span>
              </div>
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}

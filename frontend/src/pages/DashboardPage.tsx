import { useAuthStore } from '@/store/authStore'
import { useGoals } from '@/hooks/useGoals'
import { useRooms } from '@/hooks/useRooms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { Target, BookOpen, Flame, Trophy, ArrowRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/libs/utils'

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Target; label: string; value: string | number; color: string }) {
  return (
    <Card className="glass border-border/50">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const { data: goalsData, isLoading: goalsLoading } = useGoals()
  const { data: roomsData, isLoading: roomsLoading } = useRooms(5)

  const goals = goalsData ?? []
  const rooms = roomsData?.items ?? []
  const completedGoals = goals.filter(g => g.completed).length
  const pendingGoals = goals.filter(g => !g.completed).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {greeting},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'Studier'}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your study overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Day streak" value={user?.streak_count ?? 0} color="bg-orange-500" />
        <StatCard icon={Target} label="Goals done" value={completedGoals} color="bg-green-500" />
        <StatCard icon={Trophy} label="Pending goals" value={pendingGoals} color="bg-primary" />
        <StatCard icon={Users} label="Active rooms" value={rooms.length} color="bg-purple-500" />
      </div>

      {/* Recent goals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Recent Goals
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/goals" className="text-xs text-muted-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {goalsLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              : goals.slice(0, 5).length === 0
                ? <p className="text-muted-foreground text-sm py-4 text-center">No goals yet — <Link to="/goals" className="text-primary hover:underline">add your first</Link></p>
                : goals.slice(0, 5).map(g => (
                  <div key={g.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${g.completed ? 'bg-green-500' : 'bg-primary'}`} />
                    <span className={`text-sm flex-1 truncate ${g.completed ? 'line-through text-muted-foreground' : ''}`}>{g.title}</span>
                    {g.deadline && <span className="text-xs text-muted-foreground shrink-0">{formatDate(g.deadline)}</span>}
                  </div>
                ))
            }
          </CardContent>
        </Card>

        {/* Active rooms */}
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Study Rooms
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rooms" className="text-xs text-muted-foreground flex items-center gap-1">
                Browse <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {roomsLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : rooms.length === 0
                ? <p className="text-muted-foreground text-sm py-4 text-center">No rooms yet — <Link to="/rooms" className="text-primary hover:underline">create one</Link></p>
                : rooms.map(r => (
                  <Link key={r.id} to={`/rooms/${r.id}`} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.member_count} / {r.max_members} members</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{r.visibility}</Badge>
                  </Link>
                ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

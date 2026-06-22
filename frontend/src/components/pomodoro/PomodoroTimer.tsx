import { Pause, Play, RotateCcw, TimerReset, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime } from '@/lib/utils'
import type { PomodoroState } from '@/types'
import type { SocketStatus } from '@/hooks/useWebSocket'

type Props = {
  state: PomodoroState
  socketStatus: SocketStatus
  lastCloseReason?: string
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function PomodoroTimer({ state, socketStatus, lastCloseReason, onStart, onPause, onReset }: Props) {
  const total = Math.max(state.duration_secs || 1500, 1)
  const done = Math.min(100, Math.max(0, ((total - state.remaining_secs) / total) * 100))
  const connected = socketStatus === 'connected'
  const isRunning = state.status === 'active'

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TimerReset className="h-5 w-5 text-primary" /> Focus Workspace
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Synced Pomodoro for everyone inside this room.</p>
        </div>
        <Badge variant={connected ? 'default' : 'outline'} className="capitalize">
          {connected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
          {connected ? 'Live' : socketStatus}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-center">
        <div className="mx-auto grid h-64 w-64 place-items-center rounded-full p-3 shadow-2xl shadow-primary/20" style={{ background: `conic-gradient(hsl(var(--primary)) ${done}%, hsl(var(--secondary)) ${done}% 100%)` }}>
          <div className="grid h-full w-full place-items-center rounded-full border bg-card text-center">
            <div>
              <p className="text-6xl font-black tracking-tighter">{formatTime(state.remaining_secs)}</p>
              <p className="mt-2 text-sm font-medium capitalize text-muted-foreground">{state.status === 'completed' ? 'Session complete' : state.status}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className="mt-1 text-lg font-bold">Deep Work</p>
            </div>
            <div className="rounded-2xl border bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="mt-1 text-lg font-bold">{Math.round(done)}%</p>
            </div>
            <div className="rounded-2xl border bg-card/70 p-4">
              <p className="text-xs text-muted-foreground">Session</p>
              <p className="mt-1 text-lg font-bold">25 min</p>
            </div>
          </div>

          {!connected ? (
            <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {lastCloseReason || 'Disconnected. Start backend and Redis, then refresh this room.'}
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {isRunning ? (
              <Button size="lg" onClick={onPause} disabled={!connected}><Pause className="h-4 w-4" /> Pause</Button>
            ) : (
              <Button size="lg" onClick={onStart} disabled={!connected}><Play className="h-4 w-4" /> {state.status === 'paused' ? 'Resume' : 'Start Focus'}</Button>
            )}
            <Button size="lg" variant="outline" onClick={onReset} disabled={!connected}><RotateCcw className="h-4 w-4" /> Reset</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { Pause, Play, RotateCcw, TimerReset, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime } from '@/lib/utils'
import type { PomodoroState } from '@/types'
import type { SocketStatus } from '@/hooks/useWebSocket'

export function PomodoroTimer({ state, socketStatus, onStart, onPause, onReset }: { state: PomodoroState; socketStatus: SocketStatus; onStart: () => void; onPause: () => void; onReset: () => void }) {
  const denominator = Math.max(state.duration_secs || 1500, 1)
  const progress = Math.min(100, Math.max(0, ((denominator - state.remaining_secs) / denominator) * 100))
  const connected = socketStatus === 'connected'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-primary" /> Synced Pomodoro</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Everyone in this room sees the same timer.</p>
        </div>
        <Badge variant={connected ? 'default' : 'outline'}>
          {connected ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
          {connected ? 'Live' : socketStatus}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div
          className="grid h-56 w-56 place-items-center rounded-full p-3 shadow-2xl shadow-primary/10"
          style={{ background: `conic-gradient(hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}% 100%)` }}
        >
          <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-card text-center">
            <div>
              <p className="text-6xl font-black tracking-tighter">{formatTime(state.remaining_secs)}</p>
              <p className="mt-2 text-sm capitalize text-muted-foreground">{state.status === 'completed' ? 'Session complete' : state.status}</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {state.status === 'active' ? (
            <Button onClick={onPause} disabled={!connected}><Pause className="h-4 w-4" /> Pause</Button>
          ) : (
            <Button onClick={onStart} disabled={!connected}><Play className="h-4 w-4" /> {state.status === 'paused' ? 'Resume' : 'Start 25 min'}</Button>
          )}
          <Button variant="outline" onClick={onReset} disabled={!connected}><RotateCcw className="h-4 w-4" /> Reset</Button>
        </div>
      </CardContent>
    </Card>
  )
}

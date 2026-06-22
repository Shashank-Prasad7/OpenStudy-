import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Brain, Copy, DoorOpen, Lock, MessageCircle, Target, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { ErrorPanel, LoadingPanel } from '@/components/common/AsyncState'
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer'
import { SessionNoteDialog } from '@/components/pomodoro/SessionNoteDialog'
import { RoomMembers } from '@/components/rooms/RoomMembers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateSessionNote } from '@/hooks/useGoals'
import { useDeleteRoom, useJoinRoom, useLeaveRoom, useRoom } from '@/hooks/useRooms'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/store/authStore'
import { useRoomStore } from '@/store/roomStore'

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const roomQuery = useRoom(roomId)
  const joinRoom = useJoinRoom()
  const leaveRoom = useLeaveRoom()
  const deleteRoom = useDeleteRoom()
  const createNote = useCreateSessionNote()
  const { members: onlineMembers, pomodoro, reset } = useRoomStore()
  const [dismissedSession, setDismissedSession] = useState<string | null>(null)

  const room = roomQuery.data
  const isMember = useMemo(() => Boolean(room?.members.some(member => member.user.id === user?.id)), [room, user?.id])
  const isCreator = room?.created_by === user?.id
  const socket = useWebSocket(roomId, isMember)

  useEffect(() => reset, [reset, roomId])

  async function handleJoin() {
    if (!roomId) return
    try {
      await joinRoom.mutateAsync(roomId)
      toast.success('You joined the room')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to join the room'))
    }
  }

  async function handleLeave() {
    if (!roomId) return
    try {
      await leaveRoom.mutateAsync(roomId)
      reset()
      toast.success('You left the room')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to leave the room'))
    }
  }

  async function handleDelete() {
    if (!roomId || !window.confirm('Delete this room permanently?')) return
    try {
      await deleteRoom.mutateAsync(roomId)
      toast.success('Room deleted')
      navigate('/rooms')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to delete the room'))
    }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Room link copied')
  }

  function sendTimer(event: string, payload?: Record<string, unknown>) {
    if (!socket.send(event, payload)) toast.error('Real-time connection is not ready yet')
  }

  async function saveSessionNote(note: string) {
    if (!pomodoro.session_id) return
    try {
      await createNote.mutateAsync({ session_id: pomodoro.session_id, note_text: note })
      setDismissedSession(pomodoro.session_id)
      toast.success('Session note saved')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to save the note'))
    }
  }

  if (roomQuery.isLoading) return <LoadingPanel label="Opening the study room…" />
  if (roomQuery.isError || !room) return <ErrorPanel message={getApiError(roomQuery.error, 'Room not found')} onRetry={() => void roomQuery.refetch()} />

  const noteOpen = Boolean(isMember && pomodoro.status === 'completed' && pomodoro.session_id && dismissedSession !== pomodoro.session_id)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/rooms"><ArrowLeft className="h-4 w-4" /> All rooms</Link></Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void copyInvite()}><Copy className="h-4 w-4" /> Copy invite link</Button>
          {isCreator ? (
            <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleteRoom.isPending}><Trash2 className="h-4 w-4" /> Delete room</Button>
          ) : isMember ? (
            <Button variant="outline" size="sm" onClick={() => void handleLeave()} disabled={leaveRoom.isPending}><DoorOpen className="h-4 w-4" /> Leave</Button>
          ) : null}
        </div>
      </div>

      <Card className="mb-6 overflow-hidden border-primary/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge>{room.visibility === 'private' ? <Lock className="mr-1 h-3 w-3" /> : null}{room.visibility}</Badge>
                <Badge variant="outline"><Users className="mr-1 h-3 w-3" /> {room.member_count}/{room.max_members}</Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{room.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{room.description || 'A collaborative study room for focused work.'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {room.subject_tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </div>
            {!isMember ? <Button onClick={() => void handleJoin()} disabled={joinRoom.isPending}>{joinRoom.isPending ? 'Joining…' : 'Join room'}</Button> : null}
          </div>
        </CardContent>
      </Card>

      {!isMember ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Join to start studying together</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Membership unlocks live presence, the synchronized Pomodoro, and post-session notes.</p></CardContent>
        </Card>
      ) : (
        <>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/5">
            <CardContent className="flex items-center gap-3 p-5">
              <Target className="h-8 w-8 text-primary" />
              <div><p className="text-sm text-muted-foreground">Room Goal</p><p className="font-bold">Stay focused together</p></div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="flex items-center gap-3 p-5">
              <Users className="h-8 w-8 text-primary" />
              <div><p className="text-sm text-muted-foreground">Live Members</p><p className="font-bold">{onlineMembers.length} online</p></div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="flex items-center gap-3 p-5">
              <Brain className="h-8 w-8 text-primary" />
              <div><p className="text-sm text-muted-foreground">Focus Mode</p><p className="font-bold">Pomodoro workspace</p></div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <PomodoroTimer
            state={pomodoro}
            socketStatus={socket.status}
            onStart={() => sendTimer('pomodoro_start', { duration: 25 })}
            onPause={() => sendTimer('pomodoro_pause')}
            onReset={() => sendTimer('pomodoro_reset')}
            lastCloseReason={socket.lastCloseReason}
          />

          <div className="space-y-6">
            <RoomMembers online={onlineMembers} members={room.members} />
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Room Chat</CardTitle>
                <p className="text-sm text-muted-foreground">UI placeholder for messages/notes.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl bg-muted/60 p-3 text-sm">Share what you are studying now.</div>
                <div className="rounded-2xl bg-primary/10 p-3 text-sm">Use this panel later for chat or AI notes.</div>
              </CardContent>
            </Card>
          </div>
        </div>
        </>
      )}

      <SessionNoteDialog
        open={noteOpen}
        saving={createNote.isPending}
        onClose={() => setDismissedSession(pomodoro.session_id ?? null)}
        onSave={note => void saveSessionNote(note)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { EmptyState, ErrorPanel, LoadingPanel } from '@/components/common/AsyncState'
import { PageHeader } from '@/components/common/PageHeader'
import { CreateRoomForm } from '@/components/rooms/CreateRoomForm'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Button } from '@/components/ui/button'
import { useCreateRoom, useJoinRoom, useRooms } from '@/hooks/useRooms'

export default function RoomsPage() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const rooms = useRooms()
  const createRoom = useCreateRoom()
  const joinRoom = useJoinRoom()

  async function handleCreate(data: Parameters<typeof createRoom.mutateAsync>[0]) {
    try {
      const room = await createRoom.mutateAsync(data)
      toast.success('Study room created')
      navigate(`/rooms/${room.id}`)
    } catch (error) {
      toast.error(getApiError(error, 'Could not create the room'))
    }
  }

  async function handleJoin(id: string) {
    try {
      await joinRoom.mutateAsync(id)
      toast.success('Joined the room')
      navigate(`/rooms/${id}`)
    } catch (error) {
      toast.error(getApiError(error, 'Could not join the room'))
    }
  }

  return (
    <div>
      <PageHeader
        title="Study rooms"
        description="Join a focused room, see who is present in real time, and run one shared Pomodoro across every connected device."
        actions={<Button onClick={() => setShowCreate(value => !value)}><Plus className="h-4 w-4" /> Create room</Button>}
      />

      {showCreate ? <CreateRoomForm submitting={createRoom.isPending} onCancel={() => setShowCreate(false)} onSubmit={handleCreate} /> : null}

      {rooms.isLoading ? <LoadingPanel label="Finding active study rooms…" /> : null}
      {rooms.isError ? <ErrorPanel message={getApiError(rooms.error)} onRetry={() => void rooms.refetch()} /> : null}
      {rooms.data && rooms.data.items.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No public rooms yet"
          description="Create the first room and invite your teammates with its direct link."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create the first room</Button>}
        />
      ) : null}

      {rooms.data?.items.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{rooms.data.total} public room{rooms.data.total === 1 ? '' : 's'}</p>
            <Button variant="ghost" size="sm" onClick={() => void rooms.refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.data.items.map(room => (
              <RoomCard key={room.id} room={room} joining={joinRoom.isPending && joinRoom.variables === room.id} onJoin={() => void handleJoin(room.id)} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

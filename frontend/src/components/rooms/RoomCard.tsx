import { Link } from 'react-router-dom'
import { BookOpen, Lock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudyRoom } from '@/types'

export function RoomCard({ room, joining, onJoin }: { room: StudyRoom; joining: boolean; onJoin: () => void }) {
  const isFull = room.member_count >= room.max_members

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/10">
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <Badge variant={room.visibility === 'private' ? 'outline' : 'default'}>
            {room.visibility === 'private' ? <Lock className="mr-1 h-3 w-3" /> : null}
            {room.visibility}
          </Badge>
        </div>
        <CardTitle className="line-clamp-1">{room.name}</CardTitle>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {room.description || 'A focused room for consistent study sessions.'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex flex-wrap gap-2">
          {room.subject_tags.length ? room.subject_tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>) : <Badge variant="secondary">General</Badge>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4" /> {room.member_count}/{room.max_members} members
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline"><Link to={`/rooms/${room.id}`}>View</Link></Button>
            <Button size="sm" onClick={onJoin} disabled={joining || isFull}>{isFull ? 'Full' : joining ? 'Joining…' : 'Join'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

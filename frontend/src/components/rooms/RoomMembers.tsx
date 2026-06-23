import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials } from '@/lib/utils'
import type { PresenceMember, RoomMembership } from '@/types'

export function RoomMembers({ online, members }: { online: PresenceMember[]; members: RoomMembership[] }) {
  const onlineIds = new Set(online.map(member => member.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Members</CardTitle>
        <p className="text-sm text-muted-foreground">{online.length} online · {members.length} joined</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map(membership => {
          const member = membership.user
          const isOnline = onlineIds.has(member.id)
          return (
            <div key={membership.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback className="gradient-brand text-xs text-white">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">{isOnline ? 'Online now' : member.timezone}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

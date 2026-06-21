import { CheckCircle2, MapPin, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials } from '@/lib/utils'
import type { MatchSuggestion } from '@/types'

export function PartnerCard({ suggestion, accepting, onAccept }: { suggestion: MatchSuggestion; accepting: boolean; onAccept: () => void }) {
  const accepted = suggestion.match.status === 'accepted'
  const score = Math.round(suggestion.match.match_score * 100)

  return (
    <Card className="transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={suggestion.partner.avatar_url ?? undefined} />
            <AvatarFallback className="gradient-brand text-white">{getInitials(suggestion.partner.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{suggestion.partner.name}</CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {suggestion.partner.timezone}</p>
          </div>
          <Badge>{score}% match</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestion.reasons.map(reason => (
            <p key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {reason}
            </p>
          ))}
        </div>
        <Button className="mt-5 w-full" disabled={accepted || accepting} onClick={onAccept}>
          {accepted ? <><CheckCircle2 className="h-4 w-4" /> Partner accepted</> : accepting ? 'Accepting…' : 'Accept partner'}
        </Button>
      </CardContent>
    </Card>
  )
}

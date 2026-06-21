import type { ReactNode } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function LoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> {label}
      </CardContent>
    </Card>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-semibold">We couldn’t load this section.</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button> : null}
      </CardContent>
    </Card>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">{icon}</div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  )
}

import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/15 text-primary"><Compass className="h-7 w-7" /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-primary">404</p>
        <h1 className="mt-2 text-4xl font-black">This study path does not exist.</h1>
        <p className="mt-3 text-muted-foreground">Return to your dashboard and choose a real next step.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  )
}

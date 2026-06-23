import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'outline' | 'secondary' }) {
  const styles = {
    default: 'border-transparent bg-primary/15 text-primary',
    outline: 'border-border text-foreground/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
  }
  return <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', styles[variant], className)} {...props} />
}

import * as React from 'react'
import { Timer } from 'lucide-react'
import { cn } from '../../lib/utils'

const TTL_MS = 10 * 60 * 1000 // reservations live 10 minutes

/**
 * Live countdown for a reserved product/order. `reservedAt` is the
 * reservation timestamp; shows remaining time until the 10-min TTL.
 */
export function ReservationCountdown({ reservedAt, className }) {
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!reservedAt) return null
  const expiresAt = new Date(reservedAt).getTime() + TTL_MS
  const remaining = expiresAt - now

  if (remaining <= 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
        <Timer className="h-3 w-3" />
        expired
      </span>
    )
  }

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums text-warning',
        className
      )}
    >
      <Timer className="h-3 w-3" />
      {mins}:{String(secs).padStart(2, '0')}
    </span>
  )
}

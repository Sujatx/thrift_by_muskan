import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '../../lib/utils'

/**
 * KPI card: label, value, optional icon, optional delta (% vs prior period),
 * and optional sub-line. Renders a skeleton when `loading`.
 */
export function StatCard({ label, value, icon: Icon, delta, sub, loading, className }) {
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-24" />
        <Skeleton className="mt-3 h-3 w-16" />
      </Card>
    )
  }

  const up = typeof delta === 'number' && delta >= 0
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              up ? 'text-success' : 'text-danger'
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </Card>
  )
}

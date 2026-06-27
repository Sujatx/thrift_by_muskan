import { Badge } from '../../components/ui/badge'
import { PRODUCT_STATUS, ORDER_STATUS } from '../lib/format'
import { cn } from '../../lib/utils'

const DOT = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  default: 'bg-muted-foreground',
}

/**
 * Status pill with a leading dot. `kind` selects the status map.
 */
export function StatusBadge({ status, kind = 'product', className }) {
  const map = kind === 'order' ? ORDER_STATUS : PRODUCT_STATUS
  const meta = map[status] || { label: status || 'Unknown', variant: 'default' }
  return (
    <Badge variant={meta.variant} className={cn('capitalize', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[meta.variant] || DOT.default)} />
      {meta.label}
    </Badge>
  )
}

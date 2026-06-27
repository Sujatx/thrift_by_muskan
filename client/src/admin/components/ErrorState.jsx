import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/**
 * Error surface with the failure message and a retry action.
 */
export function ErrorState({ title = 'Something went wrong', error, onRetry, className }) {
  const message = typeof error === 'string' ? error : error?.message
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-danger/40 bg-danger-bg/40 px-6 py-14 text-center',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {message && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  )
}

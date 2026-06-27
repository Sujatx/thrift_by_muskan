import { Label } from '../../components/ui/label'
import { cn } from '../../lib/utils'

/**
 * Standard form row: label + control + hint/error. Pass the control as
 * children. `error` is the message string from react-hook-form.
 */
export function FormField({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

/**
 * Controlled confirmation dialog for destructive actions.
 *
 * Props: open, onOpenChange, title, description, confirmLabel, variant,
 * onConfirm (may be async), confirmText (if set, user must type it to enable).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  confirmText,
  onConfirm,
}) {
  const [loading, setLoading] = React.useState(false)
  const [typed, setTyped] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setTyped('')
      setLoading(false)
    }
  }, [open])

  const disabled = loading || (confirmText && typed.trim() !== confirmText)

  async function handleConfirm() {
    try {
      setLoading(true)
      await onConfirm?.()
      onOpenChange?.(false)
    } catch {
      // surfaced by caller via toast; keep dialog open
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {confirmText && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-text">
              Type <span className="font-mono font-semibold text-foreground">{confirmText}</span> to confirm
            </Label>
            <Input
              id="confirm-text"
              value={typed}
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} disabled={disabled}>
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

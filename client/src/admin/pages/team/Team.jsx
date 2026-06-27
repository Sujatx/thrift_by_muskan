import * as React from 'react'
import { useForm } from 'react-hook-form'
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  ShieldCheck,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FormField } from '../../components/FormField'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../components/ui/dropdown-menu'
import { useAsync } from '../../hooks/useAsync'
import { toast } from '../../../components/ui/sonner'
import { getAdmins, getInvites, createInvite, revokeInvite } from '../../../services/api'
import { formatDate, formatRelative } from '../../lib/format'

// ── Invite dialog ─────────────────────────────────────────────────────────────

function InviteDialog({ open, onOpenChange, onInvited }) {
  const [sending, setSending] = React.useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } })

  React.useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  async function onSubmit({ email }) {
    try {
      setSending(true)
      const result = await createInvite({ email })
      if (result.emailed) {
        toast.success(`Invite sent to ${email}`)
      } else {
        toast.success('Invite created (email not configured)')
      }
      onInvited?.()
      onOpenChange?.(false)
    } catch (err) {
      toast.error(err.message || 'Could not send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            An invite link will be sent to the email address. They can use it to create their
            admin account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email address" htmlFor="invite-email" required error={errors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
              placeholder="name@example.com"
            />
          </FormField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Team() {
  const {
    data: admins,
    loading: adminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
  } = useAsync(getAdmins, [])

  const {
    data: invites,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useAsync(getInvites, [])

  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [revokeTarget, setRevokeTarget] = React.useState(null)

  function handleInvited() {
    refetchInvites()
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    await revokeInvite(revokeTarget._id)
    toast.success('Invite revoked')
    refetchInvites()
  }

  const adminList = admins || []
  const inviteList = invites || []

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invite member
        </Button>
      </div>

      {/* Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Admins
            {!adminsLoading && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {adminList.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {adminsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)
          ) : adminsError ? (
            <div className="py-4 text-sm text-destructive">
              {adminsError.message || 'Failed to load admins.'}
              <Button variant="link" size="sm" onClick={refetchAdmins} className="ml-2 h-auto p-0">
                Retry
              </Button>
            </div>
          ) : adminList.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No admins found.</p>
          ) : (
            adminList.map((admin) => (
              <div key={admin._id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-semibold uppercase">
                    {admin.email?.[0] || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(admin.createdAt, 'dd MMM yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  Admin
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4" />
            Pending Invites
            {!invitesLoading && inviteList.length > 0 && (
              <Badge variant="warning" className="ml-1 text-xs">
                {inviteList.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {invitesLoading ? (
            Array.from({ length: 1 }).map((_, i) => <SkeletonRow key={i} />)
          ) : invitesError ? (
            <div className="py-4 text-sm text-destructive">
              {invitesError.message || 'Failed to load invites.'}
              <Button variant="link" size="sm" onClick={refetchInvites} className="ml-2 h-auto p-0">
                Retry
              </Button>
            </div>
          ) : inviteList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No pending invites</p>
              <p className="text-xs text-muted-foreground">
                Invite a team member to give them admin access.
              </p>
              <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Send invite
              </Button>
            </div>
          ) : (
            inviteList.map((invite) => (
              <div key={invite._id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {invite.email || 'No email — token-only invite'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {formatRelative(invite.expiresAt)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Invite actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setRevokeTarget(invite)}
                    >
                      <Trash2 />
                      Revoke invite
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={handleInvited}
      />

      <ConfirmDialog
        open={revokeTarget != null}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
        title="Revoke invite?"
        description={
          revokeTarget?.email
            ? `The invite sent to ${revokeTarget.email} will no longer work.`
            : 'This invite will no longer work.'
        }
        confirmLabel="Revoke"
        onConfirm={handleRevoke}
      />
    </div>
  )
}

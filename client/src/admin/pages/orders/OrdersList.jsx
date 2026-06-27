import * as React from 'react'
import {
  Search,
  ReceiptText,
  RefreshCw,
  ExternalLink,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
} from 'lucide-react'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { ReservationCountdown } from '../../components/ReservationCountdown'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../../../components/ui/sheet'
import { Separator } from '../../../components/ui/separator'
import { Badge } from '../../../components/ui/badge'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'
import { toast } from '../../../components/ui/sonner'
import {
  getAdminOrders,
  updateOrderStatus,
  refundOrder as apiRefundOrder,
} from '../../../services/api'
import {
  formatMoney,
  formatDate,
  formatRelative,
  orderRef,
} from '../../lib/format'

// ── Order detail sheet ────────────────────────────────────────────────────────

function OrderSheet({ order, open, onOpenChange, onUpdated }) {
  const [statusDraft, setStatusDraft] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [refundOpen, setRefundOpen] = React.useState(false)

  React.useEffect(() => {
    if (order) setStatusDraft(order.status)
  }, [order?._id, order?.status])

  if (!order) return null

  const items =
    order.items?.length > 0
      ? order.items
      : [
          {
            name: order.productName,
            image: order.productImage,
            salePrice: order.salePrice,
            size: order.size,
            quantity: 1,
          },
        ]

  const total = order.totalAmount || order.salePrice || 0

  async function handleStatusSave() {
    if (statusDraft === order.status) return
    try {
      setSaving(true)
      const updated = await updateOrderStatus(order._id, statusDraft)
      toast.success(`Status updated to ${statusDraft}`)
      onUpdated?.(updated)
    } catch (err) {
      toast.error(err.message || 'Could not update status')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefund() {
    const result = await apiRefundOrder(order._id)
    toast.success('Refund processed successfully')
    onUpdated?.({ ...order, status: 'refunded', ...result })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-mono">{orderRef(order._id)}</SheetTitle>
            <SheetDescription asChild>
              <div className="flex items-center gap-2 pt-0.5">
                <StatusBadge status={order.status} kind="order" />
                <span className="text-muted-foreground">
                  {formatDate(order.createdAt, 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Items
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMoney(item.salePrice)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
            </div>

            <Separator />

            {/* Customer */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Customer
              </div>
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">{order.customer?.name}</p>
                <p className="text-muted-foreground">{order.customer?.phone}</p>
                {order.customer?.email && (
                  <p className="text-muted-foreground">{order.customer.email}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Shipping Address
              </div>
              <div className="text-sm leading-relaxed text-muted-foreground">
                <p>{order.address?.line1}</p>
                {order.address?.line2 && <p>{order.address.line2}</p>}
                <p>
                  {order.address?.city}, {order.address?.state} —{' '}
                  {order.address?.pincode}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                Payment
              </div>
              <dl className="space-y-1 text-sm">
                {order.razorpayOrderId && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Razorpay Order</dt>
                    <dd className="truncate font-mono text-xs">{order.razorpayOrderId}</dd>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Payment ID</dt>
                    <dd className="truncate font-mono text-xs">{order.razorpayPaymentId}</dd>
                  </div>
                )}
                {order.paidAt && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid at</dt>
                    <dd>{formatDate(order.paidAt, 'dd MMM yyyy, HH:mm')}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Shipment */}
            {order.shipment?.awbCode && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    Shipment
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">AWB</dt>
                      <dd className="font-mono text-xs">{order.shipment.awbCode}</dd>
                    </div>
                    {order.shipment.courierName && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Courier</dt>
                        <dd>{order.shipment.courierName}</dd>
                      </div>
                    )}
                    {order.shipment.trackingUrl && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Track</dt>
                        <dd>
                          <a
                            href={order.shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View tracking <ExternalLink className="h-3 w-3" />
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </>
            )}

            {/* Reserved items countdown */}
            {order.status === 'pending' && order.reservedAt && (
              <>
                <Separator />
                <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Reservation expires</span>
                  <ReservationCountdown reservedAt={order.reservedAt} />
                </div>
              </>
            )}

            <Separator />

            {/* Status override */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Update Status
              </p>
              <div className="flex items-center gap-2">
                <Select value={statusDraft} onValueChange={setStatusDraft}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleStatusSave}
                  disabled={saving || statusDraft === order.status}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>

          <SheetFooter>
            {order.invoiceUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Invoice PDF
                </a>
              </Button>
            )}
            {order.status === 'paid' && (
              <Button variant="destructive" size="sm" onClick={() => setRefundOpen(true)}>
                Issue Refund
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Issue refund?"
        description={`This will refund ${formatMoney(total)} to the customer via Razorpay. The order will be marked as refunded. This cannot be undone.`}
        confirmLabel="Refund"
        onConfirm={handleRefund}
      />
    </>
  )
}

// ── Main list page ────────────────────────────────────────────────────────────

export default function OrdersList() {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)
  const [selectedOrder, setSelectedOrder] = React.useState(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, loading, error, refetch, setData } = useAsync(
    () =>
      getAdminOrders({
        q: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 50,
      }),
    [debouncedSearch, statusFilter, page]
  )

  const orders = data?.orders || []

  function handleUpdated(updated) {
    setData((prev) =>
      prev
        ? { ...prev, orders: prev.orders.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)) }
        : prev
    )
    setSelectedOrder((prev) => (prev?._id === updated._id ? { ...prev, ...updated } : prev))
  }

  const columns = [
    {
      key: 'ref',
      header: 'Order',
      sortable: true,
      sortValue: (o) => o.createdAt,
      render: (o) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium">{orderRef(o._id)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatDate(o.createdAt, 'dd MMM yyyy, h:mm a')}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (o) => o.customer?.name,
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{o.customer?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{o.customer?.phone}</p>
          {o.customer?.email && (
            <p className="truncate text-xs text-muted-foreground">{o.customer.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'shiprocketId',
      header: 'Shiprocket ID',
      render: (o) =>
        o.shipment?.shiprocketOrderId ? (
          <span className="font-mono text-xs">{o.shipment.shiprocketOrderId}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'paymentId',
      header: 'Payment ID',
      sortable: true,
      sortValue: (o) => o.paidAt,
      render: (o) =>
        o.razorpayPaymentId ? (
          <div className="min-w-0">
            <p className="font-mono text-xs">{o.razorpayPaymentId}</p>
            {o.paidAt && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDate(o.paidAt, 'dd MMM yyyy, h:mm a')}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (o) => {
        const count = o.items?.length || 1
        return (
          <span className="text-sm text-muted-foreground">{count}</span>
        )
      },
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      sortValue: (o) => o.totalAmount || o.salePrice || 0,
      align: 'right',
      render: (o) => (
        <span className="text-sm font-medium tabular-nums">
          {formatMoney(o.totalAmount || o.salePrice)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (o) => <StatusBadge status={o.status} kind="order" />,
    },
  ]

  return (
    <div className="space-y-5 pt-5">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background py-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order ref, shiprocket ID, razorpay ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={refetch} title="Refresh orders">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'order' : 'orders'}
        {search !== debouncedSearch && <span className="ml-2 opacity-50">searching…</span>}
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={refetch}
        onRowClick={(o) => setSelectedOrder(o)}
        noStickyHeader
        empty={{
          icon: ReceiptText,
          title:
            debouncedSearch || statusFilter !== 'all' ? 'No matching orders' : 'No orders yet',
          description:
            debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Orders placed on the storefront will appear here.',
        }}
      />

      {data?.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {data.pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <OrderSheet
        order={selectedOrder}
        open={selectedOrder != null}
        onOpenChange={(o) => !o && setSelectedOrder(null)}
        onUpdated={handleUpdated}
      />
    </div>
  )
}

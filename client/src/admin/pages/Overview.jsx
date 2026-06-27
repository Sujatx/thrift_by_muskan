import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from 'recharts'
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Timer,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { ErrorState } from '../components/ErrorState'
import { StatusBadge } from '../components/StatusBadge'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { useAsync } from '../hooks/useAsync'
import { getAnalyticsOverview } from '../../services/api'
import {
  formatMoney,
  formatMoneyCompact,
  formatRelative,
  orderRef,
} from '../lib/format'

const ACCENT = '#007aff'

function RevenueChart({ data }) {
  const points = (data || []).map((d) => ({
    date: d.date,
    revenue: d.revenue,
    label: new Date(d.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--admin-muted-fg)' }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--admin-muted-fg)' }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => formatMoneyCompact(v)}
        />
        <RTooltip
          cursor={{ stroke: 'var(--admin-border)' }}
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--popover-foreground)',
          }}
          labelStyle={{ color: 'var(--admin-muted-fg)' }}
          formatter={(value) => [formatMoney(value), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#revFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AttentionItem({ icon: Icon, count, label, to, tone }) {
  const tones = {
    warning: 'text-warning',
    danger: 'text-danger',
  }
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/60"
    >
      <Icon className={`h-4 w-4 ${tones[tone] || 'text-muted-foreground'}`} />
      <span className="text-sm">
        <span className="font-semibold text-foreground">{count}</span>{' '}
        <span className="text-muted-foreground">{label}</span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

const STATUS_ROWS = [
  { key: 'paid', label: 'Paid', cls: 'bg-success' },
  { key: 'pending', label: 'Pending', cls: 'bg-warning' },
  { key: 'failed', label: 'Failed', cls: 'bg-danger' },
  { key: 'refunded', label: 'Refunded', cls: 'bg-info' },
]

export default function Overview() {
  const { data, loading, error, refetch } = useAsync(getAnalyticsOverview, [])

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    )
  }

  const d = data || {}
  const counts = d.productCounts || {}
  const byStatus = d.ordersByStatus || {}
  const totalStatus =
    (byStatus.paid || 0) +
    (byStatus.pending || 0) +
    (byStatus.failed || 0) +
    (byStatus.refunded || 0)

  return (
    <div className="space-y-6 pt-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Revenue"
          icon={IndianRupee}
          value={formatMoney(d.totalRevenue)}
          sub="Paid orders"
        />
        <StatCard
          loading={loading}
          label="Orders"
          icon={ShoppingBag}
          value={d.totalOrders ?? 0}
          sub={`${byStatus.paid || 0} paid`}
        />
        <StatCard
          loading={loading}
          label="Conversion"
          icon={TrendingUp}
          value={`${d.conversionRate ?? 0}%`}
          sub="Paid / total"
        />
        <StatCard
          loading={loading}
          label="Inventory"
          icon={Package}
          value={counts.available ?? 0}
          sub={`${counts.reserved || 0} reserved · ${counts.sold || 0} sold`}
        />
      </div>

      {/* Needs attention */}
      {!loading && (
        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Needs attention
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AttentionItem
              icon={AlertTriangle}
              tone="warning"
              count={byStatus.pending || 0}
              label="orders pending"
              to="/admin/orders?status=pending"
            />
            <AttentionItem
              icon={Timer}
              tone="warning"
              count={counts.reserved || 0}
              label="items reserved"
              to="/admin/products?status=reserved"
            />
            <AttentionItem
              icon={XCircle}
              tone="danger"
              count={byStatus.failed || 0}
              label="failed payments"
              to="/admin/orders?status=failed"
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <RevenueChart data={d.revenueByDay} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))
            ) : (
              STATUS_ROWS.map((row) => {
                const value = byStatus[row.key] || 0
                const pct = totalStatus ? Math.round((value / totalStatus) * 100) : 0
                return (
                  <div key={row.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${row.cls}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + top categories */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : d.recentOrders && d.recentOrders.length > 0 ? (
              <ul className="divide-y divide-border">
                {d.recentOrders.map((o) => (
                  <li
                    key={o._id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {o.customer?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {orderRef(o._id)} · {formatRelative(o.paidAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(o.totalAmount)}
                    </span>
                    <StatusBadge kind="order" status="paid" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent paid orders.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))
            ) : d.topCategories && d.topCategories.length > 0 ? (
              (() => {
                const max = Math.max(...d.topCategories.map((c) => c.revenue || 0), 1)
                return d.topCategories.map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-foreground">{c.category}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(c.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(((c.revenue || 0) / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              })()
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No sales data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

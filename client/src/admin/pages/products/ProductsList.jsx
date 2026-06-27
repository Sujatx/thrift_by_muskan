import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Archive,
  RefreshCw,
  Shirt,
  ImageOff,
} from 'lucide-react'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { ReservationCountdown } from '../../components/ReservationCountdown'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Checkbox } from '../../../components/ui/checkbox'
import { Switch } from '../../../components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui/dropdown-menu'
import { useAsync } from '../../hooks/useAsync'
import { toast } from '../../../components/ui/sonner'
import {
  getAdminProducts,
  updateProductStatus,
  deleteProduct,
} from '../../../services/api'
import {
  formatMoney,
  PRODUCT_CATEGORIES,
} from '../../lib/format'

export default function ProductsList() {
  const navigate = useNavigate()
  const { data, loading, error, refetch, setData } = useAsync(getAdminProducts, [])

  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [status, setStatus] = React.useState('all')
  const [showArchived, setShowArchived] = React.useState(false)
  const [selected, setSelected] = React.useState(() => new Set())
  const [archiveTarget, setArchiveTarget] = React.useState(null) // product | 'bulk'

  const products = data || []

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (!showArchived && p.archived) return false
      if (showArchived && !p.archived) return false
      if (category !== 'all' && p.category !== category) return false
      if (status !== 'all' && p.status !== status) return false
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, search, category, status, showArchived])

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p._id))

  function toggleAll() {
    setSelected(() => {
      if (allSelected) return new Set()
      return new Set(filtered.map((p) => p._id))
    })
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function patchLocal(id, patch) {
    setData((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } : p)))
  }

  async function toggleStatus(p) {
    const next = p.status === 'sold' ? 'available' : 'sold'
    patchLocal(p._id, { status: next })
    try {
      const updated = await updateProductStatus(p._id, next)
      patchLocal(p._id, updated)
      toast.success(`Marked ${next}`)
    } catch (err) {
      patchLocal(p._id, { status: p.status })
      toast.error(err.message || 'Could not update status')
    }
  }

  async function doArchive() {
    const ids =
      archiveTarget === 'bulk' ? [...selected] : archiveTarget ? [archiveTarget._id] : []
    await Promise.all(ids.map((id) => deleteProduct(id)))
    setData((prev) =>
      prev.map((p) => (ids.includes(p._id) ? { ...p, archived: true, status: 'sold' } : p))
    )
    setSelected(new Set())
    toast.success(ids.length > 1 ? `${ids.length} products archived` : 'Product archived')
  }

  const columns = [
    {
      key: 'select',
      header: (
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleAll}
          aria-label="Select all"
        />
      ),
      className: 'w-10',
      render: (p) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected.has(p._id)}
            onCheckedChange={() => toggleOne(p._id)}
            aria-label="Select row"
          />
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (p) => {
        const img = p.thumbnailUrl || p.images?.[0]
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {img ? (
                <img src={img} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.name}</p>
              {p.tags?.length > 0 && (
                <p className="truncate text-xs text-muted-foreground">
                  {p.tags.slice(0, 3).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'productId',
      header: 'Product ID',
      render: (p) => <span className="font-mono text-xs text-muted-foreground">{p._id}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => <span className="capitalize text-muted-foreground">{p.category}</span>,
    },
    {
      key: 'salePrice',
      header: 'Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <div className="text-right">
          <span className="font-medium tabular-nums">{formatMoney(p.salePrice)}</span>
          {p.originalPrice > p.salePrice && (
            <span className="ml-1.5 text-xs text-muted-foreground line-through">
              {formatMoney(p.originalPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      align: 'center',
      render: (p) => <span className="text-muted-foreground">{p.size || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={p.status} />
          {p.status === 'reserved' && <ReservationCountdown reservedAt={p.reservedAt} />}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (p) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/products/${p._id}`)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStatus(p)}>
                <RefreshCw /> Mark {p.status === 'sold' ? 'available' : 'sold'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setArchiveTarget(p)}>
                <Archive /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5 pt-5">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background py-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          Archived
        </label>
        <Button className="sm:ml-auto" onClick={() => navigate('/admin/products/new')}>
          <Plus /> Add product
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-accent/40 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget('bulk')}>
              <Archive className="h-4 w-4" /> Archive
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={refetch}
        onRowClick={(p) => navigate(`/admin/products/${p._id}`)}
        noStickyHeader
        empty={{
          icon: Shirt,
          title: search || category !== 'all' || status !== 'all'
            ? 'No matching products'
            : 'No products yet',
          description:
            search || category !== 'all' || status !== 'all'
              ? 'Try adjusting your filters.'
              : 'Add your first product to start selling.',
          action: !search && category === 'all' && status === 'all' && (
            <Button onClick={() => navigate('/admin/products/new')}>
              <Plus /> Add product
            </Button>
          ),
        }}
      />

      <ConfirmDialog
        open={archiveTarget != null}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title={archiveTarget === 'bulk' ? `Archive ${selected.size} products?` : 'Archive product?'}
        description="Archived products are hidden from the storefront and any pending orders for them are cancelled. This can be reversed by editing the product."
        confirmLabel="Archive"
        onConfirm={doArchive}
      />
    </div>
  )
}

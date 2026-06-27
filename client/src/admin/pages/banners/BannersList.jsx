import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Plus,
  GalleryHorizontalEnd,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImageOff,
} from 'lucide-react'
import { DataTable } from '../../components/DataTable'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FormField } from '../../components/FormField'
import { ImageUploader } from '../../components/ImageUploader'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Switch } from '../../../components/ui/switch'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../../components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../../../components/ui/sheet'
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
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from '../../../services/api'
import { BANNER_TYPES } from '../../lib/format'
import { cn } from '../../../lib/utils'

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'hero_main', label: 'Hero Main' },
  { value: 'hero_secondary', label: 'Hero Secondary' },
  { value: 'promo', label: 'Promo' },
]

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  ctaText: '',
  ctaLink: '',
  type: 'hero_main',
  active: true,
}

// ── Banner form sheet ─────────────────────────────────────────────────────────

function BannerForm({ banner, open, onOpenChange, onSaved }) {
  const isEdit = Boolean(banner?._id)
  const [imageUrls, setImageUrls] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState('hero_main')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_FORM })

  React.useEffect(() => {
    if (!open) return
    if (banner) {
      reset({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        ctaText: banner.ctaText || '',
        ctaLink: banner.ctaLink || '',
        type: banner.type || 'hero_main',
        active: banner.active ?? true,
      })
      setImageUrls(banner.imageUrl ? [banner.imageUrl] : [])
      setSelectedType(banner.type || 'hero_main')
    } else {
      reset(EMPTY_FORM)
      setImageUrls([])
      setSelectedType('hero_main')
    }
  }, [open, banner, reset])

  async function onSubmit(values) {
    const payload = {
      ...values,
      type: selectedType,
      imageUrl: imageUrls[0] || '',
    }
    try {
      setSaving(true)
      if (isEdit) {
        const updated = await updateBanner(banner._id, payload)
        toast.success('Banner updated')
        onSaved?.(updated, 'update')
      } else {
        const created = await createBanner(payload)
        toast.success('Banner created')
        onSaved?.(created, 'create')
      }
      onOpenChange?.(false)
    } catch (err) {
      toast.error(err.message || 'Could not save banner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit banner' : 'New banner'}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto p-5"
        >
          {/* Image */}
          <FormField label="Image">
            <ImageUploader
              value={imageUrls}
              onChange={setImageUrls}
              single
              max={1}
              hint="1000 × 1000px min · 1:1 square"
            />
          </FormField>

          {/* Type */}
          <FormField label="Type" required>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BANNER_TYPES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    selectedType === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </FormField>

          {/* Title */}
          <FormField label="Title" required error={errors.title?.message}>
            <Input
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g. New arrivals this week"
            />
          </FormField>

          {/* Subtitle */}
          <FormField label="Subtitle" error={errors.subtitle?.message}>
            <Input
              {...register('subtitle')}
              placeholder="e.g. Shop the latest drops before they're gone"
            />
          </FormField>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="CTA Text">
              <Input {...register('ctaText')} placeholder="Shop now" />
            </FormField>
            <FormField label="CTA Link">
              <Input {...register('ctaLink')} placeholder="/category/tops" />
            </FormField>
          </div>

          {/* Active */}
          <FormField label="Visible on storefront">
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </FormField>

          {/* Footer inside scroll so it's always accessible */}
          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create banner'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Main list page ────────────────────────────────────────────────────────────

export default function BannersList() {
  const { data, loading, error, refetch, setData } = useAsync(getAdminBanners, [])
  const [activeTab, setActiveTab] = React.useState('all')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState(null)
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  const banners = data || []

  const filtered = React.useMemo(() => {
    if (activeTab === 'all') return banners
    return banners.filter((b) => b.type === activeTab)
  }, [banners, activeTab])

  function openNew() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(banner) {
    setEditTarget(banner)
    setFormOpen(true)
  }

  function handleSaved(saved, mode) {
    setData((prev) => {
      if (mode === 'create') return [...prev, saved]
      return prev.map((b) => (b._id === saved._id ? saved : b))
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteBanner(deleteTarget._id)
    setData((prev) => prev.filter((b) => b._id !== deleteTarget._id))
    toast.success('Banner deleted')
  }

  async function handleActiveToggle(banner) {
    const next = !banner.active
    setData((prev) => prev.map((b) => (b._id === banner._id ? { ...b, active: next } : b)))
    try {
      await updateBanner(banner._id, { active: next })
    } catch (err) {
      setData((prev) => prev.map((b) => (b._id === banner._id ? { ...b, active: banner.active } : b)))
      toast.error(err.message || 'Could not update banner')
    }
  }

  async function handleMove(banner, dir) {
    const list = [...banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    const idx = list.findIndex((b) => b._id === banner._id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= list.length) return

    const items = list.map((b, i) => {
      if (i === idx) return { id: b._id, sortOrder: list[swapIdx].sortOrder ?? swapIdx }
      if (i === swapIdx) return { id: b._id, sortOrder: list[idx].sortOrder ?? idx }
      return { id: b._id, sortOrder: b.sortOrder ?? i }
    })

    setData((prev) => {
      const updated = [...prev]
      const a = updated.find((b) => b._id === list[idx]._id)
      const b = updated.find((b) => b._id === list[swapIdx]._id)
      if (a && b) {
        const tmp = a.sortOrder
        a.sortOrder = b.sortOrder
        b.sortOrder = tmp
      }
      return [...updated]
    })

    try {
      await reorderBanners(items)
    } catch (err) {
      toast.error('Could not reorder banners')
      refetch()
    }
  }

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (b) =>
        b.imageUrl ? (
          <img src={b.imageUrl} alt="" className="h-10 w-14 rounded-md object-cover" />
        ) : (
          <div className="flex h-10 w-14 items-center justify-center rounded-md bg-muted">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{b.title}</p>
          {b.subtitle && (
            <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (b) => (
        <span className="text-sm text-muted-foreground">
          {BANNER_TYPES[b.type] || b.type}
        </span>
      ),
    },
    {
      key: 'ctaText',
      header: 'CTA',
      render: (b) =>
        b.ctaText ? (
          <span className="text-sm text-muted-foreground">{b.ctaText}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      key: 'active',
      header: 'Active',
      align: 'center',
      render: (b) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={b.active}
            onCheckedChange={() => handleActiveToggle(b)}
            aria-label={b.active ? 'Hide banner' : 'Show banner'}
          />
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      align: 'center',
      className: 'w-20',
      render: (b) => (
        <span
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleMove(b, 'up')}
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleMove(b, 'down')}
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (b) => (
        <span onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(b)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(b)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5 pt-5">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus /> New banner
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TYPE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TYPE_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <DataTable
              data={filtered}
              columns={columns}
              loading={loading}
              error={error}
              onRetry={refetch}
              onRowClick={(b) => openEdit(b)}
              empty={{
                icon: GalleryHorizontalEnd,
                title: activeTab === 'all' ? 'No banners yet' : `No ${BANNER_TYPES[activeTab] || activeTab} banners`,
                description: 'Create a banner to display on the storefront.',
                action: (
                  <Button onClick={openNew}>
                    <Plus /> New banner
                  </Button>
                ),
              }}
            />
          </TabsContent>
        ))}
      </Tabs>

      <BannerForm
        banner={editTarget}
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditTarget(null)
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete banner?"
        description="This will permanently remove the banner from the storefront."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}

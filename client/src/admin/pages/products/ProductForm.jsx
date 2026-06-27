import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, X } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import { FormField } from '../../components/FormField'
import { ImageUploader } from '../../components/ImageUploader'
import { ErrorState } from '../../components/ErrorState'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Switch } from '../../../components/ui/switch'
import { Skeleton } from '../../../components/ui/skeleton'
import { useAsync } from '../../hooks/useAsync'
import { toast } from '../../../components/ui/sonner'
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  getStoreSettings,
} from '../../../services/api'
import { formatMoney, PRODUCT_CATEGORIES } from '../../lib/format'
import { cn } from '../../../lib/utils'

const STATUSES = ['available', 'sold']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Free']

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useAsync(
    () => (isEdit ? getAdminProducts() : Promise.resolve(null)),
    [id]
  )
  const existing = isEdit && data ? data.find((p) => p._id === id) : null

  const { data: settings } = useAsync(getStoreSettings, [])
  const availableCategories = settings?.categories?.length ? settings.categories : PRODUCT_CATEGORIES

  const [category, setCategory] = React.useState('')
  const [size, setSize] = React.useState('')
  const [status, setStatus] = React.useState('available')
  const [archived, setArchived] = React.useState(false)
  const [images, setImages] = React.useState([])
  const [thumbnail, setThumbnail] = React.useState('')
  const [tags, setTags] = React.useState([])
  const [tagInput, setTagInput] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [touched, setTouched] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
      salePrice: '',
      originalPrice: '',
      description: '',
    },
  })

  // Hydrate form once the product loads.
  React.useEffect(() => {
    if (!existing) return
    reset({
      name: existing.name || '',
      salePrice: existing.salePrice ?? '',
      originalPrice: existing.originalPrice ?? '',
      description: existing.description || '',
    })
    setCategory(existing.category || '')
    setSize(existing.size || '')
    setStatus(existing.status === 'sold' ? 'sold' : 'available')
    setArchived(Boolean(existing.archived))
    setImages(existing.images || [])
    setThumbnail(existing.thumbnailUrl || existing.images?.[0] || '')
    setTags(existing.tags || [])
    // Reset scroll after hydration — form grows from skeleton height on data load
    requestAnimationFrame(() => {
      document.querySelector('main')?.scrollTo(0, 0)
    })
  }, [existing, reset])

  const dirty = isDirty || touched
  React.useEffect(() => {
    if (!dirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const sale = Number(watch('salePrice')) || 0
  const orig = Number(watch('originalPrice')) || 0
  const savingsPct = orig > sale && orig > 0 ? Math.round(((orig - sale) / orig) * 100) : 0

  function addTag(value) {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t) && t.length <= 50) setTags((p) => [...p, t])
    setTagInput('')
    setTouched(true)
  }

  function cancel() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    navigate('/admin/products')
  }

  async function onSubmit(values) {
    if (!category) {
      toast.error('Pick a category')
      return
    }
    if (!size) {
      toast.error('Pick a size')
      return
    }
    const payload = {
      name: values.name.trim(),
      category,
      salePrice: Number(values.salePrice),
      size,
      description: values.description?.trim() || '',
      images,
      thumbnailUrl: thumbnail || images[0] || '',
      tags,
    }
    if (values.originalPrice !== '' && values.originalPrice != null) {
      payload.originalPrice = Number(values.originalPrice)
    }
    if (isEdit) {
      payload.status = status
      payload.archived = archived
    }

    try {
      setSaving(true)
      if (isEdit) {
        await updateProduct(id, payload)
        toast.success('Product updated')
      } else {
        await createProduct(payload)
        toast.success('Product created')
      }
      setTouched(false)
      navigate('/admin/products')
    } catch (err) {
      toast.error(err.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && error) {
    return <ErrorState error={error} onRetry={refetch} />
  }
  if (isEdit && !loading && !existing) {
    return (
      <ErrorState
        title="Product not found"
        error="This product may have been deleted."
        onRetry={() => navigate('/admin/products')}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => setTouched(true)} className="space-y-5">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={cancel}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Products
        </button>
        <h1 className="truncate text-sm font-semibold">
          {isEdit ? existing?.name || 'Edit product' : 'New product'}
        </h1>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || (loading && isEdit)}>
            {saving ? 'Saving…' : 'Save product'}
          </Button>
        </div>
      </div>

      {loading && isEdit ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Details */}
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    placeholder="e.g. Vintage linen wrap dress"
                    {...register('name', {
                      required: 'Name is required',
                      maxLength: { value: 200, message: 'Max 200 characters' },
                    })}
                  />
                </FormField>

                <FormField label="Category" required>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c)
                          setTouched(true)
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                          category === c
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Size" required>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s)
                          setTouched(true)
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                          size === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Sale price (₹)"
                    htmlFor="salePrice"
                    required
                    error={errors.salePrice?.message}
                  >
                    <Input
                      id="salePrice"
                      type="number"
                      min="0"
                      placeholder="1200"
                      {...register('salePrice', {
                        required: 'Required',
                        min: { value: 0, message: 'Must be ≥ 0' },
                      })}
                    />
                  </FormField>
                  <FormField
                    label="Original price (₹)"
                    htmlFor="originalPrice"
                    hint={savingsPct > 0 ? `${savingsPct}% off` : 'Optional'}
                  >
                    <Input
                      id="originalPrice"
                      type="number"
                      min="0"
                      placeholder="2000"
                      {...register('originalPrice', {
                        min: { value: 0, message: 'Must be ≥ 0' },
                      })}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Description"
                  htmlFor="description"
                  error={errors.description?.message}
                >
                  <Textarea
                    id="description"
                    rows={4}
                    placeholder="Condition, fabric, measurements, styling notes…"
                    {...register('description', {
                      maxLength: { value: 2000, message: 'Max 2000 characters' },
                    })}
                  />
                </FormField>

                <FormField label="Tags" hint="Press Enter to add">
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-card p-2">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button
                          type="button"
                          onClick={() => {
                            setTags((p) => p.filter((x) => x !== t))
                            setTouched(true)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(tagInput)
                        }
                      }}
                      placeholder={tags.length ? '' : 'vintage, summer…'}
                      className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </FormField>
              </CardContent>
            </Card>
          </div>

          {/* Images + status */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  value={images}
                  onChange={(next) => {
                    setImages(next)
                    setTouched(true)
                  }}
                  thumbnail={thumbnail}
                  onThumbnailChange={(url) => {
                    setThumbnail(url)
                    setTouched(true)
                  }}
                  max={8}
                  hint="900 × 1200px min · 3:4 portrait"
                />
              </CardContent>
            </Card>

            {isEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStatus(s)
                          setTouched(true)
                        }}
                        className={cn(
                          'flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors',
                          status === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <span>Archived</span>
                    <Switch
                      checked={archived}
                      onCheckedChange={(v) => {
                        setArchived(v)
                        setTouched(true)
                      }}
                    />
                  </div>
                  {existing?.status === 'reserved' && (
                    <p className="text-xs text-warning">
                      Currently reserved by a pending checkout.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {sale > 0 && (
              <Card>
                <CardContent className="flex items-center justify-between pt-5">
                  <span className="text-sm text-muted-foreground">Price preview</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">{formatMoney(sale)}</span>
                    {savingsPct > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatMoney(orig)}
                      </span>
                    )}
                  </span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </form>
  )
}

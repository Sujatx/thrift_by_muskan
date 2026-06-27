import * as React from 'react'
import { useForm } from 'react-hook-form'
import { X, Plus, Store, AtSign, Phone, Instagram, AlignLeft, Tag } from 'lucide-react'
import { FormField } from '../components/FormField'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { useAsync } from '../hooks/useAsync'
import { toast } from '../../components/ui/sonner'
import { getStoreSettings, updateAdminSettings } from '../../services/api'

export default function Settings() {
  const { data, loading, error, refetch } = useAsync(getStoreSettings, [])
  const [categories, setCategories] = React.useState([])
  const [catInput, setCatInput] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [catsTouched, setCatsTouched] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      storeName: '',
      email: '',
      whatsapp: '+91',
      instagram: '',
      footerTagline: '',
    },
  })

  const dirty = isDirty || catsTouched

  React.useEffect(() => {
    if (!dirty) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  React.useEffect(() => {
    if (!data) return
    reset({
      storeName: data.storeName || '',
      email: data.email || '',
      whatsapp: data.whatsapp || '+91',
      instagram: data.instagram || '',
      footerTagline: data.footerTagline || '',
    })
    setCategories(data.categories || [])
    setCatsTouched(false)
  }, [data, reset])

  function addCategory() {
    const trimmed = catInput.trim().toLowerCase()
    if (!trimmed || categories.includes(trimmed)) { setCatInput(''); return }
    setCategories((prev) => [...prev, trimmed])
    setCatInput('')
    setCatsTouched(true)
  }

  function removeCategory(cat) {
    setCategories((prev) => prev.filter((c) => c !== cat))
    setCatsTouched(true)
  }

  function handleCatKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addCategory() }
  }

  async function onSubmit(values) {
    try {
      setSaving(true)
      await updateAdminSettings({ ...values, categories })
      reset(values)
      setCatsTouched(false)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 pt-5">
        <Card>
          <CardContent className="space-y-4 pt-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5 pt-5">
        <p className="text-sm text-destructive">{error.message || 'Failed to load settings.'}</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
        {dirty && (
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}

        {/* Store info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4" />
              Store Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Store name"
              htmlFor="storeName"
              required
              error={errors.storeName?.message}
              className="sm:col-span-2"
            >
              <Input
                id="storeName"
                {...register('storeName', { required: 'Store name is required' })}
                placeholder="Thrift by Muskan"
              />
            </FormField>

            <FormField label="Contact email" htmlFor="email">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="hello@example.com"
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField label="WhatsApp number" htmlFor="whatsapp">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  {...register('whatsapp')}
                  placeholder=""
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField label="Instagram handle" htmlFor="instagram">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="instagram"
                  {...register('instagram')}
                  placeholder=""
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField
              label="Footer tagline"
              htmlFor="footerTagline"
              className="sm:col-span-2"
            >
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="footerTagline"
                  {...register('footerTagline')}
                  placeholder="Made with care in Delhi."
                  className="pl-9"
                />
              </div>
            </FormField>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4" />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These categories are shown in the storefront filter bar and product forms.
            </p>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-sm capitalize text-foreground"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    aria-label={`Remove ${cat}`}
                    className="ml-0.5 rounded text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={handleCatKeyDown}
                placeholder="Add a category…"
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
                disabled={!catInput.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
    </form>
  )
}

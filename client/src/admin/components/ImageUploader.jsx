import * as React from 'react'
import { UploadCloud, X, Star, Loader2, GripVertical } from 'lucide-react'
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload'
import { toast } from '../../components/ui/sonner'
import { cn } from '../../lib/utils'

/**
 * Drag-and-drop image uploader (direct to Cloudinary).
 *
 * Props:
 *  - value: string[] of image URLs
 *  - onChange(urls)
 *  - thumbnail: currently selected thumbnail URL (multi mode)
 *  - onThumbnailChange(url)
 *  - single: boolean — one image only (e.g. banners), hides thumbnail star
 *  - max: number
 */
export function ImageUploader({
  value = [],
  onChange,
  thumbnail,
  onThumbnailChange,
  single = false,
  max = 8,
  hint,
}) {
  const { upload } = useCloudinaryUpload()
  const [dragOver, setDragOver] = React.useState(false)
  const [pending, setPending] = React.useState([]) // [{ id, progress }]
  const dragIndex = React.useRef(null)
  const inputRef = React.useRef(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return

    const room = single ? 1 : Math.max(0, max - value.length)
    const slice = single ? files.slice(0, 1) : files.slice(0, room)
    if (!single && files.length > room) {
      toast.warning(`Only ${room} more image${room === 1 ? '' : 's'} allowed`)
    }

    for (const file of slice) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`
      setPending((p) => [...p, { id, progress: 0 }])
      try {
        const url = await upload(file, (progress) =>
          setPending((p) => p.map((x) => (x.id === id ? { ...x, progress } : x)))
        )
        if (single) {
          onChange([url])
          onThumbnailChange?.(url)
        } else {
          onChange([...value, url])
          if (!thumbnail) onThumbnailChange?.(url)
        }
      } catch (err) {
        toast.error(err.message || 'Upload failed')
      } finally {
        setPending((p) => p.filter((x) => x.id !== id))
      }
    }
  }

  function removeAt(idx) {
    const url = value[idx]
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
    if (thumbnail === url) onThumbnailChange?.(next[0] || '')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  function reorder(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const showDropzone = single ? value.length === 0 && pending.length === 0 : value.length + pending.length < max

  return (
    <div className="space-y-3">
      <div className={cn('grid gap-3', single ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4')}>
        {value.map((url, idx) => {
          const isThumb = !single && thumbnail === url
          return (
            <div
              key={url}
              draggable={!single}
              onDragStart={() => (dragIndex.current = idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                reorder(dragIndex.current, idx)
                dragIndex.current = null
              }}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-md border bg-muted',
                isThumb ? 'border-primary ring-1 ring-primary' : 'border-border'
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />

              {!single && (
                <span className="absolute left-1 top-1 cursor-grab rounded bg-black/40 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!single ? (
                  <button
                    type="button"
                    onClick={() => onThumbnailChange?.(url)}
                    title={isThumb ? 'Thumbnail' : 'Set as thumbnail'}
                    className="rounded p-1 text-white hover:bg-white/20"
                  >
                    <Star className={cn('h-3.5 w-3.5', isThumb && 'fill-current text-warning')} />
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  title="Remove"
                  className="rounded p-1 text-white hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {isThumb && (
                <span className="absolute right-1 top-1 rounded-full bg-warning p-0.5 text-white">
                  <Star className="h-3 w-3 fill-current" />
                </span>
              )}
            </div>
          )
        })}

        {pending.map((p) => (
          <div
            key={p.id}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-muted"
          >
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
          </div>
        ))}

        {showDropzone && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition-colors',
              !single && value.length === 0
                ? 'col-span-full min-h-[200px]'
                : 'aspect-square',
              dragOver
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            <UploadCloud className="h-6 w-6" />
            <span className="px-4 text-xs leading-tight">
              {single ? 'Upload image' : 'Drag & drop or click to upload'}
            </span>
            {hint && (
              <span className="px-4 text-center text-[11px] leading-tight text-muted-foreground">
                {hint}
              </span>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {!single && value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag to reorder · click the star to set the thumbnail shown on cards.
        </p>
      )}
    </div>
  )
}

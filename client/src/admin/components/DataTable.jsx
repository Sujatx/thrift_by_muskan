import * as React from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table'
import { Skeleton } from '../../components/ui/skeleton'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { cn } from '../../lib/utils'

/**
 * Generic, self-contained data table that owns its loading / empty / error
 * states and (optional) client-side sorting.
 *
 * columns: [{ key, header, render(row), sortable, sortValue(row), align, className, headClassName }]
 * Props: data, columns, loading, error, onRetry, empty, getRowId, onRowClick,
 *        skeletonRows, initialSort ({ key, dir }).
 */
export function DataTable({
  data,
  columns,
  loading,
  error,
  onRetry,
  empty,
  getRowId = (row) => row._id,
  onRowClick,
  skeletonRows = 6,
  initialSort,
  className,
  noStickyHeader = false,
}) {
  const [sort, setSort] = React.useState(initialSort || null)

  const sorted = React.useMemo(() => {
    if (!sort || !data) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return data
    const valueOf = col.sortValue || ((row) => row[col.key])
    const arr = [...data].sort((a, b) => {
      const av = valueOf(a)
      const bv = valueOf(b)
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv), undefined, { numeric: true })
    })
    return sort.dir === 'desc' ? arr.reverse() : arr
  }, [data, sort, columns])

  function toggleSort(col) {
    if (!col.sortable) return
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: 'asc' }
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' }
      return null
    })
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <Table>
        <TableHeader className={cn('bg-muted/50 backdrop-blur', !noStickyHeader && 'sticky top-0 z-10')}>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const active = sort?.key === col.key
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none',
                    col.headClassName
                  )}
                  onClick={() => toggleSort(col)}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'flex-row-reverse'
                    )}
                  >
                    {col.header}
                    {col.sortable &&
                      (active ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      ))}
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sorted && sorted.length > 0 ? (
            sorted.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState
                  className="border-0"
                  icon={empty?.icon}
                  title={empty?.title || 'Nothing here yet'}
                  description={empty?.description}
                  action={empty?.action}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Minimal data-fetching hook: runs `fn` on mount (and when deps change),
 * tracks { data, loading, error }, exposes `refetch` and a `setData`
 * for optimistic updates. `fn` should return a promise.
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      if (mounted.current) setData(result)
    } catch (err) {
      if (mounted.current) setError(err)
    } finally {
      if (mounted.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    mounted.current = true
    run()
    return () => {
      mounted.current = false
    }
  }, [run])

  return { data, loading, error, refetch: run, setData }
}

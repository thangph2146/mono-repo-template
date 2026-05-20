import { useEffect, useMemo, useRef } from "react"

/**
 * Debounce with optional maxWait (invoke at latest after maxWait from first call).
 * Inline implementation to avoid lodash dependency.
 */
function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  options?: { maxWait?: number }
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let maxWaitId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> = [] as unknown as Parameters<T>

  const cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
    if (maxWaitId) clearTimeout(maxWaitId)
    timeoutId = null
    maxWaitId = null
  }

  const flush = () => {
    if (timeoutId) clearTimeout(timeoutId)
    if (maxWaitId) clearTimeout(maxWaitId)
    timeoutId = null
    maxWaitId = null
    fn(...lastArgs)
  }

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(flush, ms)
    if (options?.maxWait != null && maxWaitId === null) {
      maxWaitId = setTimeout(flush, options.maxWait)
    }
  }

  ;(debounced as T & { cancel: () => void }).cancel = cancel
  return debounced as T & { cancel: () => void }
}

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number
) {
  const funcRef = useRef<T>(fn)
  const debouncedRef = useRef<
    (((...args: Parameters<T>) => void) & { cancel: () => void }) | null
  >(null)

  useEffect(() => {
    funcRef.current = fn
  }, [fn])

  useEffect(() => {
    const debounced = debounce(
      ((...args: Parameters<T>) => {
        funcRef.current(...args)
      }) as T,
      ms,
      { maxWait }
    )
    debouncedRef.current = debounced
    return () => {
      debounced.cancel()
      debouncedRef.current = null
    }
  }, [ms, maxWait])

  return useMemo(() => {
    const run = (...args: Parameters<T>) => {
      debouncedRef.current?.(...args)
    }
    ;(run as unknown as { cancel: () => void }).cancel = () => {
      debouncedRef.current?.cancel()
    }
    return run as unknown as T & { cancel: () => void }
  }, [])
}

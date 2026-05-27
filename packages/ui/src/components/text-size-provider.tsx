"use client"

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
} from "react"

type TextSize = "sm" | "base" | "lg"

interface TextSizeContextValue {
  size: TextSize
  setSize: (s: TextSize) => void
}

const TextSizeContext = createContext<TextSizeContextValue | null>(null)

const STORAGE_KEY = "storesync-text-size"

const textSizeStore = {
  current: "base" as TextSize,
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  },
  getSnapshot(): TextSize {
    return this.current
  },
  setSize(s: TextSize) {
    this.current = s
    try {
      localStorage.setItem(STORAGE_KEY, s)
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-text-size", s)
    this.listeners.forEach((fn) => fn())
  },
}

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const size = useSyncExternalStore<TextSize>(
    (fn) => textSizeStore.subscribe(fn),
    () => textSizeStore.getSnapshot(),
    () => "base"
  )

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as TextSize
      if (stored === "sm" || stored === "base" || stored === "lg") {
        textSizeStore.setSize(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  const setSize = useCallback((s: TextSize) => {
    textSizeStore.setSize(s)
  }, [])

  return (
    <TextSizeContext.Provider value={{ size, setSize }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  const ctx = useContext(TextSizeContext)
  if (!ctx) throw new Error("useTextSize must be inside TextSizeProvider")
  return ctx
}

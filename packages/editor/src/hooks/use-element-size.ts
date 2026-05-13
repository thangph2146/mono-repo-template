import { useCallback, useState } from "react"
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect"

interface Size {
  width: number
  height: number
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  // Mutable values like 'ref.current' aren't valid dependencies
  // instead we manage the current node in state
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  // Prevent too many renders with useCallback
  const handleSize = useCallback(() => {
    if (!node) return
    
    setSize({
      width: node.offsetWidth || 0,
      height: node.offsetHeight || 0,
    })
  }, [node])

  useIsomorphicLayoutEffect(() => {
    if (!node) {
      return
    }

    handleSize()
    
    // Use ResizeObserver for better accuracy and performance
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        handleSize()
      })
      
      observer.observe(node)
      
      return () => {
        observer.disconnect()
      }
    }

    // Fallback to resize event
    window.addEventListener("resize", handleSize)
    return () => window.removeEventListener("resize", handleSize)
  }, [node, handleSize])

  return { ref: setNode, ...size }
}

import * as React from "react"
import { JSX } from "react"

/**
 * BrokenImage - Fallback component for when an image fails to load.
 */
export function BrokenImage(): JSX.Element {
  const transparentPixel = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"
  
  return (
    <div className="editor-broken-image-container">
      <img
        src={transparentPixel}
        alt="Broken Image"
      />
    </div>
  )
}

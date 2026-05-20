import { useEffect, useState, useCallback } from "react"
import { useElementSize } from "./use-element-size"

const PUBLIC_HEADER_SELECTOR = 'header[data-public-header="true"]'
const ADMIN_HEADER_SELECTOR = 'header[data-admin-header="true"]'

/**
 * Hook để đo chiều cao của header động trong editor
 */
export function useHeaderHeight() {
  const { ref: headerRef, height: headerHeightValue } =
    useElementSize<HTMLElement>()
  const [headerHeight, setHeaderHeight] = useState(0)

  const findAndSetHeader = useCallback(() => {
    if (typeof document === "undefined") {
      return null
    }

    // Ưu tiên tìm header với data-admin-header="true" hoặc data-public-header="true"
    let header =
      document.querySelector<HTMLElement>(ADMIN_HEADER_SELECTOR) ||
      document.querySelector<HTMLElement>(PUBLIC_HEADER_SELECTOR)

    // Fallback: đo header bằng cách tìm element header đầu tiên
    if (!header) {
      header = document.querySelector<HTMLElement>("header")
    }

    if (header) {
      headerRef(header)
      return header
    }

    return null
  }, [headerRef])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    // Tìm header ngay lập tức
    findAndSetHeader()

    // Retry tìm header nếu chưa tìm thấy (có thể do SSR hoặc component chưa mount)
    let retryCount = 0
    const maxRetries = 10
    const retryInterval = 100

    const retryTimer = setInterval(() => {
      const header = findAndSetHeader()
      if (header || retryCount >= maxRetries) {
        clearInterval(retryTimer)
      }
      retryCount++
    }, retryInterval)

    // Sử dụng MutationObserver để theo dõi khi header được thêm vào DOM
    const observer = new MutationObserver(() => {
      findAndSetHeader()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      clearInterval(retryTimer)
      observer.disconnect()
      headerRef(null)
    }
  }, [findAndSetHeader, headerRef])

  useEffect(() => {
    // Cập nhật headerHeight khi headerSize.height thay đổi
    if (headerHeightValue > 0) {
      setHeaderHeight(headerHeightValue)
    } else {
      // Nếu chưa có height, thử đo lại bằng getBoundingClientRect
      if (typeof document !== "undefined") {
        const header =
          document.querySelector<HTMLElement>(ADMIN_HEADER_SELECTOR) ||
          document.querySelector<HTMLElement>(PUBLIC_HEADER_SELECTOR) ||
          document.querySelector<HTMLElement>("header")
        if (header) {
          const rect = header.getBoundingClientRect()
          if (rect.height > 0) {
            setHeaderHeight(rect.height)
          }
        }
      }
    }
  }, [headerHeightValue])

  return { headerHeight }
}

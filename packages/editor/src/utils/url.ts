const SUPPORTED_URL_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
])

const OPENABLE_WEB_PROTOCOLS = new Set(["http:", "https:"])
const INCOMPLETE_WEB_URLS = new Set(["https://", "http://", "https:", "http:"])

const hasExplicitProtocol = (url: string): boolean =>
  /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)

const isRelativeUrl = (url: string): boolean =>
  url.startsWith("/") || url.startsWith("#") || url.startsWith("?")

const isIncompleteWebUrl = (url: string): boolean =>
  INCOMPLETE_WEB_URLS.has(url)

export function sanitizeUrl(url: string): string {
  const value = url.trim()
  if (isIncompleteWebUrl(value)) {
    return "about:blank"
  }
  if (isRelativeUrl(value) || !hasExplicitProtocol(value)) {
    return value
  }
  try {
    const parsedUrl = new URL(value)
    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return "about:blank"
    }
    // Prevent incomplete web URLs like "https:" or "https://".
    if (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      !parsedUrl.hostname
    ) {
      return "about:blank"
    }
  } catch {
    return value
  }
  return value
}

// Source: https://stackoverflow.com/a/8234912/2013580
const urlRegExp = new RegExp(
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
)
export function validateUrl(url: string): boolean {
  const value = url.trim()
  if (!value || isIncompleteWebUrl(value)) {
    return false
  }

  // Allow internal/relative links.
  if (isRelativeUrl(value)) {
    return true
  }

  // Absolute URL with protocol: validate via URL parser and protocol allow-list.
  if (hasExplicitProtocol(value)) {
    try {
      const parsed = new URL(value)
      if (!SUPPORTED_URL_PROTOCOLS.has(parsed.protocol)) {
        return false
      }
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        !parsed.hostname
      ) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  // Fallback for protocol-less values (domain/path) as before.
  return urlRegExp.test(value)
}

export function normalizeUrlForOpen(
  rawUrl: string,
  baseUrl?: string
): string | null {
  const value = rawUrl.trim()
  if (!value || isIncompleteWebUrl(value)) {
    return null
  }

  try {
    if (isRelativeUrl(value)) {
      if (!baseUrl) {
        return null
      }
      const parsedRelative = new URL(value, baseUrl)
      return parsedRelative.toString()
    }

    if (!hasExplicitProtocol(value)) {
      return null
    }

    const parsed = new URL(value)
    if (!OPENABLE_WEB_PROTOCOLS.has(parsed.protocol)) {
      return null
    }
    if (!parsed.hostname) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

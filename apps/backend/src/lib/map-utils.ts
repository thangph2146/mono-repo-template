const MAP_URL_COORDS_PATTERNS = [
  { regex: /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, latIdx: 1, lngIdx: 2 },
  { regex: /!3d(-?\d+\.?\d+)!2d(-?\d+\.?\d+)/, latIdx: 1, lngIdx: 2 },
  { regex: /!2d(-?\d+\.?\d+)!3d(-?\d+\.?\d+)/, latIdx: 2, lngIdx: 1 },
]

export function parseCoordsFromMapUrl(
  url: string
): { lat: number; lng: number } | null {
  if (!url) return null
  for (const { regex, latIdx, lngIdx } of MAP_URL_COORDS_PATTERNS) {
    const m = url.match(regex)
    if (m) {
      const lat = Number.parseFloat(m[latIdx])
      const lng = Number.parseFloat(m[lngIdx])
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
    }
  }
  return null
}

"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import type { Map as LeafletMap, DivIcon } from "leaflet"
import { parseCoordsFromMapUrl } from "@/lib/map-utils"
import "leaflet/dist/leaflet.css"

interface LocationMapProps {
  mapUrl: string
  name?: string
  address?: string
  className?: string
}

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

const RED_SVG =
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">',
    '<path fill="#dc2626" d="M12.5 0C5.6 0 0 5.6 0 12.5 0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>',
    '<circle cx="12.5" cy="12.5" r="5" fill="#fff"/></svg>',
  ].join("")

function RedMarker({
  coords,
  name,
  address,
}: {
  coords: { lat: number; lng: number }
  name?: string
  address?: string
}) {
  const markerRef = useRef<L.Marker>(null)
  const [icon, setIcon] = useState<DivIcon | null>(null)

  useEffect(() => {
    void import("leaflet").then((L) => {
      setIcon(
        L.divIcon({
          className: "",
          html: RED_SVG,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        })
      )
    })
  }, [])

  useEffect(() => {
    if (markerRef.current) markerRef.current.openPopup()
  }, [icon])

  if (!icon) return null

  return (
    <Marker ref={markerRef} position={[coords.lat, coords.lng]} icon={icon}>
      <Popup>
        <strong>{name || "Địa điểm"}</strong>
        {address && (
          <>
            <br />
            {address}
          </>
        )}
      </Popup>
    </Marker>
  )
}

export function LocationMap({
  mapUrl,
  name,
  address,
  className = "",
}: LocationMapProps) {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mapRef.current) mapRef.current.invalidateSize()
  })

  const coords = parseCoordsFromMapUrl(mapUrl)

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border/40 bg-muted/10 ${className}`}
        style={{ height: 300 }}
      >
        <p className="text-sm text-muted-foreground">Đang tải bản đồ…</p>
      </div>
    )
  }

  if (!coords) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-border/40 bg-muted/10 ${className}`}
        style={{ height: 300 }}
      >
        <p className="text-sm text-muted-foreground">
          Không thể xác định tọa độ từ URL bản đồ.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border/40 shadow-sm ${className}`}
    >
      <MapContainer
        ref={mapRef}
        center={[coords.lat, coords.lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: 600, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={TILE_URL}
        />
        <RedMarker coords={coords} name={name} address={address} />
      </MapContainer>
    </div>
  )
}

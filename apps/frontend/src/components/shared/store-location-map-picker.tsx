"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@ui/components/button";
import { Loader2, MapPin, MousePointerClick, Navigation } from "lucide-react";

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 };

const mapContainerClass = "w-full h-[380px] rounded-xl";

type Props = {
  /** Địa chỉ đang chỉnh (ô nhập + cập nhật từ bản đồ). */
  address: string;
  onAddressChange: (formattedAddress: string) => void;
  /**
   * Địa chỉ đã lưu trên server — chỉ để căn bản đồ khi `recenterSignal` đổi
   * (tránh geocode lại mỗi lần gõ phím).
   */
  snapshotAddress: string;
  /** Ví dụ `${user.id}-${user.updatedAt}` sau khi fetch/lưu. */
  recenterSignal: string;
  disabled?: boolean;
};

function MapFallbackEmbed({
  address,
  mapIframeUrl,
  mapExternalUrl,
}: {
  address: string;
  mapIframeUrl: string;
  mapExternalUrl: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-amber-800 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
        Thêm biến môi trường{" "}
        <code className="text-xs font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
        (Maps JavaScript API + Geocoding) để chọn vị trí trực tiếp trên bản đồ.
        Hiện đang hiển thị bản đồ nhúng theo địa chỉ đã nhập.
      </p>
      <div className="rounded-xl overflow-hidden border border-outline-variant/40 bg-muted/20">
        <iframe
          title="Google Map cửa hàng"
          src={mapIframeUrl}
          className={mapContainerClass}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Địa chỉ dùng cho bản đồ: {address.trim() || "—"}
      </p>
      <a href={mapExternalUrl} target="_blank" rel="noreferrer" className="block">
        <Button variant="outline" className="w-full" type="button">
          Mở Google Maps trong tab mới
        </Button>
      </a>
    </div>
  );
}

function InteractiveMap({
  googleMapsApiKey,
  address,
  snapshotAddress,
  recenterSignal,
  onAddressChange,
  disabled,
  mapIframeUrl,
  mapExternalUrl,
}: Props & {
  googleMapsApiKey: string;
  mapIframeUrl: string;
  mapExternalUrl: string;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "storesync-store-map",
    googleMapsApiKey,
    language: "vi",
    region: "VN",
  });

  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] =
    useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [geocoding, setGeocoding] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const reverseGeocode = useCallback(
    (latLng: google.maps.LatLngLiteral) => {
      if (!window.google?.maps) return;
      setGeocoding(true);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        setGeocoding(false);
        if (status !== "OK" || !results?.[0]?.formatted_address) {
          return;
        }
        onAddressChange(results[0].formatted_address);
      });
    },
    [onAddressChange],
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const pos = { lat, lng };
      setMarker(pos);
      setMapCenter(pos);
      setMapZoom(16);
      reverseGeocode(pos);
    },
    [disabled, reverseGeocode],
  );

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const pos = { lat, lng };
      setMarker(pos);
      reverseGeocode(pos);
    },
    [disabled, reverseGeocode],
  );

  const geocodeSearchText = useCallback(() => {
    const q = address.trim();
    if (!q || !window.google?.maps || disabled) return;
    setGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: q, region: "VN" }, (results, status) => {
      setGeocoding(false);
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        return;
      }
      const loc = results[0].geometry.location;
      const pos = { lat: loc.lat(), lng: loc.lng() };
      setMarker(pos);
      setMapCenter(pos);
      setMapZoom(16);
      map?.panTo(pos);
      if (results[0].formatted_address) {
        onAddressChange(results[0].formatted_address);
      }
    });
  }, [address, disabled, map, onAddressChange]);

  /** Căn bản đồ theo địa chỉ đã lưu khi tải / sau khi lưu (không theo từng phím gõ). */
  useEffect(() => {
    if (!isLoaded || !window.google?.maps || disabled) return;
    const q = snapshotAddress.trim();
    if (!q) {
      setMarker(null);
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(13);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    let cancelled = false;
    geocoder.geocode({ address: q, region: "VN" }, (results, status) => {
      if (cancelled) return;
      if (status !== "OK" || !results?.[0]?.geometry?.location) return;
      const loc = results[0].geometry.location;
      const pos = { lat: loc.lat(), lng: loc.lng() };
      setMarker(pos);
      setMapCenter(pos);
      setMapZoom(15);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, disabled, recenterSignal, snapshotAddress]);

  if (loadError) {
    return (
      <MapFallbackEmbed
        address={address}
        mapIframeUrl={mapIframeUrl}
        mapExternalUrl={mapExternalUrl}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`${mapContainerClass} border border-outline-variant/40 bg-muted/30 flex flex-col items-center justify-center gap-2`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải bản đồ…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <MousePointerClick className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-foreground">Click</strong> trên bản đồ hoặc{" "}
            <strong className="text-foreground">kéo ghim</strong> để lấy địa chỉ
            chuẩn hoá; dùng nút bên cạnh để tìm theo nội dung ô địa chỉ.
          </span>
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 rounded-lg"
          disabled={disabled || !address.trim() || geocoding}
          onClick={() => geocodeSearchText()}
        >
          {geocoding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="ml-2">Tìm theo ô địa chỉ</span>
        </Button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-outline-variant/40">
        {geocoding && (
          <div className="absolute inset-0 z-[1] bg-background/40 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <GoogleMap
          mapContainerClassName={mapContainerClass}
          center={mapCenter}
          zoom={mapZoom}
          onClick={onMapClick}
          onLoad={(m) => setMap(m)}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy",
            clickableIcons: false,
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable={!disabled}
              onDragEnd={onMarkerDragEnd}
              title="Vị trí cửa hàng"
            />
          )}
        </GoogleMap>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" />
        <span>
          {marker
            ? `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`
            : "Chưa chọn điểm trên bản đồ"}
        </span>
      </div>

      <a href={mapExternalUrl} target="_blank" rel="noreferrer" className="block">
        <Button variant="outline" className="w-full" type="button">
          Mở Google Maps trong tab mới
        </Button>
      </a>
    </div>
  );
}

/**
 * Bản đồ chọn địa chỉ cửa hàng: API key → Maps JS + Geocoding; không có key → iframe.
 */
export function StoreLocationMapPicker(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  const mapQuery = useMemo(() => {
    const q =
      props.address.trim() ||
      props.snapshotAddress.trim() ||
      "Thành phố Hồ Chí Minh";
    return encodeURIComponent(q);
  }, [props.address, props.snapshotAddress]);
  const mapIframeUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  if (!apiKey) {
    return (
      <MapFallbackEmbed
        address={props.address}
        mapIframeUrl={mapIframeUrl}
        mapExternalUrl={mapExternalUrl}
      />
    );
  }

  return (
    <InteractiveMap
      {...props}
      googleMapsApiKey={apiKey}
      mapIframeUrl={mapIframeUrl}
      mapExternalUrl={mapExternalUrl}
    />
  );
}

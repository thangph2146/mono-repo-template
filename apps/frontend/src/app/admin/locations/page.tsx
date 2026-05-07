"use client";

import { useMemo, useState } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Ho Chi Minh City Coordinates
const center = {
  lat: 10.762622,
  lng: 106.660172
};

const stores = [
  { id: 1, name: "Tạp hóa Số 1", address: "Quận 1, HCM", lat: 10.776889, lng: 106.700806, status: "Active" },
  { id: 2, name: "Minimart Hoa Mai", address: "Quận 3, HCM", lat: 10.781846, lng: 106.685376, status: "Active" },
  { id: 3, name: "Đại lý Cấp 2 - Bình Tân", address: "Bình Tân, HCM", lat: 10.751334, lng: 106.602698, status: "Warning" },
  { id: 4, name: "Cửa hàng Tiện lợi 24h", address: "Quận 7, HCM", lat: 10.730301, lng: 106.711581, status: "Inactive" },
];

export default function StoreLocationsPage() {
  // To make the map work in a real environment, replace "YOUR_GOOGLE_MAPS_API_KEY"
  // with a valid key from Google Cloud Console.
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
  });

  const [selectedStore, setSelectedStore] = useState<typeof stores[0] | null>(null);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    clickableIcons: true,
    scrollwheel: true,
  }), []);

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Store Locations</h1>
        <Skeleton className="w-full h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full min-h-[80vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Locations</h1>
          <p className="text-muted-foreground">Geographical distribution of all registered B2B dealers.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-success text-success-foreground hover:bg-success">Active: 2</Badge>
          <Badge className="bg-warning text-warning-foreground hover:bg-warning">Warning: 1</Badge>
          <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">Inactive: 1</Badge>
        </div>
      </div>

      <Card className="flex-grow border-border shadow-md overflow-hidden relative">
        <CardContent className="p-0 h-[600px] w-full relative">
          {/* Note: Map might show "Development purposes only" if API Key is invalid */}
          <GoogleMap
            zoom={12}
            center={center}
            mapContainerClassName="w-full h-full"
            options={mapOptions}
          >
            {stores.map((store) => (
              <Marker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => setSelectedStore(store)}
                icon={{
                  url: store.status === 'Active' 
                    ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : store.status === 'Warning'
                    ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                    : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
            ))}

            {selectedStore && (
              <InfoWindow
                position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                onCloseClick={() => setSelectedStore(null)}
              >
                <div className="p-2 space-y-2 min-w-[200px] text-foreground">
                  <h3 className="font-bold text-lg">{selectedStore.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStore.address}</p>
                  <Badge 
                    className={
                      selectedStore.status === 'Active' ? 'bg-success text-white' :
                      selectedStore.status === 'Warning' ? 'bg-warning text-white' :
                      'bg-destructive text-white'
                    }
                  >
                    {selectedStore.status}
                  </Badge>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
          
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border w-64">
            <h4 className="font-bold mb-2">Location Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div> Active (Healthy)</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning"></div> Low Activity</span>
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive"></div> Inactive</span>
                <span className="font-bold">1</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

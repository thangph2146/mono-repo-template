"use client";

import { useState } from "react";
import { Search, MapPin, ExternalLink, Navigation } from "lucide-react";
import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";

const stores = [
  { id: 1, name: "Tạp hóa Số 1", address: "Quận 1, HCM", lat: 10.776889, lng: 106.700806, status: "Active" },
  { id: 2, name: "Minimart Hoa Mai", address: "Quận 3, HCM", lat: 10.781846, lng: 106.685376, status: "Active" },
  { id: 3, name: "Đại lý Cấp 2 - Bình Tân", address: "Bình Tân, HCM", lat: 10.751334, lng: 106.602698, status: "Warning" },
  { id: 4, name: "Cửa hàng Tiện lợi 24h", address: "Quận 7, HCM", lat: 10.730301, lng: 106.711581, status: "Inactive" },
];

export default function StoreLocationsPage() {
  const [selectedStore, setSelectedStore] = useState<typeof stores[0]>(stores[0]);

  const mapQuery = encodeURIComponent(selectedStore.address + " " + selectedStore.name);
  const mapIframeUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        {/* Store List */}
        <Card className="py-0 lg:col-span-1 border-border shadow-md overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm cửa hàng..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedStore.id === store.id
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "border-transparent hover:bg-muted/50"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-foreground">{store.name}</h3>
                  <Badge
                    className={
                      store.status === 'Active' ? 'bg-success/15 text-success border-success/20' :
                        store.status === 'Warning' ? 'bg-warning/15 text-warning border-warning/20' :
                          'bg-destructive/15 text-destructive border-destructive/20'
                    }
                  >
                    {store.status}
                  </Badge>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 mt-0.5 shrink-0" />
                  <p className="line-clamp-2">{store.address}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Map Display */}
        <Card className="p-0 lg:col-span-2 border-border shadow-md overflow-hidden flex flex-col relative min-h-[500px]">
          <div className="flex-grow w-full relative bg-muted/10">
            <iframe
              title="Google Map cửa hàng"
              src={mapIframeUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border w-64 pointer-events-none sm:block hidden">
              <h4 className="font-bold mb-2">Thông tin vị trí</h4>
              <div className="space-y-1">
                <p className="text-sm font-bold">{selectedStore.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStore.address}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="size-4 text-primary" />
              <span>Đang hiển thị vị trí của {selectedStore.name}</span>
            </div>
            <a href={mapExternalUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="size-4" />
                Mở trong Google Maps
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

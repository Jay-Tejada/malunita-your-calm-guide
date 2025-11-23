import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapFullScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  address?: string;
  accessToken?: string;
}

export const MapFullScreen = ({
  open,
  onOpenChange,
  lat,
  lng,
  address,
  accessToken,
}: MapFullScreenProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!open || !mapContainer.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [lng, lat],
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
      }),
      "top-right"
    );

    // Add marker
    marker.current = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Add popup if address exists
    if (address) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(address);
      marker.current.setPopup(popup);
      popup.addTo(map.current);
    }

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [open, lat, lng, address, accessToken]);

  if (!accessToken) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="py-8 text-center space-y-2">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">
              Map preview unavailable
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 gap-0">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
          {address && (
            <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border max-w-md">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="font-mono text-[13px] text-foreground break-words">
                  {address}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="bg-background/95 backdrop-blur-sm shadow-lg flex-shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Map */}
        <div ref={mapContainer} className="w-full h-[95vh]" />
      </DialogContent>
    </Dialog>
  );
};

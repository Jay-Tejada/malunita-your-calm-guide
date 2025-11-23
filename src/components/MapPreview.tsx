import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

interface MapPreviewProps {
  lat: number;
  lng: number;
  address?: string;
  accessToken?: string;
}

export const MapPreview = ({ lat, lng, address, accessToken }: MapPreviewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [lng, lat],
      zoom: 14,
      interactive: true,
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

    // Add popup if address is provided
    if (address) {
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setText(address);
      marker.current.setPopup(popup);
    }

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [lat, lng, address, accessToken]);

  if (!accessToken) {
    return (
      <div className="w-full h-[200px] rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-2">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">
            Map preview unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

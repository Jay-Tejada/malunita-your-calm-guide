import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Check } from "lucide-react";

interface MapboxLocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  accessToken?: string;
  isTokenLoading?: boolean;
}

export const MapboxLocationPicker = ({
  open,
  onOpenChange,
  onConfirm,
  accessToken,
  isTokenLoading = false,
}: MapboxLocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoderContainer = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!open || !mapContainer.current || !accessToken) return;

    // Small delay to ensure dialog is fully rendered
    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = accessToken;

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        "top-right"
      );

      // Initialize geocoder
      if (geocoderContainer.current) {
        const geocoder = new MapboxGeocoder({
          accessToken: accessToken,
          mapboxgl: mapboxgl as any,
          marker: false,
          placeholder: "Search for a location",
        });

        geocoderContainer.current.appendChild(geocoder.onAdd(map.current));

        // Handle geocoder result
        geocoder.on("result", (e) => {
          const { center, place_name } = e.result;
          addMarker(center[1], center[0], place_name);
        });
      }

      // Click to add marker
      map.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        
        // Reverse geocode to get address
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`
        )
          .then((res) => res.json())
          .then((data) => {
            const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            addMarker(lat, lng, address);
          })
          .catch(() => {
            addMarker(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          });
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      marker.current?.remove();
      map.current?.remove();
    };
  }, [open, accessToken]);

  const addMarker = (lat: number, lng: number, address: string) => {
    if (!map.current) return;

    // Remove existing marker
    marker.current?.remove();

    // Add new marker
    marker.current = new mapboxgl.Marker({ color: "#3b82f6", draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Update selected location
    setSelectedLocation({ address, lat, lng });

    // Center map on marker
    map.current.flyTo({ center: [lng, lat], zoom: 14 });

    // Handle marker drag
    marker.current.on("dragend", () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      
      // Reverse geocode new position
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${accessToken}`
      )
        .then((res) => res.json())
        .then((data) => {
          const newAddress = data.features[0]?.place_name || `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`;
          setSelectedLocation({
            address: newAddress,
            lat: lngLat.lat,
            lng: lngLat.lng,
          });
        });
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
      onOpenChange(false);
      setSelectedLocation(null);
    }
  };

  if (isTokenLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-mono text-[16px]">Pick Location</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">
              Loading map...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!accessToken) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-mono text-[16px]">Location Picker</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center space-y-2">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">
              Mapbox token not configured. Contact support.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-mono text-[16px]">Pick Location</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Geocoder search */}
          <div ref={geocoderContainer} className="mapbox-geocoder-container" />
          
          {/* Map */}
          <div 
            ref={mapContainer} 
            className="w-full h-[400px] rounded-lg border border-border overflow-hidden"
          />
          
          {/* Selected location info */}
          {selectedLocation && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[13px] text-foreground break-words">
                    {selectedLocation.address}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-mono text-[14px]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-mono text-[14px]"
              onClick={handleConfirm}
              disabled={!selectedLocation}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

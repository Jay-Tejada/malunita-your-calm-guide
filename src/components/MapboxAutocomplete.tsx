import { useEffect, useRef, useState } from "react";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Input } from "@/components/ui/input";

interface MapboxAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  accessToken?: string;
}

export const MapboxAutocomplete = ({
  value,
  onChange,
  placeholder = "Search for a location",
  accessToken,
}: MapboxAutocompleteProps) => {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const [geocoder, setGeocoder] = useState<MapboxGeocoder | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setShowTokenWarning(true);
      return;
    }

    if (!geocoderContainerRef.current) return;

    // Initialize Mapbox Geocoder
    const newGeocoder = new MapboxGeocoder({
      accessToken: accessToken,
      types: "address,poi",
      placeholder: placeholder,
      mapboxgl: undefined, // We don't need the map here
    });

    geocoderContainerRef.current.appendChild(newGeocoder.onAdd());
    setGeocoder(newGeocoder);

    // Handle result selection
    newGeocoder.on("result", (e) => {
      const place = e.result;
      onChange(
        place.place_name,
        place.center[1], // latitude
        place.center[0]  // longitude
      );
    });

    // Handle clear
    newGeocoder.on("clear", () => {
      onChange("", undefined, undefined);
    });

    return () => {
      newGeocoder.onRemove();
    };
  }, [accessToken, placeholder, onChange]);

  if (!accessToken || showTokenWarning) {
    return (
      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-[14px]"
        />
        {showTokenWarning && (
          <p className="text-xs text-muted-foreground font-mono">
            Add your Mapbox token in Settings → Cloud → Secrets to enable location search
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={geocoderContainerRef} 
      className="mapbox-geocoder-container font-mono text-[14px]"
    />
  );
};

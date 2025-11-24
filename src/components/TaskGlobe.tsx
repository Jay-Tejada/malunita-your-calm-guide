import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';

interface TaskLocation {
  id: string;
  title: string;
  lat: number;
  lng: number;
  completed: boolean;
}

export const TaskGlobe = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { tasks } = useTasks();
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch Mapbox token from backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: { name: 'globe' },
      zoom: 1.5,
      center: [30, 15],
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Disable scroll zoom for smoother experience
    map.current.scrollZoom.disable();

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(245, 241, 232)',
        'high-color': 'rgb(230, 220, 200)',
        'horizon-blend': 0.3,
      });
    });

    // Rotation animation settings
    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;
    let spinEnabled = true;

    // Spin globe function
    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    // Event listeners for interaction
    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('dragstart', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });
    
    map.current.on('touchend', () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on('moveend', () => {
      spinGlobe();
    });

    // Start the globe spinning
    spinGlobe();

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add task markers
  useEffect(() => {
    if (!map.current || !tasks) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter tasks with location data
    const tasksWithLocation: TaskLocation[] = tasks
      .filter(task => task.location_lat && task.location_lng)
      .map(task => ({
        id: task.id,
        title: task.title,
        lat: task.location_lat!,
        lng: task.location_lng!,
        completed: task.completed || false,
      }));

    // Add markers for each task
    tasksWithLocation.forEach(task => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'task-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = task.completed ? '#9B8C7A' : '#8B4513';
      el.style.border = '2px solid #F5F1E8';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.5)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([task.lng, task.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="font-family: monospace; padding: 4px;">
                <strong style="color: #3B352B; font-size: 13px;">${task.title}</strong>
                ${task.completed ? '<div style="color: #7D7467; font-size: 11px; margin-top: 4px;">✓ Completed</div>' : ''}
              </div>
            `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [tasks]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground font-mono">
          Loading globe...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-background">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-1">Task Globe</h3>
        <p className="text-xs text-muted-foreground font-mono">
          {tasks?.filter(t => t.location_lat && t.location_lng).length || 0} tasks with locations
        </p>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground font-mono">
          Click & drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OperationsMapProps {
  markers?: {
    id: string;
    lng: number;
    lat: number;
    type: 'vehicle' | 'shelter' | 'alert' | 'resource';
    label: string;
  }[];
}

export function OperationsMap({ markers = [] }: OperationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on MG Road area, Bangalore
    map.current = L.map(mapContainer.current, {
      center: [12.9750, 77.6070],
      zoom: 17,
      zoomControl: true,
    });

    // Use CartoDB dark tiles (free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map.current);

    // Mark map as ready after tiles load
    map.current.whenReady(() => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, []);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const colors: Record<string, string> = {
      vehicle: '#00d9ff',
      shelter: '#22c55e',
      alert: '#f59e0b',
      resource: '#a855f7',
    };

    markers.forEach(markerData => {
      const color = colors[markerData.type];
      
      // Create custom icon with inline styles
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 12px ${color}, 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([markerData.lat, markerData.lng], { icon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="color: #0a0f19; padding: 8px; min-width: 150px;">
            <strong style="font-size: 14px;">${markerData.label}</strong><br/>
            <span style="text-transform: capitalize; color: ${color}; font-weight: 500;">${markerData.type}</span>
          </div>
        `);

      markersRef.current.push(marker);
    });
  }, [markers, mapReady]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-lg">
          <div className="text-muted-foreground text-sm">Loading map...</div>
        </div>
      )}
    </div>
  );
}

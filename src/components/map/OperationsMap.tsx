import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on Central Bangalore
    map.current = L.map(mapContainer.current, {
      center: [12.9716, 77.5946],
      zoom: 15,
      zoomControl: true,
    });

    // Use CartoDB dark tiles (free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current) return;

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
      
      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px ${color}80;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([markerData.lat, markerData.lng], { icon })
        .addTo(map.current!)
        .bindPopup(`
          <div style="color: #0a0f19; padding: 4px;">
            <strong>${markerData.label}</strong><br/>
            <span style="text-transform: capitalize; color: ${color};">${markerData.type}</span>
          </div>
        `);

      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
}

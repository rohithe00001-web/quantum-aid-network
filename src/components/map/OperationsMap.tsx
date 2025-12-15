import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, AlertTriangle } from 'lucide-react';

interface OperationsMapProps {
  mapboxToken: string;
  markers?: {
    id: string;
    lng: number;
    lat: number;
    type: 'vehicle' | 'shelter' | 'alert' | 'resource';
    label: string;
  }[];
}

export function OperationsMap({ mapboxToken, markers = [] }: OperationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Check for WebGL support before initializing
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setMapError('WebGL is not supported in this browser. Please try a different browser or enable hardware acceleration.');
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-95.7129, 37.0902],
        zoom: 4,
        pitch: 30,
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Map failed to load. Please check your Mapbox token.');
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(10, 15, 25)',
          'high-color': 'rgb(20, 30, 50)',
          'horizon-blend': 0.1,
        });
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map. WebGL may not be available.');
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add markers when they change
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const colors = {
        vehicle: '#00d9ff',
        shelter: '#22c55e',
        alert: '#f59e0b',
        resource: '#a855f7',
      };

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: ${colors[markerData.type]};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${colors[markerData.type]}80;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="color: #0a0f19; padding: 4px;">
              <strong>${markerData.label}</strong><br/>
              <span style="text-transform: capitalize; color: ${colors[markerData.type]};">${markerData.type}</span>
            </div>`
          )
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [markers, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary/30">
        <div className="text-center space-y-2">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Enter Mapbox token to enable map</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary/30">
        <div className="text-center space-y-2 p-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground max-w-xs">{mapError}</p>
          <p className="text-xs text-muted-foreground">The map requires WebGL support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}

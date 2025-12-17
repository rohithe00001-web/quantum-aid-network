import React, { useEffect, useRef, useState } from 'react';
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

// Check WebGL support once
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
};

const webGLSupported = checkWebGLSupport();

export function OperationsMap({ mapboxToken, markers = [] }: OperationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const mapboxglRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !webGLSupported) return;

    let isMounted = true;

    import('mapbox-gl').then((mapboxgl) => {
      if (!isMounted || !mapContainer.current) return;

      // Import CSS
      import('mapbox-gl/dist/mapbox-gl.css');
      
      mapboxglRef.current = mapboxgl.default;
      mapboxgl.default.accessToken = mapboxToken;

      try {
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-95.7129, 37.0902],
          zoom: 4,
          pitch: 30,
        });

        map.current.on('load', () => {
          if (isMounted) setMapReady(true);
        });

        map.current.addControl(
          new mapboxgl.default.NavigationControl({ visualizePitch: true }),
          'top-right'
        );

        map.current.addControl(new mapboxgl.default.ScaleControl(), 'bottom-left');

        map.current.on('style.load', () => {
          map.current?.setFog({
            color: 'rgb(10, 15, 25)',
            'high-color': 'rgb(20, 30, 50)',
            'horizon-blend': 0.1,
          });
        });
      } catch (error) {
        console.error('Map init error:', error);
      }
    });

    return () => {
      isMounted = false;
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current || !mapReady || !mapboxglRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

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

      const marker = new mapboxglRef.current.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(
          new mapboxglRef.current.Popup({ offset: 25 }).setHTML(
            `<div style="color: #0a0f19; padding: 4px;">
              <strong>${markerData.label}</strong><br/>
              <span style="text-transform: capitalize; color: ${colors[markerData.type]};">${markerData.type}</span>
            </div>`
          )
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [markers, mapReady]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-secondary/30 rounded-lg">
        <div className="text-center space-y-2">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Enter Mapbox token to enable map</p>
        </div>
      </div>
    );
  }

  // Show static map fallback when WebGL is not supported
  if (!webGLSupported) {
    const markerParams = markers
      .slice(0, 10)
      .map(m => {
        const colors: Record<string, string> = { vehicle: '00d9ff', shelter: '22c55e', alert: 'f59e0b', resource: 'a855f7' };
        return `pin-s+${colors[m.type]}(${m.lng},${m.lat})`;
      })
      .join(',');

    const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markerParams ? markerParams + '/' : ''}-95.7129,37.0902,3,0/800x600@2x?access_token=${mapboxToken}`;

    return (
      <div className="relative w-full h-full bg-secondary/30">
        <img 
          src={staticUrl} 
          alt="Operations Map" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Static map (WebGL unavailable)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[200px]">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}

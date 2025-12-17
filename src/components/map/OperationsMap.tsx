import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.FeatureGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const colors = useMemo<Record<string, { fill: string; label: string }>>(
    () => ({
      vehicle: { fill: '#00d9ff', label: 'Vehicles' },
      shelter: { fill: '#22c55e', label: 'Shelters' },
      alert: { fill: '#f59e0b', label: 'Alerts' },
      resource: { fill: '#a855f7', label: 'Resources' },
    }),
    []
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map centered on Bangalore city
    const map = L.map(mapContainer.current, {
      center: [12.9400, 77.6500],
      zoom: 12,
      zoomControl: true,
      preferCanvas: true,
    });

    // Ensure marker visuals always sit above tiles
    map.createPane('markerPane');
    const pane = map.getPane('markerPane');
    if (pane) pane.style.zIndex = '650';

    // Use CartoDB dark tiles (free, no API key)
    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    });

    tiles.addTo(map);

    const featureGroup = L.featureGroup([], { pane: 'markerPane' });
    featureGroup.addTo(map);

    mapRef.current = map;
    markerLayerRef.current = featureGroup;

    // Ready + fix size (common issue when map mounts in a flex/animated container)
    map.whenReady(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
        setMapReady(true);
      });
    });

    return () => {
      setMapReady(false);
      markerLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current || !mapReady) return;

    const map = mapRef.current;
    const group = markerLayerRef.current;

    group.clearLayers();

    // Use CircleMarkers with larger size for maximum visibility
    markers.forEach((m) => {
      const colorConfig = colors[m.type];
      const fillColor = colorConfig?.fill || '#ffffff';

      const circle = L.circleMarker([m.lat, m.lng], {
        pane: 'markerPane',
        radius: 14,
        color: '#ffffff',
        weight: 3,
        fillColor: fillColor,
        fillOpacity: 0.9,
      });

      circle.bindTooltip(m.label, {
        direction: 'top',
        offset: [0, -14],
        opacity: 1,
        className: 'leaflet-tooltip-custom',
      });

      circle.bindPopup(
        `
        <div style="color:#0a0f19;padding:8px;min-width:180px;">
          <div style="font-weight:700;font-size:14px;">${m.label}</div>
          <div style="margin-top:4px;text-transform:capitalize;color:${fillColor};font-weight:600;">${m.type}</div>
        </div>
        `
      );

      circle.addTo(group);
    });

    console.log(`[OperationsMap] Rendered ${markers.length} markers`);

    // Auto-focus markers so they are always visible
    if (markers.length > 0) {
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.25), { animate: true, maxZoom: 18 });
      }
    }
  }, [markers, mapReady, colors]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-lg">
          <div className="text-muted-foreground text-sm">Loading map…</div>
        </div>
      )}
      {mapReady && markers.length === 0 && (
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-xs text-muted-foreground">No sample markers to display</p>
        </div>
      )}
      {/* Map Legend */}
      {mapReady && markers.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 z-[1000]">
          <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
          <div className="space-y-1.5">
            {Object.entries(colors).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: config.fill }}
                />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 pt-1 border-t border-border/50">
            {markers.length} markers
          </p>
        </div>
      )}
    </div>
  );
}

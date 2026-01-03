import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

interface OperationsMapProps {
  markers?: {
    id: string;
    lng: number;
    lat: number;
    type: 'vehicle' | 'shelter' | 'alert' | 'resource' | 'hazard';
    label: string;
  }[];
  center?: { lat: number; lng: number };
  zoom?: number;
  bounds?: MapBounds | null;
  onBoundsChange?: (bounds: MapBounds) => void;
  isAdmin?: boolean;
}

export function OperationsMap({ 
  markers = [], 
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 12,
  bounds,
  onBoundsChange,
  isAdmin = false,
}: OperationsMapProps) {
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
      hazard: { fill: '#ef4444', label: 'Q-Vision Hazards' },
    }),
    []
  );

  // Handle bounds change for admin area selection
  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !isAdmin || !onBoundsChange) return;
    
    const mapBounds = mapRef.current.getBounds();
    onBoundsChange({
      sw_lat: mapBounds.getSouthWest().lat,
      sw_lng: mapBounds.getSouthWest().lng,
      ne_lat: mapBounds.getNorthEast().lat,
      ne_lng: mapBounds.getNorthEast().lng,
    });
  }, [isAdmin, onBoundsChange]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map with admin-defined or default bounds
    const mapBounds = bounds 
      ? L.latLngBounds(
          L.latLng(bounds.sw_lat, bounds.sw_lng),
          L.latLng(bounds.ne_lat, bounds.ne_lng)
        )
      : L.latLngBounds(
          L.latLng(6.5, 68.0),
          L.latLng(35.5, 97.5)
        );

    const map = L.map(mapContainer.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: isAdmin ? undefined : mapBounds, // Allow admins to pan freely
      maxBoundsViscosity: isAdmin ? 0 : 1.0,
      zoomControl: true,
      preferCanvas: true,
    });

    // Ensure marker visuals always sit above tiles
    map.createPane('markerPane');
    const pane = map.getPane('markerPane');
    if (pane) pane.style.zIndex = '650';

    // Use CartoDB dark tiles (free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const featureGroup = L.featureGroup([], { pane: 'markerPane' });
    featureGroup.addTo(map);

    mapRef.current = map;
    markerLayerRef.current = featureGroup;

    // Fit to admin-defined bounds if set
    if (bounds) {
      map.fitBounds(mapBounds, { animate: false });
    }

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
  }, [center.lat, center.lng, zoom, bounds, isAdmin]);

  // Admin bounds tracking
  useEffect(() => {
    if (!mapRef.current || !isAdmin) return;
    
    mapRef.current.on('moveend', handleMoveEnd);
    return () => {
      mapRef.current?.off('moveend', handleMoveEnd);
    };
  }, [isAdmin, handleMoveEnd]);

  // Efficient marker rendering with batching
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current || !mapReady) return;

    const group = markerLayerRef.current;
    group.clearLayers();

    // Batch marker creation for performance
    const circleMarkers = markers.map((m) => {
      const colorConfig = colors[m.type];
      const fillColor = colorConfig?.fill || '#ffffff';

      const circle = L.circleMarker([m.lat, m.lng], {
        pane: 'markerPane',
        radius: 12,
        color: '#ffffff',
        weight: 2,
        fillColor: fillColor,
        fillOpacity: 0.85,
      });

      circle.bindTooltip(m.label, {
        direction: 'top',
        offset: [0, -12],
        opacity: 1,
        className: 'leaflet-tooltip-custom',
      });

      circle.bindPopup(
        `<div style="color:#0a0f19;padding:6px;min-width:160px;">
          <div style="font-weight:700;font-size:13px;">${m.label}</div>
          <div style="margin-top:3px;text-transform:capitalize;color:${fillColor};font-weight:600;">${m.type}</div>
        </div>`
      );

      return circle;
    });

    // Add all markers at once
    circleMarkers.forEach(marker => marker.addTo(group));

    console.log(`[OperationsMap] Rendered ${markers.length} markers`);
  }, [markers, mapReady, colors]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-lg">
          <div className="text-muted-foreground text-sm">Loading map…</div>
        </div>
      )}
      {isAdmin && mapReady && (
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded z-[1000]">
          Pan/zoom to set operational area
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

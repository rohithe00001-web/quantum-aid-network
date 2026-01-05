import React, { useCallback, useMemo, useState } from 'react';
import { GoogleMap, Marker, Rectangle, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

interface MapBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

interface MarkerData {
  id: string;
  lng: number;
  lat: number;
  type: 'vehicle' | 'shelter' | 'alert' | 'resource' | 'hazard';
  label: string;
}

interface OperationsMapProps {
  markers?: MarkerData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  bounds?: MapBounds | null;
  onBoundsChange?: (bounds: MapBounds) => void;
  isAdmin?: boolean;
  showGeofenceBoundary?: boolean;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0a0f19' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2a1a' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2738' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e2738' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3a52' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e2738' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1a26' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f19' }] },
];

const markerColors: Record<string, string> = {
  vehicle: '#00d9ff',
  shelter: '#22c55e',
  alert: '#f59e0b',
  resource: '#a855f7',
  hazard: '#ef4444',
};

const markerLabels: Record<string, string> = {
  vehicle: 'Vehicles',
  shelter: 'Shelters',
  alert: 'Alerts',
  resource: 'Resources',
  hazard: 'Q-Vision Hazards',
};

export function OperationsMap({ 
  markers = [], 
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 12,
  bounds,
  onBoundsChange,
  isAdmin = false,
  showGeofenceBoundary = false,
}: OperationsMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    if (bounds) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.sw_lat, lng: bounds.sw_lng },
        { lat: bounds.ne_lat, lng: bounds.ne_lng }
      );
      mapInstance.fitBounds(googleBounds);
    }
  }, [bounds]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleIdle = useCallback(() => {
    if (!map || !isAdmin || !onBoundsChange) return;
    
    const mapBounds = map.getBounds();
    if (mapBounds) {
      const sw = mapBounds.getSouthWest();
      const ne = mapBounds.getNorthEast();
      onBoundsChange({
        sw_lat: sw.lat(),
        sw_lng: sw.lng(),
        ne_lat: ne.lat(),
        ne_lng: ne.lng(),
      });
    }
  }, [map, isAdmin, onBoundsChange]);

  const createMarkerIcon = useCallback((type: string): google.maps.Symbol => {
    const color = markerColors[type] || '#ffffff';
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.85,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12,
    };
  }, []);

  const rectangleBounds = useMemo(() => {
    if (!bounds) return null;
    return {
      north: bounds.ne_lat,
      south: bounds.sw_lat,
      east: bounds.ne_lng,
      west: bounds.sw_lng,
    };
  }, [bounds]);

  const mapOptions = useMemo(() => ({
    styles: darkMapStyles,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    restriction: !isAdmin && bounds ? {
      latLngBounds: {
        north: bounds.ne_lat,
        south: bounds.sw_lat,
        east: bounds.ne_lng,
        west: bounds.sw_lng,
      },
      strictBounds: true,
    } : undefined,
  }), [isAdmin, bounds]);

  if (loadError) {
    return (
      <div className="relative w-full h-full min-h-[300px]">
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg">
          <div className="text-destructive text-sm">{loadError}</div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full min-h-[300px]">
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-lg">
          <div className="text-muted-foreground text-sm">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onIdle={handleIdle}
        options={mapOptions}
      >
        {showGeofenceBoundary && rectangleBounds && (
          <Rectangle
            bounds={rectangleBounds}
            options={{
              strokeColor: '#00d9ff',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              fillColor: '#00d9ff',
              fillOpacity: 0.1,
              clickable: false,
            }}
          />
        )}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={createMarkerIcon(marker.type)}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ color: '#0a0f19', padding: '6px', minWidth: '160px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{selectedMarker.label}</div>
              <div style={{ 
                marginTop: '3px', 
                textTransform: 'capitalize', 
                color: markerColors[selectedMarker.type],
                fontWeight: 600 
              }}>
                {selectedMarker.type}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {isAdmin && (
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded z-10">
          Pan/zoom to set operational area
        </div>
      )}

      {markers.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 z-10">
          <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
          <div className="space-y-1.5">
            {Object.entries(markerColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{markerLabels[key]}</span>
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

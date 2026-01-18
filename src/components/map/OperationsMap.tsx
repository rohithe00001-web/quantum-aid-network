import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { GoogleMap, Marker, Rectangle, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  type: 'vehicle' | 'shelter' | 'alert' | 'resource' | 'hazard' | 'volunteer';
  label: string;
}

interface VolunteerLocation {
  id: string;
  volunteer_id: string;
  current_location: { lat: number; lng: number } | null;
  status: string;
}

interface OperationsMapProps {
  markers?: MarkerData[];
  center?: { lat: number; lng: number };
  zoom?: number;
  bounds?: MapBounds | null;
  onBoundsChange?: (bounds: MapBounds) => void;
  isAdmin?: boolean;
  showGeofenceBoundary?: boolean;
  showVolunteers?: boolean;
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
  volunteer: '#ec4899',
};

const markerLabels: Record<string, string> = {
  vehicle: 'Vehicles',
  shelter: 'Shelters',
  alert: 'Alerts',
  resource: 'Resources',
  hazard: 'Q-Vision Hazards',
  volunteer: 'Volunteers',
};

export function OperationsMap({ 
  markers = [], 
  center = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5, // Zoom level to show all of India
  bounds,
  onBoundsChange,
  isAdmin = false,
  showGeofenceBoundary = false,
  showVolunteers = true,
}: OperationsMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [volunteerLocations, setVolunteerLocations] = useState<VolunteerLocation[]>([]);

  // Fetch volunteer locations and subscribe to real-time updates
  useEffect(() => {
    if (!showVolunteers) return;

    const fetchVolunteers = async () => {
      const { data, error } = await supabase
        .from('volunteer_assignments')
        .select('id, volunteer_id, current_location, status')
        .not('current_location', 'is', null)
        .in('status', ['active', 'en_route', 'assigned']);
      
      if (!error && data) {
        setVolunteerLocations(data as VolunteerLocation[]);
      }
    };

    fetchVolunteers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('volunteer-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteer_assignments',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as VolunteerLocation;
            if (newData.current_location && ['active', 'en_route', 'assigned'].includes(newData.status)) {
              setVolunteerLocations(prev => {
                const existing = prev.findIndex(v => v.id === newData.id);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = newData;
                  return updated;
                }
                return [...prev, newData];
              });
            } else {
              setVolunteerLocations(prev => prev.filter(v => v.id !== newData.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as { id: string };
            setVolunteerLocations(prev => prev.filter(v => v.id !== oldData.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showVolunteers]);

  // Convert volunteer locations to markers
  const volunteerMarkers: MarkerData[] = useMemo(() => {
    return volunteerLocations
      .filter(v => v.current_location?.lat && v.current_location?.lng)
      .map(v => ({
        id: `volunteer-${v.id}`,
        lat: v.current_location!.lat,
        lng: v.current_location!.lng,
        type: 'volunteer' as const,
        label: `Volunteer (${v.status})`,
      }));
  }, [volunteerLocations]);

  // Combine all markers
  const allMarkers = useMemo(() => {
    return [...markers, ...volunteerMarkers];
  }, [markers, volunteerMarkers]);

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
    scrollwheel: true, // Enable mouse scroll zoom
    gestureHandling: 'greedy', // Allow all gestures without ctrl key
    minZoom: 1, // Maximum zoom out (world view)
    maxZoom: 21, // Maximum zoom (Google Maps limit)
    restriction: !isAdmin && bounds ? {
      latLngBounds: {
        north: bounds.ne_lat,
        south: bounds.sw_lat,
        east: bounds.ne_lng,
        west: bounds.sw_lng,
      },
      strictBounds: false, // Allow panning slightly outside bounds
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

        {allMarkers.map((marker) => (
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
              <button
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedMarker.lat},${selectedMarker.lng}`;
                  navigator.clipboard.writeText(googleMapsUrl).then(() => {
                    toast.success('Google Maps link copied to clipboard!');
                  }).catch(() => {
                    // Fallback: try to open in new window
                    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                  });
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#00d9ff',
                  color: '#0a0f19',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                📋 Copy Google Maps Link
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {isAdmin && (
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded z-10">
          Pan/zoom to set operational area
        </div>
      )}

      {showVolunteers && (
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 z-10 flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border-2 border-white animate-pulse"
            style={{ backgroundColor: markerColors.volunteer }}
          />
          <span className="text-xs font-medium text-foreground">
            {volunteerMarkers.length} Volunteer{volunteerMarkers.length !== 1 ? 's' : ''} Online
          </span>
        </div>
      )}

      {allMarkers.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 z-10">
          <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
          <div className="space-y-1.5">
            {Object.entries(markerColors).map(([key, color]) => {
              const markersOfType = allMarkers.filter(m => m.type === key);
              const firstMarker = markersOfType[0];
              
              const handleCopyLink = () => {
                if (firstMarker) {
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${firstMarker.lat},${firstMarker.lng}`;
                  navigator.clipboard.writeText(googleMapsUrl).then(() => {
                    toast.success(`${markerLabels[key]} location copied!`);
                  });
                }
              };
              
              const content = (
                <>
                  <span
                    className="w-3 h-3 rounded-full border-2 border-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-muted-foreground">{markerLabels[key]}</span>
                  {firstMarker && (
                    <span className="text-[10px] text-primary ml-auto">📋</span>
                  )}
                </>
              );
              
              return firstMarker ? (
                <div
                  key={key}
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 -mx-1 px-1 rounded transition-colors"
                  title={`Copy Google Maps link (${markersOfType.length} ${markerLabels[key].toLowerCase()})`}
                >
                  {content}
                </div>
              ) : (
                <div key={key} className="flex items-center gap-2">
                  {content}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 pt-1 border-t border-border/50">
            {allMarkers.length} markers • Click to copy link
          </p>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { MapPinOff } from 'lucide-react';

interface VolunteerMiniMapProps {
  className?: string;
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

export function VolunteerMiniMap({ className }: VolunteerMiniMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        
        // Pan map to new location
        if (map) {
          map.panTo(newLocation);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [map]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const mapOptions = useMemo(() => ({
    styles: darkMapStyles,
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    scrollwheel: false,
    gestureHandling: 'none',
    draggable: false,
  }), []);

  const markerIcon = useMemo((): google.maps.Symbol | undefined => {
    if (!isLoaded) return undefined;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#ec4899',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 10,
    };
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 rounded-lg ${className}`}>
        <div className="text-destructive text-sm">{loadError}</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-secondary/50 rounded-lg ${className}`}>
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className={`flex flex-col items-center justify-center bg-secondary/30 rounded-lg border border-border/30 ${className}`}>
        <MapPinOff className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Location not available
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Enable location to see your position
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-border/50 ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <Marker
          position={currentLocation}
          icon={markerIcon}
        />
      </GoogleMap>
      
      {/* Location coordinates overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Your Location</span>
          <span className="font-mono text-foreground">
            {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
          </span>
        </div>
      </div>
      
      {/* Pulsing indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-xs text-success font-medium">Live</span>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationsMap } from '@/components/map/OperationsMap';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, RefreshCw, Users, Phone, 
  Navigation, CheckCircle, AlertTriangle 
} from 'lucide-react';

interface Shelter {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  status: string;
  contact_phone: string | null;
  amenities: string[] | null;
}

interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  type: 'vehicle' | 'shelter' | 'alert' | 'resource';
  label: string;
}

interface ShelterLocatorProps {
  userSOSLocation?: { lat: number; lng: number } | null;
}

export function ShelterLocator({ userSOSLocation }: ShelterLocatorProps) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchShelters();
    getUserLocation();

    const channel = supabase
      .channel('civilian-shelters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, fetchShelters)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update markers when userSOSLocation changes
  useEffect(() => {
    updateMarkers();
  }, [shelters, userSOSLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Bangalore center if location not available
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
        }
      );
    }
  };

  const updateMarkers = () => {
    const mapMarkers: MapMarker[] = shelters.map(s => ({
      id: `shelter-${s.id}`,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      type: 'shelter' as const,
      label: `${s.name} (${s.current_occupancy}/${s.capacity})`
    }));

    // Add user's SOS location as an alert marker
    if (userSOSLocation) {
      mapMarkers.push({
        id: 'user-sos',
        lat: userSOSLocation.lat,
        lng: userSOSLocation.lng,
        type: 'alert',
        label: 'Your SOS Location'
      });
    }

    setMarkers(mapMarkers);
  };

  const fetchShelters = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('shelters')
      .select('*')
      .eq('status', 'open')
      .order('name');

    if (data) {
      setShelters(data);
    }
    
    setLoading(false);
  };

  const calculateDistance = (lat: number, lng: number): string => {
    if (!userLocation) return '—';
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat - userLocation.lat) * Math.PI / 180;
    const dLng = (lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const getOccupancyStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return { label: 'Almost Full', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (percentage >= 70) return { label: 'Filling Up', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
  };

  const openDirections = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Map Section */}
      <GlassCard className="p-4" variant="quantum">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-quantum-cyan" />
            Nearby Shelters
          </h3>
          <Button size="sm" variant="ghost" onClick={fetchShelters} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="h-64 rounded-lg overflow-hidden border border-border/30">
          <OperationsMap markers={markers} />
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
            Shelters
          </span>
          {userSOSLocation && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              Your SOS
            </span>
          )}
        </div>
      </GlassCard>

      {/* Shelter List */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-quantum-cyan" />
          Available Shelters
          <Badge variant="outline" className="ml-auto">
            {shelters.length} open
          </Badge>
        </h3>

        {shelters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No open shelters found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {shelters.map((shelter) => {
              const occupancy = getOccupancyStatus(shelter.current_occupancy, shelter.capacity);
              const distance = calculateDistance(Number(shelter.latitude), Number(shelter.longitude));
              
              return (
                <div 
                  key={shelter.id}
                  className="p-4 bg-secondary/30 rounded-lg border border-border/30 hover:border-quantum-cyan/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{shelter.name}</h4>
                      {shelter.address && (
                        <p className="text-sm text-muted-foreground truncate">{shelter.address}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={occupancy.color}>
                      {occupancy.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {shelter.current_occupancy}/{shelter.capacity}
                    </span>
                    <span className="flex items-center gap-1 text-quantum-cyan">
                      <Navigation className="w-4 h-4" />
                      {distance}
                    </span>
                    {shelter.contact_phone && (
                      <a 
                        href={`tel:${shelter.contact_phone}`}
                        className="flex items-center gap-1 text-green-400 hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                  </div>

                  {shelter.amenities && shelter.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {shelter.amenities.slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {shelter.amenities.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{shelter.amenities.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-quantum-cyan border-quantum-cyan/30 hover:bg-quantum-cyan/10"
                    onClick={() => openDirections(Number(shelter.latitude), Number(shelter.longitude), shelter.name)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationsMap } from './OperationsMap';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Map, RefreshCw } from 'lucide-react';

interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  type: 'vehicle' | 'shelter' | 'alert' | 'resource';
  label: string;
}

interface SharedOperationsMapProps {
  showVehicles?: boolean;
  showShelters?: boolean;
  showSOS?: boolean;
  showVolunteers?: boolean;
  height?: string;
  title?: string;
}

export function SharedOperationsMap({
  showVehicles = true,
  showShelters = true,
  showSOS = true,
  showVolunteers = true,
  height = 'h-80',
  title = 'Operations Map'
}: SharedOperationsMapProps) {
  const [mapboxToken, setMapboxToken] = useState(() => localStorage.getItem('mapbox_token') || '');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMapData();

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (showVehicles) {
      const vehicleChannel = supabase
        .channel('map-vehicles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, fetchMapData)
        .subscribe();
      channels.push(vehicleChannel);
    }

    if (showShelters) {
      const shelterChannel = supabase
        .channel('map-shelters')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, fetchMapData)
        .subscribe();
      channels.push(shelterChannel);
    }

    if (showSOS) {
      const sosChannel = supabase
        .channel('map-sos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, fetchMapData)
        .subscribe();
      channels.push(sosChannel);
    }

    if (showVolunteers) {
      const volChannel = supabase
        .channel('map-volunteers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_assignments' }, fetchMapData)
        .subscribe();
      channels.push(volChannel);
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [showVehicles, showShelters, showSOS, showVolunteers]);

  const fetchMapData = async () => {
    setLoading(true);
    const newMarkers: MapMarker[] = [];

    // Fetch vehicles
    if (showVehicles) {
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, vehicle_type, status, current_location')
        .in('status', ['available', 'in_use']);

      vehicles?.forEach(v => {
        const loc = v.current_location as { lat: number; lng: number } | null;
        if (loc?.lat && loc?.lng) {
          newMarkers.push({
            id: `vehicle-${v.id}`,
            lat: loc.lat,
            lng: loc.lng,
            type: 'vehicle',
            label: `${v.vehicle_number} (${v.vehicle_type})`
          });
        }
      });
    }

    // Fetch shelters
    if (showShelters) {
      const { data: shelters } = await supabase
        .from('shelters')
        .select('id, name, latitude, longitude, status, current_occupancy, capacity');

      shelters?.forEach(s => {
        newMarkers.push({
          id: `shelter-${s.id}`,
          lat: Number(s.latitude),
          lng: Number(s.longitude),
          type: 'shelter',
          label: `${s.name} (${s.current_occupancy}/${s.capacity})`
        });
      });
    }

    // Fetch SOS requests
    if (showSOS) {
      const { data: sosRequests } = await supabase
        .from('sos_requests')
        .select('id, location')
        .eq('status', 'pending');

      sosRequests?.forEach(sos => {
        const loc = sos.location as { lat: number; lng: number };
        if (loc?.lat && loc?.lng) {
          newMarkers.push({
            id: `sos-${sos.id}`,
            lat: loc.lat,
            lng: loc.lng,
            type: 'alert',
            label: `SOS #${sos.id.slice(0, 6)}`
          });
        }
      });
    }

    // Fetch volunteers
    if (showVolunteers) {
      const { data: volunteers } = await supabase
        .from('volunteer_assignments')
        .select('id, current_location, status')
        .in('status', ['en_route', 'idle']);

      volunteers?.forEach(vol => {
        const loc = vol.current_location as { lat: number; lng: number } | null;
        if (loc?.lat && loc?.lng) {
          newMarkers.push({
            id: `vol-${vol.id}`,
            lat: loc.lat,
            lng: loc.lng,
            type: 'resource',
            label: `Volunteer (${vol.status})`
          });
        }
      });
    }

    setMarkers(newMarkers);
    setLoading(false);
  };

  const saveToken = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
    toast.success('Mapbox token saved');
  };

  return (
    <GlassCard className="p-4" variant="quantum">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-quantum-cyan" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {!mapboxToken && (
            <>
              <Input
                type="text"
                placeholder="Enter Mapbox token..."
                className="w-64 bg-secondary/50 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveToken((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                  if (input?.value) saveToken(input.value);
                }}
              >
                Save
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={fetchMapData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className={`${height} rounded-lg overflow-hidden border border-border/30`}>
        <OperationsMap mapboxToken={mapboxToken} markers={markers} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
        {showSOS && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#f59e0b]" /> SOS Alerts
          </span>
        )}
        {showVehicles && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#00d9ff]" /> Fleet Vehicles
          </span>
        )}
        {showShelters && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#22c55e]" /> Shelters
          </span>
        )}
        {showVolunteers && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#a855f7]" /> Volunteers
          </span>
        )}
      </div>
    </GlassCard>
  );
}

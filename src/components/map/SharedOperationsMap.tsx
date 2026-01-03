import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationsMap } from './OperationsMap';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Map, RefreshCw, Save } from 'lucide-react';
import { useMapSettings } from '@/hooks/useMapSettings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  type: 'vehicle' | 'shelter' | 'alert' | 'resource' | 'hazard';
  label: string;
}

interface MapBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

interface SharedOperationsMapProps {
  showVehicles?: boolean;
  showShelters?: boolean;
  showSOS?: boolean;
  showVolunteers?: boolean;
  showHazards?: boolean;
  height?: string;
  title?: string;
  allowAreaSelection?: boolean;
}

export function SharedOperationsMap({
  showVehicles = true,
  showShelters = true,
  showSOS = true,
  showVolunteers = true,
  showHazards = true,
  height = 'h-80',
  title = 'Operations Map',
  allowAreaSelection = false,
}: SharedOperationsMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const { settings, loading: settingsLoading, updateSettings } = useMapSettings();
  const { role } = useAuth();

  const isAdmin = role === 'admin';
  const canSelectArea = allowAreaSelection && isAdmin;

  // Parallel data fetching for efficiency
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    
    const newMarkers: MapMarker[] = [];

    // Execute all queries in parallel
    const [vehiclesResult, sheltersResult, sosResult, volunteersResult, hazardsResult] = await Promise.all([
      showVehicles 
        ? supabase.from('fleet_vehicles').select('id, vehicle_number, vehicle_type, status, current_location').in('status', ['available', 'in_use'])
        : Promise.resolve({ data: null }),
      showShelters 
        ? supabase.from('shelters').select('id, name, latitude, longitude, current_occupancy, capacity')
        : Promise.resolve({ data: null }),
      showSOS 
        ? supabase.from('sos_requests').select('id, location').eq('status', 'pending')
        : Promise.resolve({ data: null }),
      showVolunteers 
        ? supabase.from('volunteer_assignments').select('id, current_location, status').in('status', ['en_route', 'idle'])
        : Promise.resolve({ data: null }),
      showHazards 
        ? supabase.from('qvision_analyses').select('id, location, summary, classifications').eq('status', 'active').order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: null }),
    ]);

    // Process vehicles
    vehiclesResult.data?.forEach(v => {
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

    // Process shelters
    sheltersResult.data?.forEach(s => {
      newMarkers.push({
        id: `shelter-${s.id}`,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        type: 'shelter',
        label: `${s.name} (${s.current_occupancy}/${s.capacity})`
      });
    });

    // Process SOS
    sosResult.data?.forEach(sos => {
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

    // Process volunteers
    volunteersResult.data?.forEach(vol => {
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

    // Process hazards
    hazardsResult.data?.forEach(h => {
      const loc = h.location as { lat: number; lng: number } | null;
      const classifications = h.classifications as Array<{ category: string }> | null;
      const severity = classifications?.some(c => c.category === 'danger') ? '🔴' :
                      classifications?.some(c => c.category === 'warning') ? '🟡' : '🟢';
      if (loc?.lat && loc?.lng) {
        newMarkers.push({
          id: `hazard-${h.id}`,
          lat: loc.lat,
          lng: loc.lng,
          type: 'hazard',
          label: `${severity} ${h.summary?.slice(0, 35) || 'Hazard'}...`
        });
      }
    });
    
    setMarkers(newMarkers);
    setLoading(false);
  }, [showVehicles, showShelters, showSOS, showVolunteers, showHazards]);

  useEffect(() => {
    fetchMapData();

    // Single channel for all real-time updates
    const channel = supabase
      .channel('map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, fetchMapData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, fetchMapData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_requests' }, fetchMapData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_assignments' }, fetchMapData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qvision_analyses' }, fetchMapData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMapData]);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setPendingBounds(bounds);
  }, []);

  const handleSaveBounds = async () => {
    if (!pendingBounds) return;
    
    const success = await updateSettings({
      bounds_sw_lat: pendingBounds.sw_lat,
      bounds_sw_lng: pendingBounds.sw_lng,
      bounds_ne_lat: pendingBounds.ne_lat,
      bounds_ne_lng: pendingBounds.ne_lng,
    });
    
    if (success) {
      toast.success('Operational area saved');
      setPendingBounds(null);
    } else {
      toast.error('Failed to save area');
    }
  };

  const mapBounds = useMemo(() => {
    if (!settings.bounds_sw_lat || !settings.bounds_sw_lng || 
        !settings.bounds_ne_lat || !settings.bounds_ne_lng) return null;
    return {
      sw_lat: settings.bounds_sw_lat,
      sw_lng: settings.bounds_sw_lng,
      ne_lat: settings.bounds_ne_lat,
      ne_lng: settings.bounds_ne_lng,
    };
  }, [settings]);

  if (settingsLoading) {
    return (
      <GlassCard className="p-4" variant="quantum">
        <div className={`${height} flex items-center justify-center`}>
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4" variant="quantum">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-quantum-cyan" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {canSelectArea && pendingBounds && (
            <Button size="sm" variant="default" onClick={handleSaveBounds}>
              <Save className="w-4 h-4 mr-1" />
              Save Area
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={fetchMapData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className={`${height} rounded-lg overflow-hidden border border-border/30`}>
        <OperationsMap 
          markers={markers}
          center={{ lat: settings.center_lat, lng: settings.center_lng }}
          zoom={settings.zoom_level}
          bounds={mapBounds}
          onBoundsChange={canSelectArea ? handleBoundsChange : undefined}
          isAdmin={canSelectArea}
          showGeofenceBoundary={!!mapBounds}
        />
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
        {showHazards && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#ef4444]" /> Q-Vision Hazards
          </span>
        )}
      </div>
    </GlassCard>
  );
}

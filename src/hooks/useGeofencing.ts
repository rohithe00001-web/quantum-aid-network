import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapSettings } from './useMapSettings';
import { toast } from 'sonner';

interface GeofenceAlert {
  id: string;
  entity_type: 'vehicle' | 'volunteer';
  entity_id: string;
  entity_label: string;
  latitude: number;
  longitude: number;
  alert_type: 'exit' | 'enter';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

interface TrackedEntity {
  id: string;
  type: 'vehicle' | 'volunteer';
  label: string;
  lat: number;
  lng: number;
}

export function useGeofencing(enabled = true) {
  const { settings, loading: settingsLoading } = useMapSettings();
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const trackedEntities = useRef<Map<string, boolean>>(new Map()); // entityId -> wasInside

  // Check if point is within bounds
  const isInsideBounds = useCallback((lat: number, lng: number): boolean => {
    if (!settings.bounds_sw_lat || !settings.bounds_sw_lng || 
        !settings.bounds_ne_lat || !settings.bounds_ne_lng) {
      return true; // No bounds set, consider everything inside
    }

    return (
      lat >= settings.bounds_sw_lat &&
      lat <= settings.bounds_ne_lat &&
      lng >= settings.bounds_sw_lng &&
      lng <= settings.bounds_ne_lng
    );
  }, [settings]);

  // Check for recent existing alert for this entity
  const hasRecentAlert = useCallback(async (entityId: string, entityType: string): Promise<boolean> => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('geofence_alerts')
      .select('id')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('status', 'active')
      .gte('created_at', oneHourAgo)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }, []);

  // Create geofence alert
  const createAlert = useCallback(async (entity: TrackedEntity, alertType: 'exit' | 'enter') => {
    // Check if there's already a recent active alert
    const exists = await hasRecentAlert(entity.id, entity.type);
    if (exists) return;

    const { error } = await supabase
      .from('geofence_alerts')
      .insert({
        entity_type: entity.type,
        entity_id: entity.id,
        entity_label: entity.label,
        latitude: entity.lat,
        longitude: entity.lng,
        alert_type: alertType,
      });

    if (!error) {
      toast.error(`🚨 ${entity.type === 'vehicle' ? 'Vehicle' : 'Volunteer'} "${entity.label}" has exited the operational area!`, {
        duration: 10000,
      });
    }
  }, [hasRecentAlert]);

  // Check entities against geofence
  const checkEntities = useCallback(async () => {
    if (settingsLoading || !enabled) return;
    if (!settings.bounds_sw_lat) return; // No bounds configured

    setLoading(true);

    // Fetch current positions
    const [vehiclesRes, volunteersRes] = await Promise.all([
      supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, vehicle_type, current_location')
        .in('status', ['available', 'in_use']),
      supabase
        .from('volunteer_assignments')
        .select('id, current_location, status')
        .in('status', ['en_route', 'idle']),
    ]);

    const entities: TrackedEntity[] = [];

    // Process vehicles
    vehiclesRes.data?.forEach(v => {
      const loc = v.current_location as { lat: number; lng: number } | null;
      if (loc?.lat && loc?.lng) {
        entities.push({
          id: v.id,
          type: 'vehicle',
          label: `${v.vehicle_number} (${v.vehicle_type})`,
          lat: loc.lat,
          lng: loc.lng,
        });
      }
    });

    // Process volunteers
    volunteersRes.data?.forEach(vol => {
      const loc = vol.current_location as { lat: number; lng: number } | null;
      if (loc?.lat && loc?.lng) {
        entities.push({
          id: vol.id,
          type: 'volunteer',
          label: `Volunteer`,
          lat: loc.lat,
          lng: loc.lng,
        });
      }
    });

    // Check each entity
    for (const entity of entities) {
      const key = `${entity.type}-${entity.id}`;
      const isInside = isInsideBounds(entity.lat, entity.lng);
      const wasInside = trackedEntities.current.get(key);

      // First time tracking - initialize
      if (wasInside === undefined) {
        trackedEntities.current.set(key, isInside);
        continue;
      }

      // Detect exit
      if (wasInside && !isInside) {
        await createAlert(entity, 'exit');
      }

      // Update state
      trackedEntities.current.set(key, isInside);
    }

    setLoading(false);
  }, [settings, settingsLoading, enabled, isInsideBounds, createAlert]);

  // Fetch active alerts
  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase
      .from('geofence_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAlerts(data as GeofenceAlert[]);
    }
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('geofence_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert acknowledged');
    }
  }, []);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('geofence_alerts')
      .update({ status: 'resolved' })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert resolved');
    }
  }, []);

  // Set up monitoring
  useEffect(() => {
    if (!enabled) return;

    fetchAlerts();
    checkEntities();

    // Check entities periodically (every 30 seconds)
    const interval = setInterval(checkEntities, 30000);

    // Real-time subscription for position updates
    const channel = supabase
      .channel('geofence-monitoring')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fleet_vehicles' }, checkEntities)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'volunteer_assignments' }, checkEntities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'geofence_alerts' }, fetchAlerts)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [enabled, checkEntities, fetchAlerts]);

  return {
    alerts,
    loading,
    acknowledgeAlert,
    resolveAlert,
    refetch: fetchAlerts,
    isInsideBounds,
  };
}

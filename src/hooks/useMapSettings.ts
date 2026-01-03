import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapSettings {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  bounds_sw_lat: number | null;
  bounds_sw_lng: number | null;
  bounds_ne_lat: number | null;
  bounds_ne_lng: number | null;
}

const DEFAULT_SETTINGS: MapSettings = {
  id: 'default',
  name: 'default',
  center_lat: 12.9716,
  center_lng: 77.5946,
  zoom_level: 12,
  bounds_sw_lat: 12.7,
  bounds_sw_lng: 77.3,
  bounds_ne_lat: 13.2,
  bounds_ne_lng: 77.9,
};

export function useMapSettings() {
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('map_settings')
        .select('*')
        .eq('name', 'default')
        .single();

      if (data && !error) {
        setSettings({
          id: data.id,
          name: data.name,
          center_lat: Number(data.center_lat),
          center_lng: Number(data.center_lng),
          zoom_level: data.zoom_level,
          bounds_sw_lat: data.bounds_sw_lat ? Number(data.bounds_sw_lat) : null,
          bounds_sw_lng: data.bounds_sw_lng ? Number(data.bounds_sw_lng) : null,
          bounds_ne_lat: data.bounds_ne_lat ? Number(data.bounds_ne_lat) : null,
          bounds_ne_lng: data.bounds_ne_lng ? Number(data.bounds_ne_lng) : null,
        });
      }
    } catch (err) {
      console.error('Failed to fetch map settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<MapSettings>) => {
    try {
      const { error } = await supabase
        .from('map_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('name', 'default');

      if (!error) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update map settings:', err);
      return false;
    }
  };

  return { settings, loading, updateSettings, refetch: fetchSettings };
}

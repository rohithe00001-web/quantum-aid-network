-- Create table to store admin-defined map bounds/area
CREATE TABLE public.map_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'default',
  center_lat numeric NOT NULL DEFAULT 12.9716,
  center_lng numeric NOT NULL DEFAULT 77.5946,
  zoom_level integer NOT NULL DEFAULT 12,
  bounds_sw_lat numeric,
  bounds_sw_lng numeric,
  bounds_ne_lat numeric,
  bounds_ne_lng numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage map settings
CREATE POLICY "Admins can manage map settings"
ON public.map_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Operators can view map settings
CREATE POLICY "Operators can view map settings"
ON public.map_settings
FOR SELECT
USING (has_role(auth.uid(), 'operator'::app_role));

-- Everyone can view default map settings
CREATE POLICY "Everyone can view default settings"
ON public.map_settings
FOR SELECT
USING (name = 'default');

-- Insert default settings
INSERT INTO public.map_settings (name, center_lat, center_lng, zoom_level, bounds_sw_lat, bounds_sw_lng, bounds_ne_lat, bounds_ne_lng)
VALUES ('default', 12.9716, 77.5946, 12, 12.7, 77.3, 13.2, 77.9);
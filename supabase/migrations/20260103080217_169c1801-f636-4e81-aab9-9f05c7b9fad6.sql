-- Create table for geofence violation alerts
CREATE TABLE public.geofence_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('vehicle', 'volunteer')),
  entity_id uuid NOT NULL,
  entity_label text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  alert_type text NOT NULL DEFAULT 'exit' CHECK (alert_type IN ('exit', 'enter')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can manage geofence alerts
CREATE POLICY "Admins can manage geofence alerts"
ON public.geofence_alerts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Operators can manage geofence alerts
CREATE POLICY "Operators can manage geofence alerts"
ON public.geofence_alerts
FOR ALL
USING (has_role(auth.uid(), 'operator'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create fleet vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  status TEXT NOT NULL DEFAULT 'available',
  current_location JSONB,
  capacity INTEGER DEFAULT 100,
  fuel_level INTEGER DEFAULT 100,
  assigned_volunteer_id UUID,
  last_maintenance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Operators can manage all vehicles
CREATE POLICY "Operators can manage fleet vehicles"
ON public.fleet_vehicles
FOR ALL
USING (has_role(auth.uid(), 'operator'::app_role));

-- Admins can manage fleet vehicles
CREATE POLICY "Admins can manage fleet vehicles"
ON public.fleet_vehicles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Volunteers can view their assigned vehicles
CREATE POLICY "Volunteers can view assigned vehicles"
ON public.fleet_vehicles
FOR SELECT
USING (auth.uid() = assigned_volunteer_id);

-- Enable realtime for fleet vehicles
ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_vehicles;

-- Create updated_at trigger
CREATE TRIGGER update_fleet_vehicles_updated_at
BEFORE UPDATE ON public.fleet_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
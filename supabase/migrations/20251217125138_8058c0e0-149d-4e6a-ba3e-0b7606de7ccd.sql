-- Add shelter assignment to fleet vehicles
ALTER TABLE public.fleet_vehicles 
ADD COLUMN assigned_shelter_id UUID REFERENCES public.shelters(id) ON DELETE SET NULL;

-- Create vehicle dispatch logs table
CREATE TABLE public.vehicle_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  dispatch_type TEXT NOT NULL DEFAULT 'supply_run',
  status TEXT NOT NULL DEFAULT 'dispatched',
  dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.vehicle_dispatches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage dispatches" ON public.vehicle_dispatches FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Operators can manage dispatches" ON public.vehicle_dispatches FOR ALL USING (has_role(auth.uid(), 'operator'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_dispatches;
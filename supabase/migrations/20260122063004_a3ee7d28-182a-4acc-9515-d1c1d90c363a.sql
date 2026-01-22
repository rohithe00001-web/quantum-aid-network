-- Create notifications table for live alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('alert', 'vehicle', 'shelter', 'sos', 'success', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  location TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_roles TEXT[] DEFAULT ARRAY['admin', 'operator', 'volunteer', 'user'],
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins and operators can see all notifications
CREATE POLICY "Admins and operators can view all notifications"
ON public.notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operator')
  )
);

-- Users can view their own notifications or broadcast notifications targeting their role
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL
    AND target_roles && ARRAY[(SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)]
  )
);

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operator')
  )
);

-- Admins can delete any notification
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert some initial notifications
INSERT INTO public.notifications (type, title, message, location, target_roles) VALUES
('alert', 'Flash Flood Warning', 'Heavy rainfall expected in next 2 hours', 'Koramangala, Bangalore', ARRAY['admin', 'operator', 'volunteer', 'user']),
('sos', 'New SOS Request', 'Family of 4 stranded, need evacuation', 'Indiranagar 100ft Road', ARRAY['admin', 'operator', 'volunteer']),
('vehicle', 'Vehicle KA-01-MG-7001 Dispatched', 'En route to MG Road Relief Center', 'MG Road, Bangalore', ARRAY['admin', 'operator']),
('shelter', 'Shelter Capacity Alert', 'Brigade Road Shelter at 85% capacity', 'Brigade Road, Bangalore', ARRAY['admin', 'operator', 'volunteer']),
('success', 'Evacuation Complete', '45 people evacuated successfully', 'Whitefield, Bangalore', ARRAY['admin', 'operator', 'volunteer', 'user']);
-- Add RLS policy for admins to manage SOS requests
CREATE POLICY "Admins can manage SOS requests"
ON public.sos_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
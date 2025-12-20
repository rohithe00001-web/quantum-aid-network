-- Add RLS policy for users to update their own SOS requests (cancel/resolve)
CREATE POLICY "Users can update own SOS requests"
ON public.sos_requests
FOR UPDATE
USING (auth.uid() = user_id);
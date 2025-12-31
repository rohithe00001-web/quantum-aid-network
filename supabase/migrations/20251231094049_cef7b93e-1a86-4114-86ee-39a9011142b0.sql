-- Create table to store Q-Vision analysis results
CREATE TABLE public.qvision_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  classifications JSONB NOT NULL,
  summary TEXT NOT NULL,
  recommendations JSONB NOT NULL,
  location JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.qvision_analyses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
ON public.qvision_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses"
ON public.qvision_analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
ON public.qvision_analyses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Operators can view all analyses
CREATE POLICY "Operators can view all analyses"
ON public.qvision_analyses
FOR SELECT
USING (has_role(auth.uid(), 'operator'::app_role));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.qvision_analyses;
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'volunteer', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  biometric_enabled BOOLEAN DEFAULT false,
  offline_token TEXT,
  offline_token_expires_at TIMESTAMP WITH TIME ZONE,
  qr_code_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QPU Budget tracking (Admin feature)
CREATE TABLE public.qpu_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_shots INTEGER NOT NULL DEFAULT 10000,
  used_shots INTEGER NOT NULL DEFAULT 0,
  budget_limit DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  budget_used DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  active_backend TEXT DEFAULT 'D-Wave',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs (Admin feature)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quantum operations (Operator feature)
CREATE TABLE public.quantum_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  operation_type TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parameters JSONB,
  result JSONB,
  shots_used INTEGER DEFAULT 0,
  priority_override BOOLEAN DEFAULT false,
  is_simulation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Volunteer assignments (Volunteer feature)
CREATE TABLE public.volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_id UUID REFERENCES public.quantum_operations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle',
  current_route JSONB,
  current_location JSONB,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- SOS Requests (User/Civilian feature)
CREATE TABLE public.sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  eta_minutes INTEGER,
  assigned_volunteer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Resource requests (User/Civilian feature)
CREATE TABLE public.resource_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_request_id UUID REFERENCES public.sos_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  needs_water BOOLEAN DEFAULT false,
  needs_food BOOLEAN DEFAULT false,
  needs_medicine BOOLEAN DEFAULT false,
  needs_insulin BOOLEAN DEFAULT false,
  needs_baby_formula BOOLEAN DEFAULT false,
  other_needs TEXT,
  priority_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qpu_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantum_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'operator' THEN 2 
      WHEN 'volunteer' THEN 3 
      WHEN 'user' THEN 4 
    END
  LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- QPU Budget RLS (Admin only)
CREATE POLICY "Admins can manage QPU budget" ON public.qpu_budget
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can view QPU budget" ON public.qpu_budget
  FOR SELECT USING (public.has_role(auth.uid(), 'operator'));

-- Audit logs RLS (Admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Quantum operations RLS
CREATE POLICY "Operators can manage quantum operations" ON public.quantum_operations
  FOR ALL USING (public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins can view quantum operations" ON public.quantum_operations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Volunteer assignments RLS
CREATE POLICY "Volunteers can view own assignments" ON public.volunteer_assignments
  FOR SELECT USING (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can update own status" ON public.volunteer_assignments
  FOR UPDATE USING (auth.uid() = volunteer_id);

CREATE POLICY "Operators can manage assignments" ON public.volunteer_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'operator'));

-- SOS Requests RLS
CREATE POLICY "Users can create SOS requests" ON public.sos_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own SOS requests" ON public.sos_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Operators can manage SOS requests" ON public.sos_requests
  FOR ALL USING (public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Volunteers can view assigned SOS" ON public.sos_requests
  FOR SELECT USING (auth.uid() = assigned_volunteer_id);

-- Resource requests RLS
CREATE POLICY "Users can manage own resource requests" ON public.resource_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Operators can view resource requests" ON public.resource_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'operator'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, qr_code_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    encode(gen_random_bytes(16), 'hex')
  );
  
  -- Default role is 'user' (civilian)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial QPU budget record
INSERT INTO public.qpu_budget (total_shots, budget_limit) VALUES (10000, 1000.00);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit(
  _action TEXT,
  _resource_type TEXT,
  _resource_id TEXT DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _details)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;
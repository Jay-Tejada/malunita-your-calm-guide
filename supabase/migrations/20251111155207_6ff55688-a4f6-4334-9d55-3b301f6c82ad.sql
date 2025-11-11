-- Fix api_usage_logs overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert usage logs" ON api_usage_logs;

-- Create function to check if request is from service role (in public schema)
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role check by examining JWT claims
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->>'role')::text = 'service_role',
    false
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Create restrictive policy for api_usage_logs
CREATE POLICY "Only service role can insert usage logs"
ON api_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_service_role());

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can manage all rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
WITH CHECK (public.is_service_role());

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start timestamp with time zone;
  _current_count integer;
BEGIN
  _window_start := date_trunc('minute', now());
  
  SELECT request_count INTO _current_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND endpoint = _endpoint
    AND window_start = _window_start
    AND window_start > now() - (_window_minutes || ' minutes')::interval;
  
  IF _current_count IS NULL THEN
    INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (_user_id, _endpoint, 1, _window_start)
    ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    RETURN true;
  END IF;
  
  IF _current_count >= _max_requests THEN
    RETURN false;
  END IF;
  
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE user_id = _user_id
    AND endpoint = _endpoint
    AND window_start = _window_start;
  
  RETURN true;
END;
$$;

-- Cleanup function for maintenance
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;
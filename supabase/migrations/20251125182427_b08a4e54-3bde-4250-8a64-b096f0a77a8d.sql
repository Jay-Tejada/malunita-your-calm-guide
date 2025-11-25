-- Fix search_path security issue in trigger function
CREATE OR REPLACE FUNCTION update_user_bias_patterns_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;
-- Add location fields to tasks table for Mapbox integration
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_tasks_location 
  ON public.tasks(user_id, location_lat, location_lng) 
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
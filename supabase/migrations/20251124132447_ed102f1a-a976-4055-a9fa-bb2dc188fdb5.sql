-- Add burnout detection fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS burnout_risk numeric DEFAULT 0 CHECK (burnout_risk >= 0 AND burnout_risk <= 1),
ADD COLUMN IF NOT EXISTS burnout_detected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS burnout_recovery_until timestamp with time zone;
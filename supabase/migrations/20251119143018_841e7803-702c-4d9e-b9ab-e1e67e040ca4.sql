-- Add ritual_preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN ritual_preferences jsonb DEFAULT '{
  "morning_ritual": {
    "enabled": true,
    "start_hour": 6,
    "end_hour": 10,
    "action_button": "Start Planning"
  },
  "midday_checkin": {
    "enabled": true,
    "start_hour": 12,
    "end_hour": 15,
    "action_button": "View Tasks"
  },
  "evening_shutdown": {
    "enabled": true,
    "start_hour": 18,
    "end_hour": 22,
    "action_button": "Review Day"
  },
  "weekly_reset": {
    "enabled": true,
    "day": 0,
    "hour": 19,
    "action_button": "View Insights"
  }
}'::jsonb;
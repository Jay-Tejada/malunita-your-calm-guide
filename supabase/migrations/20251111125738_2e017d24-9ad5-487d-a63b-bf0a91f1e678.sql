-- Fix search_path for update_profile_task_stats function
CREATE OR REPLACE FUNCTION public.update_profile_task_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    total_tasks_logged = (
      SELECT COUNT(*) FROM public.tasks WHERE user_id = NEW.user_id
    ),
    average_tasks_per_day = (
      SELECT ROUND(COUNT(*)::numeric / GREATEST(1, EXTRACT(DAY FROM (NOW() - MIN(created_at)))::numeric), 0)::integer
      FROM public.tasks 
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;
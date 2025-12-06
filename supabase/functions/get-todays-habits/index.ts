import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[get-todays-habits] Request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[get-todays-habits] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-todays-habits] User:', user.id);

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    // Get user's active habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: true });

    if (habitsError) {
      console.error('[get-todays-habits] Error fetching habits:', habitsError);
      throw habitsError;
    }

    console.log('[get-todays-habits] Found habits:', habits?.length || 0);

    // Get today's completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('date', today);

    if (completionsError) {
      console.error('[get-todays-habits] Error fetching completions:', completionsError);
      throw completionsError;
    }

    const completedIds = new Set(completions?.map(c => c.habit_id) || []);
    console.log('[get-todays-habits] Completed today:', completedIds.size);

    // Filter habits based on frequency
    const todaysHabits = habits?.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekdays' && isWeekday) return true;
      // Weekly habits show on specific day (default Sunday)
      if (h.frequency === 'weekly' && dayOfWeek === 0) return true;
      return false;
    }).map(h => ({
      id: h.id,
      title: h.title,
      icon: h.icon,
      color: h.color,
      frequency: h.frequency,
      completed: completedIds.has(h.id)
    })) || [];

    // Calculate streaks for each habit (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentCompletions } = await supabase
      .from('habit_completions')
      .select('habit_id, date')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    const habitStreaks: Record<string, number> = {};
    
    for (const habit of todaysHabits) {
      const habitCompletions = recentCompletions
        ?.filter(c => c.habit_id === habit.id)
        .map(c => c.date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) || [];
      
      let streak = 0;
      let currentDate = new Date();
      
      // If not completed today, start checking from yesterday
      if (!habit.completed) {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      while (streak < 30) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (habitCompletions.includes(dateStr)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      habitStreaks[habit.id] = streak;
    }

    const habitsWithStreaks = todaysHabits.map(h => ({
      ...h,
      streak: habitStreaks[h.id] || 0
    }));

    // Sort: incomplete first, then by streak (higher first)
    habitsWithStreaks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.streak - a.streak;
    });

    console.log('[get-todays-habits] Returning habits:', habitsWithStreaks.length);

    return new Response(
      JSON.stringify({ 
        habits: habitsWithStreaks, 
        date: today,
        completedCount: habitsWithStreaks.filter(h => h.completed).length,
        totalCount: habitsWithStreaks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[get-todays-habits] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

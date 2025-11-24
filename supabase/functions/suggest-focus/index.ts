import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 suggest-focus function called');

    // JWT is already verified by platform (verify_jwt = true in config.toml)
    // Get user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Extract user ID from JWT (already verified by platform)
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    console.log('✅ User ID from JWT:', userId);

    // Get user's profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('companion_name, current_goal, peak_activity_time, focus_preferences')
      .eq('id', userId)
      .maybeSingle();

    const focusPreferences = profile?.focus_preferences || {};

    // Get today's tasks
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'today')
      .eq('completed', false);

    // Get upcoming tasks
    const { data: upcomingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'upcoming')
      .eq('completed', false)
      .limit(5);

    console.log('📊 Tasks retrieved:', { todayTasks: todayTasks?.length, upcomingTasks: upcomingTasks?.length });

    // Generate contextual guidance message
    let message = '';
    const companionName = profile?.companion_name || 'Malunita';
    const currentHour = new Date().getHours();

    // Apply focus preferences to messaging (subtle influence)
    const topPreferredCategories = Object.entries(focusPreferences)
      .filter(([_, weight]) => (weight as number) > 0.1)
      .map(([category]) => category);

    const preferenceHint = topPreferredCategories.length > 0 
      ? ` You tend to focus well on ${topPreferredCategories[0]} tasks.`
      : '';

    if (todayTasks && todayTasks.length > 0) {
      if (currentHour < 12) {
        message = `Good morning! You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} to focus on today.${preferenceHint} Let's make progress! ✨`;
      } else if (currentHour < 17) {
        message = `You're doing great! ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} remaining today. Keep the momentum going! 🚀`;
      } else {
        message = `Evening focus time! ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} left. You've got this! 🌙`;
      }
    } else if (upcomingTasks && upcomingTasks.length > 0) {
      message = `All caught up for today! Ready to plan ahead? You have ${upcomingTasks.length} upcoming task${upcomingTasks.length > 1 ? 's' : ''} to review. 🎯`;
    } else {
      if (currentHour < 12) {
        message = `Fresh start! What would you like to accomplish today?${preferenceHint} ${companionName} is here to help you plan. ☀️`;
      } else if (currentHour < 17) {
        message = `Looking peaceful! Add some tasks or take a moment to reflect on your day. 🌸`;
      } else {
        message = `Winding down? Perfect time to review your day or set tomorrow's intentions. 🌅`;
      }
    }

    console.log('💬 Generated message:', message);

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in suggest-focus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate guidance';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

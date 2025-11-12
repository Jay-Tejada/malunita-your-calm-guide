import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current hour in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    console.log(`Running daily reminder check at ${now.toISOString()}, hour: ${currentHour}`);

    // Get users who have notification preferences enabled and not snoozed
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_preferences, notification_snooze_until')
      .not('notification_preferences', 'is', null);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with notification preferences found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users who want notifications and check their preferred time
    const candidateUsers = profiles.filter(profile => {
      const prefs = profile.notification_preferences as any;
      if (!prefs?.dailyReview && !prefs?.taskReminders) return false;
      
      // Check if user has snoozed notifications
      if (profile.notification_snooze_until) {
        const snoozeUntil = new Date(profile.notification_snooze_until);
        if (now < snoozeUntil) {
          console.log(`User ${profile.id} has snoozed until ${snoozeUntil.toISOString()}`);
          return false;
        }
      }
      
      // Parse review time (format: "HH:MM", default to 8 AM Eastern)
      const reviewTime = prefs.reviewTime || "08:00";
      const [hour] = reviewTime.split(':').map(Number);
      
      // Check if current hour matches their preferred notification time
      return hour === currentHour;
    });

    if (candidateUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: `No users scheduled for notifications at hour ${currentHour}`,
          checked: profiles.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check each user for incomplete focused tasks
    const usersWithFocusedTasks = await Promise.all(
      candidateUsers.map(async (user) => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('completed', false)
          .lte('focus_date', today)
          .not('focus_date', 'is', null);

        if (error) {
          console.error(`Error fetching tasks for user ${user.id}:`, error);
          return null;
        }

        return tasks && tasks.length > 0 ? { user, taskCount: tasks.length } : null;
      })
    );

    const usersToNotify = usersWithFocusedTasks.filter(item => item !== null);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: `No users with incomplete focused tasks at hour ${currentHour}`,
          checked: candidateUsers.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${usersToNotify.length} users with incomplete focused tasks`);

    // Send notifications to each user with focused tasks
    const results = await Promise.allSettled(
      usersToNotify.map(async ({ user, taskCount }) => {
        const taskWord = taskCount === 1 ? 'task' : 'tasks';
        return fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            title: '🎯 Focus Tasks Reminder',
            body: `You have ${taskCount} incomplete focused ${taskWord} for today.`,
            icon: '/icon-192.png',
            data: {
              url: '/',
              action: 'view-focus-tasks'
            }
          }),
        });
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Sent ${successCount} notifications, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Daily reminders sent',
        sent: successCount,
        failed: failedCount,
        total: usersToNotify.length,
        currentHour
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Daily reminder error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    // Determine which check-in this is
    // Mid-day: 1:00 PM - 3:00 PM
    // End-of-day: 5:00 PM - 7:00 PM (not too late)
    const isMidDay = currentHour >= 13 && currentHour < 15;
    const isEndOfDay = currentHour >= 17 && currentHour < 19;
    
    if (!isMidDay && !isEndOfDay) {
      return new Response(
        JSON.stringify({ message: 'Not check-in time', currentHour }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const checkInType = isMidDay ? 'mid-day' : 'end-of-day';
    
    // Get all users with push notification subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id');
    
    if (subError) throw subError;
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userIds = [...new Set(subscriptions.map(s => s.user_id))];
    
    let sentCount = 0;
    let skippedCount = 0;
    
    // Check each user's priority task
    for (const userId of userIds) {
      // Get today's focus task for this user (not tomorrow's)
      const { data: focusTask, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_focus', true)
        .eq('focus_date', today) // Only check tasks for TODAY
        .eq('completed', false)
        .single();
      
      if (taskError || !focusTask) {
        skippedCount++;
        continue; // User doesn't have an incomplete priority task for today
      }
      
      // Get user's profile to check notification preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, notification_snooze_until')
        .eq('id', userId)
        .single();
      
      // Check if user has snoozed notifications
      if (profile?.notification_snooze_until) {
        const snoozeUntil = new Date(profile.notification_snooze_until);
        if (snoozeUntil > new Date()) {
          skippedCount++;
          continue;
        }
      }
      
      // Prepare notification message
      const title = checkInType === 'mid-day' 
        ? "How's your priority going?"
        : "Did you complete your priority?";
      
      const body = checkInType === 'mid-day'
        ? `Just checking in: "${focusTask.title}"`
        : `Time to reflect on: "${focusTask.title}"`;
      
      // Send push notification
      try {
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            title: title,
            body: body,
            icon: '/icon-192.png',
            data: {
              taskId: focusTask.id,
              type: 'priority-check-in',
              checkInType: checkInType,
            },
            actions: [
              { action: 'complete', title: '✓ Done' },
              { action: 'view', title: 'View Task' },
            ],
          }),
        });
        
        if (notificationResponse.ok) {
          sentCount++;
        } else {
          console.error(`Failed to send notification to user ${userId}`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        skippedCount++;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Priority task check-ins processed',
        checkInType,
        sent: sentCount,
        skipped: skippedCount,
        total: userIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check priority task error:', error);
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

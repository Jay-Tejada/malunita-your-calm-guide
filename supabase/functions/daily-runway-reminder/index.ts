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

    // Get users who have notification preferences enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, notification_preferences')
      .not('notification_preferences', 'is', null);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with notification preferences found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users who want daily review reminders at this time
    const usersToNotify = profiles.filter(profile => {
      const prefs = profile.notification_preferences as any;
      if (!prefs?.dailyReview) return false;
      
      // Parse review time (format: "HH:MM")
      const reviewTime = prefs.reviewTime || "09:00";
      const [hour] = reviewTime.split(':').map(Number);
      
      // Check if current hour matches their preferred time
      return hour === currentHour;
    });

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: `No users scheduled for notifications at hour ${currentHour}`,
          checked: profiles.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine time of day for message
    const timeOfDay = currentHour >= 6 && currentHour < 18 ? 'morning' : 'evening';
    const notificationData = timeOfDay === 'morning' 
      ? {
          title: '🌅 Morning Clarity',
          body: 'Time for your Runway Review. Set your intentions for today.',
        }
      : {
          title: '🌙 Evening Wind-Down',
          body: 'Time for your Runway Review. Reflect and close your mental tabs.',
        };

    // Send notifications to each user
    const results = await Promise.allSettled(
      usersToNotify.map(async (user) => {
        return fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            title: notificationData.title,
            body: notificationData.body,
            icon: '/icon-192.png',
            data: {
              url: '/',
              action: 'runway-review'
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
        timeOfDay,
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

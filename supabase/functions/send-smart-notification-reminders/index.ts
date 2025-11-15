import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'https://esm.sh/web-push@3.6.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  user_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

interface SmartNotification {
  id: string;
  user_id: string;
  title: string;
  description: string;
  suggested_day: string;
  suggested_time: string;
  last_sent_at: string | null;
}

interface NotificationPreferences {
  frequency?: 'daily' | 'weekly' | 'custom';
  customIntervalDays?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface UserProfile {
  id: string;
  notification_preferences: NotificationPreferences;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`Checking notifications for ${currentDay} at ${currentTime}`);

    // Find notifications that should be sent now
    // Match suggested_day (case insensitive) and suggested_time (within the current hour)
    const { data: notifications, error: notifError } = await supabase
      .from('smart_notifications')
      .select('*')
      .eq('is_active', true)
      .eq('dismissed', false)
      .ilike('suggested_day', `%${currentDay}%`)
      .not('suggested_time', 'is', null);

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
      throw notifError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('No notifications to send');
      return new Response(
        JSON.stringify({ message: 'No notifications to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by time (within current hour) and not sent in last 23 hours
    const notificationsToSend = notifications.filter((notif: SmartNotification) => {
      if (!notif.suggested_time) return false;

      // Parse suggested time
      const [suggestedHour] = notif.suggested_time.split(':').map(Number);
      
      // Check if it's the right hour
      if (suggestedHour !== currentHour) return false;

      // Check if we've sent this notification in the last 23 hours
      if (notif.last_sent_at) {
        const lastSent = new Date(notif.last_sent_at);
        const hoursSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSend < 23) {
          console.log(`Skipping notification ${notif.id} - sent ${hoursSinceLastSend.toFixed(1)} hours ago`);
          return false;
        }
      }

      return true;
    });

    console.log(`Found ${notificationsToSend.length} notifications to send`);

    if (notificationsToSend.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications ready to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set up VAPID keys for web push
    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || 
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';

    webpush.setVapidDetails(
      'mailto:support@malunita.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    let sentCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Send push notification for each notification
    for (const notification of notificationsToSend) {
      try {
        // Get user's notification preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', notification.user_id)
          .single();

        const prefs = (profile?.notification_preferences as NotificationPreferences) || {};

        // Check quiet hours
        if (prefs.quietHoursStart && prefs.quietHoursEnd) {
          const quietStart = parseInt(prefs.quietHoursStart.split(':')[0]);
          const quietEnd = parseInt(prefs.quietHoursEnd.split(':')[0]);
          
          const isInQuietHours = quietStart > quietEnd
            ? currentHour >= quietStart || currentHour < quietEnd // Spans midnight
            : currentHour >= quietStart && currentHour < quietEnd; // Same day
          
          if (isInQuietHours) {
            console.log(`Skipping notification for user ${notification.user_id} - in quiet hours`);
            skippedCount++;
            continue;
          }
        }

        // Check frequency preference
        if (notification.last_sent_at && prefs.frequency) {
          const lastSent = new Date(notification.last_sent_at);
          const daysSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
          
          let minDaysBetweenNotifications = 1; // Default daily
          if (prefs.frequency === 'weekly') {
            minDaysBetweenNotifications = 7;
          } else if (prefs.frequency === 'custom' && prefs.customIntervalDays) {
            minDaysBetweenNotifications = prefs.customIntervalDays;
          }
          
          if (daysSinceLastSend < minDaysBetweenNotifications) {
            console.log(`Skipping notification for user ${notification.user_id} - too soon (${daysSinceLastSend.toFixed(1)} days, needs ${minDaysBetweenNotifications})`);
            skippedCount++;
            continue;
          }
        }

        // Get user's push subscription
        const { data: subscriptions, error: subError } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', notification.user_id);

        if (subError || !subscriptions || subscriptions.length === 0) {
          console.log(`No push subscription for user ${notification.user_id}`);
          continue;
        }

        // Send to all user's subscriptions
        for (const sub of subscriptions) {
          try {
            const pushSubscription = sub.subscription as any;
            
            const payload = JSON.stringify({
              title: notification.title,
              body: notification.description,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `smart-notification-${notification.id}`,
            });

            await webpush.sendNotification(pushSubscription, payload);
            sentCount++;
            
            console.log(`Sent notification to user ${notification.user_id}`);
          } catch (pushError) {
            console.error(`Error sending push notification:`, pushError);
            errorCount++;
          }
        }

        // Update last_sent_at timestamp
        await supabase
          .from('smart_notifications')
          .update({ last_sent_at: now.toISOString() })
          .eq('id', notification.id);

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Sent ${sentCount} notifications with ${errorCount} errors and ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        message: 'Smart notification reminders processed',
        sent: sentCount,
        errors: errorCount,
        skipped: skippedCount,
        total: notificationsToSend.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-smart-notification-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

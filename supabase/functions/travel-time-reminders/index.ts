import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!mapboxToken) {
      console.log('Mapbox token not configured');
      return new Response(
        JSON.stringify({ message: 'Mapbox token not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Get all events happening in the next 2 hours that have locations
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('id, title, reminder_time, location_address, location_lat, location_lng, user_id')
      .gte('reminder_time', now.toISOString())
      .lte('reminder_time', twoHoursFromNow.toISOString())
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .eq('completed', false);

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) {
      console.log('No upcoming events with locations');
      return new Response(
        JSON.stringify({ message: 'No upcoming events with locations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tasks.length} upcoming events with locations`);

    const notificationsSent = [];

    for (const task of tasks) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions } = await supabaseClient
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', task.user_id);

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`No push subscriptions for user ${task.user_id}`);
          continue;
        }

        // Get user's profile to check if they want these notifications
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('notification_preferences')
          .eq('id', task.user_id)
          .single();

        if (profile?.notification_preferences?.travelRemindersDisabled) {
          console.log(`Travel reminders disabled for user ${task.user_id}`);
          continue;
        }

        // For now, use a default user location (center of US) since we don't have real-time location
        // In production, you'd want to store user's home/work location or use their last known location
        const userLat = 39.8283;
        const userLng = -98.5795;

        // Get travel time from Mapbox Directions API with current traffic
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${task.location_lng},${task.location_lat}?access_token=${mapboxToken}&geometries=geojson`;
        
        const directionsResponse = await fetch(directionsUrl);
        const directionsData = await directionsResponse.json();

        if (!directionsData.routes || directionsData.routes.length === 0) {
          console.log(`No route found for task ${task.id}`);
          continue;
        }

        const travelTimeSeconds = directionsData.routes[0].duration;
        const travelTimeMinutes = Math.round(travelTimeSeconds / 60);
        const distanceKm = Math.round(directionsData.routes[0].distance / 1000);

        console.log(`Travel time for ${task.title}: ${travelTimeMinutes} minutes (${distanceKm} km)`);

        // Add 15 minute buffer
        const bufferMinutes = 15;
        const totalMinutesNeeded = travelTimeMinutes + bufferMinutes;

        const eventTime = new Date(task.reminder_time);
        const leaveTime = new Date(eventTime.getTime() - totalMinutesNeeded * 60 * 1000);
        const notifyTime = new Date(leaveTime.getTime() - 10 * 60 * 1000); // Notify 10 min before leave time

        // Check if we should notify now
        const timeDiff = notifyTime.getTime() - now.getTime();
        const minutesUntilNotify = Math.round(timeDiff / 60000);

        // Notify if it's within 15 minutes of the notify time
        if (minutesUntilNotify >= -7 && minutesUntilNotify <= 8) {
          // Send push notification
          const { error: notifError } = await supabaseClient.functions.invoke('send-push-notification', {
            body: {
              userId: task.user_id,
              title: '🚗 Time to leave!',
              body: `Leave in ${bufferMinutes} min for "${task.title}" (${travelTimeMinutes} min drive to ${task.location_address})`,
              data: {
                type: 'travel_reminder',
                taskId: task.id,
                eventTime: task.reminder_time,
                leaveTime: leaveTime.toISOString(),
                travelTime: travelTimeMinutes,
                distance: distanceKm,
              },
            },
          });

          if (notifError) {
            console.error(`Error sending notification for task ${task.id}:`, notifError);
          } else {
            console.log(`Notification sent for task ${task.id}`);
            notificationsSent.push({
              taskId: task.id,
              title: task.title,
              travelTime: travelTimeMinutes,
              distance: distanceKm,
            });
          }
        } else {
          console.log(`Not time to notify yet for task ${task.id} (${minutesUntilNotify} minutes until notify time)`);
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Travel time reminders processed',
        tasksChecked: tasks.length,
        notificationsSent: notificationsSent.length,
        notifications: notificationsSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in travel-time-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

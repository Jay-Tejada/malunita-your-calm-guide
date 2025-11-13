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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for due task reminders...');

    // Find tasks with reminders due in the next 5 minutes that haven't been sent
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const { data: dueTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, user_id, title, reminder_time')
      .eq('completed', false)
      .not('reminder_time', 'is', null)
      .lte('reminder_time', fiveMinutesFromNow.toISOString())
      .gte('reminder_time', now.toISOString());

    if (tasksError) {
      console.error('Error fetching due tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${dueTasks?.length || 0} tasks with due reminders`);

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders due', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    // Process each task
    for (const task of dueTasks) {
      try {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('task_reminders')
          .select('id')
          .eq('task_id', task.id)
          .eq('reminder_time', task.reminder_time)
          .single();

        if (existingReminder) {
          console.log(`Reminder already sent for task ${task.id}`);
          continue;
        }

        // Get user's push subscriptions
        const { data: subscriptions, error: subsError } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', task.user_id);

        if (subsError) {
          console.error(`Error fetching subscriptions for user ${task.user_id}:`, subsError);
          failedCount++;
          continue;
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`No push subscriptions for user ${task.user_id}`);
          // Still mark as sent to avoid retrying
          await supabase.from('task_reminders').insert({
            task_id: task.id,
            user_id: task.user_id,
            reminder_time: task.reminder_time,
          });
          continue;
        }

        // Send push notification to all user's devices
        const notificationPayload = {
          title: '⏰ Task Reminder',
          body: task.title,
          data: {
            taskId: task.id,
            url: '/',
          },
        };

        // Call send-push-notification edge function
        const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: task.user_id,
            ...notificationPayload,
          },
        });

        if (pushError) {
          console.error(`Error sending push notification for task ${task.id}:`, pushError);
          failedCount++;
          continue;
        }

        // Mark reminder as sent
        const { error: insertError } = await supabase.from('task_reminders').insert({
          task_id: task.id,
          user_id: task.user_id,
          reminder_time: task.reminder_time,
        });

        if (insertError) {
          console.error(`Error marking reminder as sent for task ${task.id}:`, insertError);
          failedCount++;
          continue;
        }

        sentCount++;
        console.log(`Sent reminder for task: ${task.title}`);
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Task reminders processed',
        sent: sentCount,
        failed: failedCount,
        total: dueTasks.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in send-task-reminders:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
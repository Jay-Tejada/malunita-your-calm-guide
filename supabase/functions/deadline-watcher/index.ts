import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Load active tasks with reminder_time (using as due date)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, reminder_time, category, context')
      .eq('user_id', user.id)
      .eq('completed', false)
      .not('reminder_time', 'is', null)
      .order('reminder_time', { ascending: true });

    if (tasksError) throw tasksError;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twoDaysOut = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const fiveDaysOut = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const dueTomorrow: string[] = [];
    const dueSoon: string[] = [];
    const overdue: string[] = [];
    const missingPreparation: string[] = [];

    for (const task of tasks || []) {
      const dueDate = new Date(task.reminder_time);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Overdue
      if (dueDate < now) {
        overdue.push(task.title);
        continue;
      }

      // Due tomorrow (24-48 hours)
      if (dueDate >= tomorrow && dueDate <= twoDaysOut) {
        dueTomorrow.push(task.title);
      }
      // Due soon (3-5 days)
      else if (dueDate > twoDaysOut && dueDate <= fiveDaysOut) {
        dueSoon.push(task.title);
      }

      // Missing preparation: tasks due within 24h that seem complex
      if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
        const complexIndicators = [
          'project', 'proposal', 'report', 'presentation',
          'review', 'plan', 'strategy', 'analysis', 'research'
        ];
        const titleLower = task.title.toLowerCase();
        const isComplex = complexIndicators.some(indicator => titleLower.includes(indicator));
        
        if (isComplex) {
          missingPreparation.push(task.title);
        }
      }
    }

    // Generate alert message
    let alertMessage = "";
    if (overdue.length > 0) {
      alertMessage = `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} need immediate attention`;
    } else if (missingPreparation.length > 0) {
      alertMessage = `${missingPreparation.length} complex task${missingPreparation.length > 1 ? 's' : ''} due soon may need more preparation`;
    } else if (dueTomorrow.length > 0) {
      alertMessage = `${dueTomorrow.length} task${dueTomorrow.length > 1 ? 's' : ''} due tomorrow`;
    } else if (dueSoon.length > 0) {
      alertMessage = `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due in the next few days`;
    } else {
      alertMessage = "No urgent deadlines detected";
    }

    return new Response(
      JSON.stringify({
        due_tomorrow: dueTomorrow,
        due_soon: dueSoon,
        overdue: overdue,
        missing_preparation: missingPreparation,
        alert_message: alertMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in deadline-watcher:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

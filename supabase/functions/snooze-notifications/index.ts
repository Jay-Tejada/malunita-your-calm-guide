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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { duration } = await req.json();
    
    // Calculate snooze until time based on duration
    let snoozeUntil: Date;
    const now = new Date();
    
    switch (duration) {
      case '30m':
        snoozeUntil = new Date(now.getTime() + 30 * 60 * 1000);
        break;
      case '1h':
        snoozeUntil = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'tomorrow':
        snoozeUntil = new Date(now);
        snoozeUntil.setDate(snoozeUntil.getDate() + 1);
        snoozeUntil.setHours(8, 0, 0, 0); // 8 AM tomorrow
        break;
      default:
        throw new Error('Invalid snooze duration');
    }

    console.log(`Snoozing notifications for user ${user.id} until ${snoozeUntil.toISOString()}`);

    // Update user profile with snooze time
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ notification_snooze_until: snoozeUntil.toISOString() })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        snoozeUntil: snoozeUntil.toISOString(),
        message: `Notifications snoozed until ${snoozeUntil.toLocaleString()}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Snooze error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { recommendations, weekIdentifier } = await req.json();

    if (!recommendations || !Array.isArray(recommendations)) {
      throw new Error('Invalid recommendations data');
    }

    // Extract scheduling recommendations and parse day/time info
    const notificationsToCreate = [];
    const dayMap: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };

    for (const rec of recommendations as Recommendation[]) {
      // Look for scheduling-related recommendations
      if (rec.type === 'scheduling' || rec.type === 'productivity') {
        // Try to extract day from description
        const lowerDesc = rec.description.toLowerCase();
        let suggestedDay: string | null = null;
        let suggestedTime: string | null = null;

        // Find day mentions
        for (const [key, value] of Object.entries(dayMap)) {
          if (lowerDesc.includes(key)) {
            suggestedDay = value;
            break;
          }
        }

        // Extract time if mentioned (e.g., "9am", "2pm", "morning", "afternoon")
        if (lowerDesc.includes('morning')) {
          suggestedTime = '09:00:00';
        } else if (lowerDesc.includes('afternoon')) {
          suggestedTime = '14:00:00';
        } else if (lowerDesc.includes('evening')) {
          suggestedTime = '18:00:00';
        }

        // Check for specific time patterns like "2pm" or "9am"
        const timeMatch = lowerDesc.match(/(\d{1,2})\s*(am|pm)/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const isPM = timeMatch[2].toLowerCase() === 'pm';
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          suggestedTime = `${hour.toString().padStart(2, '0')}:00:00`;
        }

        notificationsToCreate.push({
          user_id: user.id,
          recommendation_type: rec.type,
          title: rec.title,
          description: rec.description,
          suggested_day: suggestedDay,
          suggested_time: suggestedTime,
          created_from_week: weekIdentifier,
          is_active: true,
          dismissed: false
        });
      }
    }

    if (notificationsToCreate.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No scheduling recommendations to convert',
          created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if notifications already exist for this week
    const { data: existing } = await supabase
      .from('smart_notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('created_from_week', weekIdentifier)
      .eq('is_active', true);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Notifications already exist for this week',
          created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications
    const { data: created, error: createError } = await supabase
      .from('smart_notifications')
      .insert(notificationsToCreate)
      .select();

    if (createError) {
      console.error('Error creating notifications:', createError);
      throw createError;
    }

    console.log(`Created ${created?.length || 0} smart notifications for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Smart notifications created successfully',
        created: created?.length || 0,
        notifications: created
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-smart-notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

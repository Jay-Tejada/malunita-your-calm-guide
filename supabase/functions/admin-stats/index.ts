import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get usage stats
    const { data: usageLogs, error: logsError } = await supabase
      .from('api_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (logsError) {
      console.error('Error fetching usage logs:', logsError);
      throw logsError;
    }

    // Calculate aggregated stats
    const totalCost = usageLogs?.reduce((sum, log) => sum + Number(log.estimated_cost), 0) || 0;
    const totalTokens = usageLogs?.reduce((sum, log) => sum + log.tokens_used, 0) || 0;

    // Group by model
    const modelStats = usageLogs?.reduce((acc: any, log) => {
      const model = log.model_used;
      if (!acc[model]) {
        acc[model] = { count: 0, tokens: 0, cost: 0 };
      }
      acc[model].count++;
      acc[model].tokens += log.tokens_used;
      acc[model].cost += Number(log.estimated_cost);
      return acc;
    }, {});

    // Group by function
    const functionStats = usageLogs?.reduce((acc: any, log) => {
      const fn = log.function_name;
      if (!acc[fn]) {
        acc[fn] = { count: 0, tokens: 0, cost: 0 };
      }
      acc[fn].count++;
      acc[fn].tokens += log.tokens_used;
      acc[fn].cost += Number(log.estimated_cost);
      return acc;
    }, {});

    // Get weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyLogs = usageLogs?.filter(log => new Date(log.created_at) >= weekAgo) || [];
    const weeklyCost = weeklyLogs.reduce((sum, log) => sum + Number(log.estimated_cost), 0);

    // Get all users count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({
        totalCost: totalCost.toFixed(4),
        totalTokens,
        totalRequests: usageLogs?.length || 0,
        weeklyCost: weeklyCost.toFixed(4),
        weeklyRequests: weeklyLogs.length,
        modelStats,
        functionStats,
        userCount: userCount || 0,
        recentLogs: usageLogs?.slice(0, 50) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in admin-stats function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

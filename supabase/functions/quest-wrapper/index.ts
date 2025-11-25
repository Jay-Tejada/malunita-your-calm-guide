import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Phase {
  title: string;
  description: string;
  tasks: Array<{
    id: string;
    title: string;
    tiny: boolean;
    priority: 'must' | 'should' | 'could';
    reason: string;
  }>;
}

interface Plan {
  phases: Phase[];
  dependencies: any[];
  quick_wins: any[];
  blockers: any[];
  summary: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan } = await req.json() as { plan: Plan };

    if (!plan || !plan.phases) {
      return new Response(
        JSON.stringify({ error: 'Plan data required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Wrapping plan into quest for user: ${user.id}`);

    // Fetch user profile for personality and mood
    const { data: profile } = await supabase
      .from('profiles')
      .select('companion_personality_type, emotional_memory')
      .eq('id', user.id)
      .single();

    const personality = profile?.companion_personality_type || 'balanced';
    const emotionalMemory = profile?.emotional_memory || {};
    
    // Determine quest tone based on personality
    let questTone = 'balanced and encouraging';
    let questPrefix = '🎯';
    
    if (personality === 'energetic') {
      questTone = 'energetic and motivating';
      questPrefix = '⚡';
    } else if (personality === 'calm') {
      questTone = 'calm and steady';
      questPrefix = '🌊';
    } else if (personality === 'playful') {
      questTone = 'playful and fun';
      questPrefix = '🎮';
    }

    // Generate quest title based on plan phases
    const phaseCount = plan.phases.length;
    const taskCount = plan.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    
    const questTitles = [
      `Your ${phaseCount}-Chapter Journey`,
      `Mission: Complete ${taskCount} Tasks`,
      `The ${phaseCount}-Phase Quest`,
      `Your Path to ${taskCount} Victories`,
      `Quest: Master ${phaseCount} Domains`
    ];
    
    const quest_title = questPrefix + ' ' + questTitles[Math.floor(Math.random() * questTitles.length)];

    // Generate quest summary
    const quickWinsCount = plan.quick_wins?.length || 0;
    const blockersCount = plan.blockers?.length || 0;
    
    let quest_summary = `You have ${phaseCount} phases ahead with ${taskCount} tasks total. `;
    
    if (quickWinsCount > 0) {
      quest_summary += `Start with ${quickWinsCount} quick wins to build momentum. `;
    }
    
    if (blockersCount > 0) {
      quest_summary += `Note: ${blockersCount} tasks need clarification before you begin. `;
    }
    
    quest_summary += plan.summary;

    // Wrap each phase into a chapter
    const chapters = plan.phases.map((phase, idx) => {
      const chapterNumber = idx + 1;
      const chapterEmoji = ['🌱', '🌿', '🌳', '🌲', '🏔️'][idx] || '✨';
      
      let chapterSummary = phase.description;
      const mustTasks = phase.tasks.filter(t => t.priority === 'must').length;
      const shouldTasks = phase.tasks.filter(t => t.priority === 'should').length;
      const tinyTasks = phase.tasks.filter(t => t.tiny).length;
      
      if (mustTasks > 0) {
        chapterSummary += ` ${mustTasks} critical tasks require focus.`;
      }
      if (tinyTasks > 0) {
        chapterSummary += ` ${tinyTasks} quick tasks included.`;
      }

      return {
        chapter_title: `${chapterEmoji} Chapter ${chapterNumber}: ${phase.title}`,
        chapter_summary: chapterSummary,
        steps: phase.tasks.map(task => ({
          id: task.id,
          title: task.title,
          reason: task.reason,
          tiny: task.tiny,
          priority: task.priority
        }))
      };
    });

    // Generate motivation boost based on personality
    let motivation_boost = '';
    
    if (personality === 'energetic') {
      motivation_boost = '🔥 You\'ve got this! Let\'s crush these tasks one by one!';
    } else if (personality === 'calm') {
      motivation_boost = '🌸 Take it step by step. You\'re making progress with every task.';
    } else if (personality === 'playful') {
      motivation_boost = '🎯 Game on! Each completed task is a level up!';
    } else {
      motivation_boost = '💪 Every journey begins with a single step. You\'re ready!';
    }

    console.log('Quest wrapper complete');

    return new Response(
      JSON.stringify({
        quest_title,
        quest_summary,
        chapters,
        motivation_boost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in quest-wrapper:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to wrap quest';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

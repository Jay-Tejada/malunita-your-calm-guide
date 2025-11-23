import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestTemplate {
  type: string;
  title: string;
  description: string;
  targetValue: number;
  rewardXp: number;
  rewardAffection: number;
  rewardCosmeticType?: string;
  rewardCosmeticId?: string;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  // Task completion quests
  {
    type: 'complete_tasks',
    title: 'Task Master',
    description: 'Complete 10 tasks this week',
    targetValue: 10,
    rewardXp: 100,
    rewardAffection: 5,
  },
  {
    type: 'complete_tasks',
    title: 'Productivity Champion',
    description: 'Complete 20 tasks this week',
    targetValue: 20,
    rewardXp: 200,
    rewardAffection: 10,
    rewardCosmeticType: 'accessory',
    rewardCosmeticId: 'tiny-crown',
  },
  {
    type: 'complete_tasks',
    title: 'Task Warrior',
    description: 'Complete 5 tasks this week',
    targetValue: 5,
    rewardXp: 50,
    rewardAffection: 3,
  },
  
  // Ritual streak quests
  {
    type: 'ritual_streak',
    title: 'Consistent Rituals',
    description: 'Complete morning or evening rituals 3 days in a row',
    targetValue: 3,
    rewardXp: 150,
    rewardAffection: 8,
  },
  {
    type: 'ritual_streak',
    title: 'Ritual Master',
    description: 'Complete morning or evening rituals 5 days in a row',
    targetValue: 5,
    rewardXp: 250,
    rewardAffection: 12,
    rewardCosmeticType: 'aura',
    rewardCosmeticId: 'zen-glow',
  },
  
  // Focus mode quests
  {
    type: 'focus_sessions',
    title: 'Deep Work Explorer',
    description: 'Use focus mode twice this week',
    targetValue: 2,
    rewardXp: 80,
    rewardAffection: 4,
  },
  {
    type: 'focus_sessions',
    title: 'Focus Champion',
    description: 'Use focus mode 5 times this week',
    targetValue: 5,
    rewardXp: 180,
    rewardAffection: 9,
    rewardCosmeticType: 'trail',
    rewardCosmeticId: 'focus-sparkle',
  },
  
  // Mini-game quests
  {
    type: 'mini_games',
    title: 'Playful Break',
    description: 'Play a mini-game once this week',
    targetValue: 1,
    rewardXp: 30,
    rewardAffection: 5,
  },
  {
    type: 'mini_games',
    title: 'Game Master',
    description: 'Play mini-games 3 times this week',
    targetValue: 3,
    rewardXp: 90,
    rewardAffection: 10,
    rewardCosmeticType: 'accessory',
    rewardCosmeticId: 'game-controller',
  },
  
  // Project quests
  {
    type: 'complete_project',
    title: 'Project Finisher',
    description: 'Complete all tasks in a category or goal',
    targetValue: 1,
    rewardXp: 200,
    rewardAffection: 15,
    rewardCosmeticType: 'expression',
    rewardCosmeticId: 'proud-smile',
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Check if quests already exist for this week
    const { data: existingQuests } = await supabase
      .from('weekly_quests')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr);

    if (existingQuests && existingQuests.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Quests already generated for this week', quests: existingQuests }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select 3 random quest templates
    const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffled.slice(0, 3);

    // Create quests
    const quests = selectedTemplates.map(template => ({
      user_id: user.id,
      week_start: weekStartStr,
      title: template.title,
      description: template.description,
      quest_type: template.type,
      target_value: template.targetValue,
      current_value: 0,
      reward_xp: template.rewardXp,
      reward_affection: template.rewardAffection,
      reward_cosmetic_type: template.rewardCosmeticType || null,
      reward_cosmetic_id: template.rewardCosmeticId || null,
      completed: false,
      claimed: false,
    }));

    const { data: createdQuests, error: insertError } = await supabase
      .from('weekly_quests')
      .insert(quests)
      .select();

    if (insertError) throw insertError;

    console.log(`Generated ${createdQuests.length} quests for user ${user.id}`);

    return new Response(
      JSON.stringify({ quests: createdQuests }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating weekly quests:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

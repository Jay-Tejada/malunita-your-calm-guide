import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

    const { text, inputMethod } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid text input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding using Lovable AI
    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!embeddingResponse.ok) {
      console.error('Embedding API error:', await embeddingResponse.text());
      throw new Error('Failed to generate embeddings');
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Fetch current memory profile
    const { data: memoryProfile } = await supabase
      .from('ai_memory_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Analyze writing style patterns
    const writingStyle = analyzeWritingStyle(text);
    const phrasings = extractUniquePhrasings(text);
    
    // Update memory profile
    const updates: any = {
      writing_style: writingStyle,
      last_updated: new Date().toISOString(),
    };

    // Store embeddings as metadata (simplified for now)
    if (memoryProfile?.category_preferences) {
      // Merge with existing patterns
      updates.category_preferences = {
        ...memoryProfile.category_preferences,
        _writing_patterns: [
          ...(memoryProfile.category_preferences._writing_patterns || []),
          { text: text.substring(0, 50), embedding: embedding.slice(0, 10) } // Store sample
        ].slice(-20) // Keep last 20
      };
    }

    // Upsert memory profile
    const { error: upsertError } = await supabase
      .from('ai_memory_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
      });

    if (upsertError) {
      console.error('Error updating memory profile:', upsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        writingStyle,
        phrasings,
        embedding: embedding.slice(0, 10), // Return sample for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in learn-writing-style:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeWritingStyle(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Detect casual markers
  const casualMarkers = ['like', 'just', 'maybe', 'kinda', 'sorta', 'basically', 'literally'];
  const casualCount = casualMarkers.filter(marker => lowerText.includes(marker)).length;
  
  // Detect formal markers
  const formalMarkers = ['please', 'kindly', 'would appreciate', 'could you', 'thank you'];
  const formalCount = formalMarkers.filter(marker => lowerText.includes(marker)).length;
  
  // Detect direct/concise style
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
  const isDirect = avgWordLength < 5 && text.split(/\s+/).length < 15;
  
  if (formalCount > casualCount) return 'formal';
  if (casualCount > formalCount) return 'casual';
  if (isDirect) return 'direct';
  return 'neutral';
}

function extractUniquePhrasings(text: string): string[] {
  // Extract unique 2-3 word phrases that might be personal vocabulary
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
    if (twoWordPhrase.length > 5 && !phrases.includes(twoWordPhrase)) {
      phrases.push(twoWordPhrase);
    }
    
    if (i < words.length - 2) {
      const threeWordPhrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (threeWordPhrase.length > 8 && !phrases.includes(threeWordPhrase)) {
        phrases.push(threeWordPhrase);
      }
    }
  }
  
  return phrases.slice(0, 10); // Return top 10
}

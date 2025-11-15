import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { categoryId } = await req.json();
    
    if (!categoryId || typeof categoryId !== 'string') {
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Invalid category ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch tasks for this category
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title')
      .eq('user_id', user.id)
      .eq('custom_category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing trained keywords to exclude them
    const { data: existingKeywords } = await supabase
      .from('category_keywords')
      .select('keyword')
      .eq('user_id', user.id)
      .eq('custom_category_id', categoryId);

    const existingKeywordSet = new Set(
      (existingKeywords || []).map(k => k.keyword.toLowerCase())
    );

    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us',
      'them', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
      'each', 'every', 'both', 'few', 'more', 'most', 'some', 'such', 'no',
      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
      'about', 'up', 'out', 'if', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'under', 'again', 'further',
      'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each'
    ]);

    // Extract and count words/phrases
    const wordCount: Record<string, number> = {};
    const phraseCount: Record<string, number> = {};

    tasks.forEach(task => {
      const text = task.title.toLowerCase();
      
      // Count individual words
      const words = text.split(/\s+/).filter((w: string) => 
        w.length > 2 && 
        !stopWords.has(w) &&
        !existingKeywordSet.has(w) &&
        /^[a-z]+$/.test(w)
      );
      
      words.forEach((word: string) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Count 2-3 word phrases
      for (let i = 0; i < words.length - 1; i++) {
        const twoWord = `${words[i]} ${words[i + 1]}`;
        if (!existingKeywordSet.has(twoWord)) {
          phraseCount[twoWord] = (phraseCount[twoWord] || 0) + 1;
        }
        
        if (i < words.length - 2) {
          const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          if (!existingKeywordSet.has(threeWord)) {
            phraseCount[threeWord] = (phraseCount[threeWord] || 0) + 1;
          }
        }
      }
    });

    // Sort and get top suggestions
    const topWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .filter(([, count]) => count >= 2)
      .map(([word, count]) => ({
        keyword: word,
        frequency: count,
        type: 'word' as const
      }));

    const topPhrases = Object.entries(phraseCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .filter(([, count]) => count >= 2)
      .map(([phrase, count]) => ({
        keyword: phrase,
        frequency: count,
        type: 'phrase' as const
      }));

    // Combine and sort by frequency
    const suggestions = [...topPhrases, ...topWords]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    console.log(`Generated ${suggestions.length} keyword suggestions for category ${categoryId}`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Keyword suggestion error:', error);
    return new Response(
      JSON.stringify({ 
        suggestions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

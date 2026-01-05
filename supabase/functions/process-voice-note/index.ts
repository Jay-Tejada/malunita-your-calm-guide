import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Background Voice Note Processor - Full Async Pipeline
 * 
 * PIPELINE STAGES:
 * 1. pending → processing: Audio downloaded
 * 2. processing → transcribed: Whisper API transcription complete
 * 3. transcribed → summarized: AI semantic compression done
 * 4. summarized → indexed: Context/memory tags extracted
 * 
 * Each stage updates status so UI can show progress.
 * Failures at any stage preserve previous work - never delete raw content.
 */

// Helper to update task status with logging
async function updateStatus(
  supabase: any, 
  taskId: string, 
  status: string, 
  updates: Record<string, any> = {}
) {
  console.log(`📊 Status update: ${status}`, { taskId, ...updates });
  const { error } = await supabase
    .from('tasks')
    .update({ processing_status: status, ...updates })
    .eq('id', taskId);
  
  if (error) {
    console.error(`❌ Failed to update status to ${status}:`, error);
  }
  return error;
}

// STEP 2: Semantic Compression - Generate concise summary
async function runSemanticCompression(
  text: string, 
  lovableApiKey: string
): Promise<{ summary: string; confidence: number } | null> {
  try {
    console.log('🧠 Running semantic compression...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a task compression expert. Your job is to:
1. Extract the core actionable task from voice transcriptions
2. Remove filler words, hesitations, and tangents
3. Produce a clean, concise task title (max 100 chars)
4. Rate your confidence (0.0-1.0) based on clarity of the input

Output ONLY valid JSON: {"summary": "...", "confidence": 0.X}`
          },
          {
            role: 'user',
            content: `Compress this voice transcription into a task:\n\n"${text}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI compression error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Semantic compression complete:', parsed);
      return {
        summary: parsed.summary || text.substring(0, 100),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      };
    } catch {
      // If not valid JSON, extract from response
      console.warn('⚠️ Could not parse compression response, using raw');
      return { summary: content.substring(0, 100), confidence: 0.5 };
    }
  } catch (error) {
    console.error('❌ Semantic compression failed:', error);
    return null;
  }
}

// STEP 3: Context Indexing - Extract memory tags and metadata
async function runContextIndexing(
  text: string,
  summary: string,
  lovableApiKey: string
): Promise<{ tags: string[]; category: string; priority: string } | null> {
  try {
    console.log('🏷️ Running context indexing...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a task categorization expert. Analyze tasks and extract:
1. memory_tags: 3-5 keyword tags for future recall (lowercase, no spaces)
2. category: one of [work, personal, health, finance, home, social, learning, errands]
3. priority: one of [MUST, SHOULD, COULD] based on urgency/importance signals

Output ONLY valid JSON: {"tags": ["tag1", "tag2"], "category": "...", "priority": "..."}`
          },
          {
            role: 'user',
            content: `Analyze this task:\nOriginal: "${text}"\nSummary: "${summary}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI indexing error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Context indexing complete:', parsed);
      return {
        tags: parsed.tags || [],
        category: parsed.category || 'inbox',
        priority: parsed.priority || 'COULD',
      };
    } catch {
      console.warn('⚠️ Could not parse indexing response');
      return null;
    }
  } catch (error) {
    console.error('❌ Context indexing failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { task_id, audio_path, user_id } = await req.json();

    if (!task_id || !audio_path || !user_id) {
      throw new Error('Missing required fields: task_id, audio_path, user_id');
    }

    console.log('🎤 Starting voice note pipeline:', { task_id, audio_path });

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: DOWNLOAD AUDIO
    // ═══════════════════════════════════════════════════════════════
    await updateStatus(supabase, task_id, 'processing');

    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from('voice-notes')
      .download(audio_path);

    if (downloadError || !audioData) {
      console.error('❌ Failed to download audio:', downloadError);
      await updateStatus(supabase, task_id, 'failed', {
        title: 'Voice note (download failed)',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Audio download failed', stage: 'download' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📥 Audio downloaded, size:', audioData.size);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: TRANSCRIPTION (Whisper)
    // ═══════════════════════════════════════════════════════════════
    let transcribedText = '';
    
    if (openaiKey) {
      const formData = new FormData();
      formData.append('file', audioData, 'audio.webm');
      formData.append('model', 'whisper-1');

      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (whisperResponse.ok) {
        const whisperResult = await whisperResponse.json();
        transcribedText = whisperResult.text?.trim() || '';
        console.log('✅ Transcription complete:', transcribedText.substring(0, 100));
      } else {
        console.error('❌ Whisper API error:', await whisperResponse.text());
      }
    } else {
      console.warn('⚠️ No OPENAI_API_KEY configured, skipping transcription');
    }

    if (!transcribedText) {
      // Keep audio for retry, mark as failed
      await updateStatus(supabase, task_id, 'failed', {
        title: 'Voice note (transcription failed - tap to retry)',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Transcription failed', stage: 'transcribe' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save raw transcription immediately - NEVER lose this
    await updateStatus(supabase, task_id, 'transcribed', {
      raw_content: transcribedText,
      title: transcribedText.length > 100 
        ? transcribedText.substring(0, 97) + '...' 
        : transcribedText,
      input_method: 'voice',
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: SEMANTIC COMPRESSION (Lovable AI)
    // ═══════════════════════════════════════════════════════════════
    let summary = transcribedText;
    let confidence = 0.5;

    if (lovableApiKey && transcribedText.length > 50) {
      const compressionResult = await runSemanticCompression(transcribedText, lovableApiKey);
      
      if (compressionResult) {
        summary = compressionResult.summary;
        confidence = compressionResult.confidence;
        
        await updateStatus(supabase, task_id, 'summarized', {
          ai_summary: summary,
          ai_confidence: confidence,
          title: summary.length > 100 ? summary.substring(0, 97) + '...' : summary,
        });
      } else {
        // Compression failed, but we still have transcription - continue
        console.warn('⚠️ Semantic compression failed, using raw transcript');
        await updateStatus(supabase, task_id, 'summarized', {
          ai_confidence: 0.3, // Low confidence = show raw
        });
      }
    } else {
      // No API key or text too short - skip compression
      await updateStatus(supabase, task_id, 'summarized');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: CONTEXT INDEXING (Lovable AI)
    // ═══════════════════════════════════════════════════════════════
    if (lovableApiKey) {
      const indexingResult = await runContextIndexing(transcribedText, summary, lovableApiKey);
      
      if (indexingResult) {
        const aiMetadata = {
          memory_tags: indexingResult.tags,
          category: indexingResult.category,
          priority: indexingResult.priority,
          indexed_at: new Date().toISOString(),
        };
        
        await updateStatus(supabase, task_id, 'indexed', {
          ai_metadata: aiMetadata,
          category: indexingResult.category !== 'inbox' ? indexingResult.category : undefined,
        });
      } else {
        // Indexing failed silently - we have summary, that's enough
        console.warn('⚠️ Context indexing failed, skipping');
        await updateStatus(supabase, task_id, 'indexed');
      }
    } else {
      await updateStatus(supabase, task_id, 'indexed');
    }

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    // Clear pending path now that processing is complete
    await supabase
      .from('tasks')
      .update({ pending_audio_path: null })
      .eq('id', task_id);

    // Optionally delete audio file after successful processing
    // await supabase.storage.from('voice-notes').remove([audio_path]);

    console.log('✅ Voice note pipeline complete:', task_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id,
        stages_completed: ['download', 'transcribe', 'summarize', 'index'],
        summary,
        confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Voice note pipeline error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

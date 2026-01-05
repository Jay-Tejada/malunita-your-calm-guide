import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Background voice note processor
 * 
 * This function:
 * 1. Downloads audio from storage
 * 2. Transcribes via OpenAI Whisper
 * 3. Runs AI processing pipeline
 * 4. Updates the task with transcribed content
 * 
 * Called asynchronously after instant task creation
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { task_id, audio_path, user_id } = await req.json();

    if (!task_id || !audio_path || !user_id) {
      throw new Error('Missing required fields: task_id, audio_path, user_id');
    }

    console.log('🎤 Processing voice note:', { task_id, audio_path });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update task status to processing
    await supabase
      .from('tasks')
      .update({ processing_status: 'processing' })
      .eq('id', task_id);

    // Download audio from storage
    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from('voice-notes')
      .download(audio_path);

    if (downloadError || !audioData) {
      console.error('❌ Failed to download audio:', downloadError);
      await supabase
        .from('tasks')
        .update({ 
          processing_status: 'failed',
          title: 'Voice note (processing failed)'
        })
        .eq('id', task_id);
      throw new Error('Failed to download audio');
    }

    console.log('📥 Audio downloaded, size:', audioData.size);

    // Transcribe with OpenAI Whisper
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
    }

    if (!transcribedText) {
      // Fallback: mark as needing manual review
      await supabase
        .from('tasks')
        .update({
          title: 'Voice note (tap to play)',
          processing_status: 'failed',
        })
        .eq('id', task_id);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Transcription failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now run through AI processing pipeline (similar to process-input)
    // For now, just update with transcribed text - can add full pipeline later
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title: transcribedText.length > 100 
          ? transcribedText.substring(0, 97) + '...' 
          : transcribedText,
        raw_content: transcribedText,
        ai_summary: transcribedText.length > 100 ? transcribedText : null,
        processing_status: 'completed',
        pending_audio_path: null, // Clear the pending path
        input_method: 'voice',
      })
      .eq('id', task_id);

    if (updateError) {
      console.error('❌ Failed to update task:', updateError);
      throw updateError;
    }

    // Optionally delete the audio file after successful processing
    // await supabase.storage.from('voice-notes').remove([audio_path]);

    console.log('✅ Voice note processed successfully:', task_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id,
        transcribed_text: transcribedText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Process voice note error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

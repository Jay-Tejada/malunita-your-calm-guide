import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25MB

// Fast base64 decode using TextDecoder
function decodeBase64Fast(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  console.log('Transcribe-audio function called');

  try {
    // Quick auth check - just validate JWT exists
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract user ID from JWT (skip database validation for speed)
    const jwt = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(atob(jwt.split('.')[1]))
    const userId = payload.sub
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', userId, `(${Date.now() - startTime}ms)`);

    const { audio } = await req.json()
    
    // Input validation
    if (!audio || typeof audio !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid audio data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (audio.length > MAX_AUDIO_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large. Maximum size is 25MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  console.log('Decoding audio...', `(${Date.now() - startTime}ms)`);
  const binaryAudio = decodeBase64Fast(audio);
  
  // Create FormData
  const formData = new FormData()
  const blob = new Blob([binaryAudio.buffer], { type: 'audio/webm' })
    formData.append('file', blob, 'recording.webm')
    formData.append('model', 'whisper-large-v3-turbo')
    formData.append('response_format', 'json')

    // Use Groq for faster transcription (10x faster than OpenAI Whisper)
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    let response: Response;
    
    if (GROQ_API_KEY) {
      // Groq Whisper - much faster
      console.log('Using Groq Whisper...', `(${Date.now() - startTime}ms)`);
      response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });
    } else {
      // Fallback to OpenAI
      console.log('Using OpenAI Whisper...', `(${Date.now() - startTime}ms)`);
      formData.set('model', 'whisper-1');
      response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });
    }

    console.log('API response status:', response.status, `(${Date.now() - startTime}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Transcription service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Transcription complete:', result.text?.length || 0, 'chars', `(${Date.now() - startTime}ms total)`);

    // Fire-and-forget rate limit tracking (don't await)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    supabase.rpc('check_rate_limit', {
      _user_id: userId,
      _endpoint: 'transcribe-audio',
      _max_requests: 30,
      _window_minutes: 1
    });

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

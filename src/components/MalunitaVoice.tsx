import { useState, useRef, useEffect } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { MoodSelector } from "@/components/MoodSelector";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MalunitaVoiceProps {
  onSaveNote?: (text: string, response: string) => void;
}

export const MalunitaVoice = ({ onSaveNote }: MalunitaVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [gptResponse, setGptResponse] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [sessionId] = useState(() => Date.now().toString());
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  
  const { profile } = useProfile();
  const audioEnabled = profile?.wants_voice_playback ?? true;
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bands = 7;
    const bandSize = Math.floor(dataArray.length / bands);
    const newLevels = [];

    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      const bandData = dataArray.slice(start, end);
      const average = bandData.reduce((sum, val) => sum + val, 0) / bandData.length;
      newLevels.push(Math.max(0.2, Math.min(1, average / 128)));
    }

    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const playAudioResponse = async (base64Audio: string) => {
    if (!audioEnabled) return;

    try {
      setIsSpeaking(true);
      
      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Audio playback error",
          description: "Failed to play audio response",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
    }
  };

  const handleVoiceLoop = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      analyzeAudio();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);
        setTranscribedText("");
        setGptResponse("");

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            toast({
              title: "Error",
              description: "Failed to process audio",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          try {
            // Step 1: Transcribe audio
            console.log('Transcribing audio...');
            const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (transcribeError) throw transcribeError;

            const transcribed = transcribeData.text;
            setTranscribedText(transcribed);
            console.log('Transcribed:', transcribed);

            // Step 2: Send to ChatGPT with full conversation history and user profile
            console.log('Processing with ChatGPT...');
            
            // Get user profile for personalization
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            let userProfileData = null;
            
            if (currentUser) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
              
              userProfileData = profileData;
            }
            
            // Build messages array with conversation history
            const messages: Message[] = [
              ...conversationHistory,
              { role: 'user', content: transcribed }
            ];

            const { data: chatData, error: chatError } = await supabase.functions.invoke('chat-completion', {
              body: { 
                messages,
                userProfile: userProfileData,
                currentMood 
              }
            });

            if (chatError) throw chatError;

            const response = chatData.reply;
            setGptResponse(response);
            console.log('GPT Response:', response);

            // Show mood selector after response
            setShowMoodSelector(true);

            // Update conversation history and save to database
            const { data: { user } } = await supabase.auth.getUser();
            
            setConversationHistory(prev => [
              ...prev,
              { role: 'user', content: transcribed },
              { role: 'assistant', content: response }
            ]);

            // Save conversation to database
            if (user) {
              await supabase.from('conversation_history').insert([
                {
                  user_id: user.id,
                  session_id: sessionId,
                  role: 'user',
                  content: transcribed,
                },
                {
                  user_id: user.id,
                  session_id: sessionId,
                  role: 'assistant',
                  content: response,
                  audio_played: audioEnabled,
                }
              ]);
            }

            // Step 3: Convert to speech and play
            if (audioEnabled) {
              console.log('Generating speech...');
              const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                body: { text: response, voice: 'alloy' }
              });

              if (ttsError) throw ttsError;

              await playAudioResponse(ttsData.audioContent);
            }

            setIsProcessing(false);

            // Step 4: Automatically save tasks
            await autoSaveTasks(transcribed, response, user);

          } catch (error) {
            console.error('Voice loop error:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to process voice input",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const autoSaveTasks = async (transcription: string, response: string, user: any) => {
    try {
      // Split tasks using AI
      const { data: splitData, error: splitError } = await supabase.functions.invoke('split-tasks', {
        body: { text: transcription }
      });

      if (splitError) throw splitError;

      const tasks = splitData.tasks || [];

      if (tasks.length === 0) {
        console.log('No actionable tasks detected in transcription');
        return;
      }

      // Save tasks to database
      if (!user) return;

      const tasksToInsert = tasks.map((task: any) => ({
        title: task.title,
        context: response,
        has_reminder: task.has_reminder || false,
        has_person_name: task.has_person_name || false,
        is_time_based: task.is_time_based || false,
        keywords: task.keywords || [],
        input_method: 'voice' as const,
        user_id: user.id,
      }));

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (insertError) throw insertError;

      // Mark conversation as saved
      await supabase
        .from('conversation_history')
        .update({ was_saved: true })
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .eq('content', transcription);

      toast({
        title: "Tasks saved",
        description: `${tasks.length} task${tasks.length > 1 ? 's' : ''} created automatically.`,
      });
      
      // Call legacy onSaveNote for backwards compatibility
      if (onSaveNote) {
        onSaveNote(transcription, response);
      }
    } catch (error: any) {
      console.error('Error auto-saving tasks:', error);
      toast({
        title: "Note",
        description: "Couldn't detect actionable tasks, but your conversation was saved.",
      });
    }
  };

  const handleRetry = () => {
    setTranscribedText("");
    setGptResponse("");
    setShowMoodSelector(false);
    handleVoiceLoop();
  };

  const handleNewConversation = () => {
    setConversationHistory([]);
    setTranscribedText("");
    setGptResponse("");
    setCurrentMood(null);
    setShowMoodSelector(false);
    toast({
      title: "New conversation started",
      description: "Context has been cleared",
    });
  };

  const handleMoodSelect = async (mood: string) => {
    setCurrentMood(mood);
    setShowMoodSelector(false);
    
    // Update the assistant's conversation history entry with mood
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('conversation_history')
        .update({ mood })
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1);
    }

    toast({
      title: "Mood noted",
      description: `Malunita will adjust to your ${mood} state.`,
    });
  };

  const handleSkipMood = () => {
    setShowMoodSelector(false);
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        
        {/* Transcription and Response Display */}
        <div className="w-full min-h-[200px] flex flex-col gap-4">
          {transcribedText && (
            <div className="bg-card rounded-2xl p-6 border border-secondary shadow-sm animate-in fade-in duration-300">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">You said:</p>
              <p className="text-foreground leading-relaxed">{transcribedText}</p>
            </div>
          )}
          
          {gptResponse && (
            <div className="bg-accent/30 rounded-2xl p-6 border border-accent shadow-sm animate-in fade-in duration-300">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Malunita:</p>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">{gptResponse}</p>
            </div>
          )}

          {/* Mood Selector */}
          {showMoodSelector && !isProcessing && !isSpeaking && (
            <div className="animate-in fade-in duration-300">
              <MoodSelector 
                onMoodSelect={handleMoodSelect}
                onSkip={handleSkipMood}
              />
            </div>
          )}

          {isProcessing && !transcribedText && (
            <div className="bg-card rounded-2xl p-6 border border-secondary shadow-sm animate-in fade-in duration-300">
              <p className="text-muted-foreground text-center">Transcribing...</p>
            </div>
          )}

          {isProcessing && transcribedText && !gptResponse && (
            <div className="bg-card rounded-2xl p-6 border border-secondary shadow-sm animate-in fade-in duration-300">
              <p className="text-muted-foreground text-center">Thinking...</p>
            </div>
          )}
        </div>

        {/* Voice Control */}
        <div className="flex flex-col items-center gap-6">
          {/* Controls row */}
          <div className="flex items-center gap-6">
            {/* Conversation counter */}
            {conversationHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {conversationHistory.length / 2} exchanges
                </span>
                <button
                  onClick={handleNewConversation}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Main voice button */}
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-orb-listening animate-ping opacity-75" />
            )}
            
            <button
              onClick={handleVoiceLoop}
              disabled={isProcessing || isSpeaking}
              className={`relative w-24 h-24 rounded-full transition-all duration-500 ease-in-out shadow-2xl
                ${isListening 
                  ? 'bg-background border-4 border-orb-listening scale-110' 
                  : isProcessing || isSpeaking
                  ? 'bg-orb-responding border-4 border-orb-listening animate-breathing opacity-60'
                  : 'bg-card border-2 border-secondary hover:scale-105 hover:border-accent'
                }`}
            >
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {audioLevels.map((level, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-orb-waveform rounded-full transition-all duration-75"
                      style={{ height: `${level * 70}%` }}
                    />
                  ))}
                </div>
              )}

              {!isListening && !isProcessing && !isSpeaking && (
                <div className="flex items-center justify-center w-full h-full">
                  <Mic className="w-10 h-10 text-foreground" />
                </div>
              )}

              {(isProcessing || isSpeaking) && (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="w-10 h-10 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>

          <p className="text-sm text-muted-foreground font-light">
            {isListening 
              ? 'Listening...' 
              : isProcessing 
              ? 'Processing...' 
              : isSpeaking
              ? 'Speaking...'
              : 'Tap to speak'}
          </p>
        </div>

        {/* Action buttons */}
        {gptResponse && !isProcessing && !isSpeaking && !showMoodSelector && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full text-sm hover:scale-105 transition-transform"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

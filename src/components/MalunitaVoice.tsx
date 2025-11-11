import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { MoodSelector } from "@/components/MoodSelector";
import { TaskConfirmation } from "@/components/TaskConfirmation";
import { VoiceOrb } from "@/components/VoiceOrb";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedTask {
  title: string;
  suggested_category: string;
  suggested_timeframe: string;
  confidence: number;
  confirmation_prompt: string;
}

interface MalunitaVoiceProps {
  onSaveNote?: (text: string, response: string) => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
}

export interface MalunitaVoiceRef {
  startRecording: () => void;
}

export const MalunitaVoice = forwardRef<MalunitaVoiceRef, MalunitaVoiceProps>(({ onSaveNote, onPlanningModeActivated, onReflectionModeActivated, onOrbReflectionTrigger }, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [gptResponse, setGptResponse] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [sessionId] = useState(() => Date.now().toString());
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<SuggestedTask[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [originalVoiceText, setOriginalVoiceText] = useState('');
  
  const { profile } = useProfile();
  const { tasks, updateTask, createTasks } = useTasks();
  const audioEnabled = profile?.wants_voice_playback ?? true;
  
  const handleVoiceTaskCapture = async (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => {
    try {
      setIsSaving(true);
      await createTasks([{
        title: text,
        category: category || 'inbox',
        input_method: 'voice',
        completed: false,
      }]);
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating task from voice:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  
  const { toast } = useToast();

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bands = 7;
    const bandSize = Math.floor(dataArray.length / bands);
    const newLevels = [];

    // Calculate average volume to detect silence
    let totalVolume = 0;

    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      const bandData = dataArray.slice(start, end);
      const average = bandData.reduce((sum, val) => sum + val, 0) / bandData.length;
      totalVolume += average;
      newLevels.push(Math.max(0.2, Math.min(1, average / 128)));
    }

    const averageVolume = totalVolume / bands;
    
    // Detect silence (threshold: 5 out of 128)
    const SILENCE_THRESHOLD = 5;
    const SILENCE_DURATION = 5000; // 5 seconds
    
    if (averageVolume > SILENCE_THRESHOLD) {
      lastSoundTimeRef.current = Date.now();
    } else {
      const silenceDuration = Date.now() - lastSoundTimeRef.current;
      
      if (silenceDuration >= SILENCE_DURATION && isListening) {
        console.log('Silence detected for 5 seconds, stopping recording...');
        // Stop recording due to silence
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        return; // Exit early to prevent further analysis
      }
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
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
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
      
      // Reset silence tracking
      lastSoundTimeRef.current = Date.now();

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
            const lowerTranscribed = transcribed.toLowerCase().trim();
            
            // Check for AI focus suggestion commands
            const focusSuggestionPhrases = [
              'what should i focus on today',
              'help me prioritize',
              'suggest focus',
              'what should i do today',
              'pick my tasks',
              'what tasks should i focus on',
              'help me choose tasks'
            ];
            
            const isFocusSuggestion = focusSuggestionPhrases.some(phrase => 
              lowerTranscribed.includes(phrase)
            );
            
            if (isFocusSuggestion) {
              console.log('Focus suggestion command detected');
              setTranscribedText(transcribed);
              setIsProcessing(true);
              
              try {
                const pendingTasks = tasks?.filter(task => !task.completed && !task.is_focus) || [];
                
                if (pendingTasks.length === 0) {
                  setIsProcessing(false);
                  toast({
                    title: "No tasks to prioritize",
                    description: "Add some tasks first, then I can help you focus.",
                  });
                  return;
                }

                const { data, error } = await supabase.functions.invoke('suggest-focus', {
                  body: { 
                    tasks: pendingTasks.map(t => ({
                      id: t.id,
                      title: t.title,
                      context: t.context,
                      category: t.category,
                      has_reminder: t.has_reminder,
                      is_time_based: t.is_time_based
                    })),
                    userProfile: profile
                  }
                });

                if (error) throw error;

                const { suggestions, message } = data;
                
                // Apply suggestions to tasks
                const today = new Date().toISOString().split('T')[0];
                for (const suggestion of suggestions) {
                  const task = pendingTasks[suggestion.taskIndex];
                  if (task) {
                    await updateTask({
                      id: task.id,
                      updates: {
                        is_focus: true,
                        focus_date: today,
                        context: suggestion.reason
                      }
                    });
                  }
                }

                const responseMessage = message || `I've picked ${suggestions.length} tasks for you to focus on today.`;
                setGptResponse(responseMessage);
                
                // Play audio response if enabled
                if (audioEnabled) {
                  const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                    body: { text: responseMessage, voice: 'nova' }
                  });

                  if (ttsError) throw ttsError;
                  await playAudioResponse(ttsData.audioContent);
                }

                toast({
                  title: "Focus tasks selected",
                  description: `${suggestions.length} task${suggestions.length > 1 ? 's' : ''} added to Today's Focus`,
                });
              } catch (error: any) {
                console.error('Error suggesting focus:', error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to generate suggestions",
                  variant: "destructive",
                });
              } finally {
                setIsProcessing(false);
              }
              return;
            }
            
            // Check for stop commands
            const stopPhrases = ['stop recording', 'that\'s it', 'done', 'stop', 'finish'];
            const isStopCommand = stopPhrases.some(phrase => 
              lowerTranscribed.endsWith(phrase) || lowerTranscribed === phrase
            );
            
            if (isStopCommand) {
              // Remove stop phrase from transcription
              let cleanedText = transcribed;
              for (const phrase of stopPhrases) {
                const regex = new RegExp(`\\b${phrase}\\b\\.?$`, 'gi');
                cleanedText = cleanedText.replace(regex, '').trim();
              }
              
              // If there's still content after removing stop phrase, process it
              if (cleanedText.length > 0) {
                setTranscribedText(cleanedText);
                console.log('Transcribed (stop command detected):', cleanedText);
                
                try {
                  // Extract tasks using AI
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-tasks', {
                    body: { 
                      text: cleanedText,
                      userProfile: profile,
                      userId: user?.id
                    }
                  });

                  if (extractError) throw extractError;

                  if (extractData.tasks && extractData.tasks.length > 0) {
                    setPendingTasks(extractData.tasks);
                    setOriginalVoiceText(cleanedText);
                    setShowConfirmation(true);
                  } else if (extractData.conversation_reply) {
                    setGptResponse(extractData.conversation_reply);
                    
                    if (audioEnabled) {
                      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                        body: { text: extractData.conversation_reply, voice: 'nova' }
                      });

                      if (ttsError) throw ttsError;
                      await playAudioResponse(ttsData.audioContent);
                    }
                    
                    toast({
                      title: "Got it",
                      description: "No tasks to save from that input.",
                    });
                  }
                } catch (error: any) {
                  console.error('Error extracting tasks:', error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to process input",
                    variant: "destructive",
                  });
                } finally {
                  setIsProcessing(false);
                }
                
                return;
              } else {
                // Just stop command with no content
                setIsProcessing(false);
                toast({
                  title: "Recording stopped",
                  description: "Ready for next input",
                });
                return;
              }
            }
            
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
                body: { text: response, voice: 'nova' } // Warm, friendly voice
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

  const autoSaveTasks = async (transcription: string, response: string, user: any, addToFocus: boolean = false) => {
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

      // Categorize each task or default to inbox
      const tasksWithCategories = await Promise.all(
        tasks.map(async (task: any) => {
          try {
            const { data: categoryData } = await supabase.functions.invoke('categorize-task', {
              body: { 
                text: task.title,
                userId: user.id
              }
            });
            
            const category = categoryData?.category || 'inbox';
            
            return {
              title: task.title,
              context: response,
              category,
              has_reminder: task.has_reminder || false,
              has_person_name: task.has_person_name || false,
              is_time_based: task.is_time_based || false,
              keywords: task.keywords || [],
              input_method: 'voice' as const,
              is_focus: addToFocus,
              focus_date: addToFocus ? new Date().toISOString().split('T')[0] : null,
              user_id: user.id,
              goal_aligned: task.goal_aligned ?? null,
              alignment_reason: task.alignment_reason || null,
            };
          } catch (error) {
            // If categorization fails, default to inbox
            return {
              title: task.title,
              context: response,
              category: 'inbox',
              has_reminder: task.has_reminder || false,
              has_person_name: task.has_person_name || false,
              is_time_based: task.is_time_based || false,
              keywords: task.keywords || [],
              input_method: 'voice' as const,
              is_focus: addToFocus,
              focus_date: addToFocus ? new Date().toISOString().split('T')[0] : null,
              user_id: user.id,
            };
          }
        })
      );

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksWithCategories);

      if (insertError) throw insertError;

      // Mark conversation as saved
      await supabase
        .from('conversation_history')
        .update({ was_saved: true })
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .eq('content', transcription);

      const inboxCount = tasksWithCategories.filter(t => t.category === 'inbox').length;
      const categorizedCount = tasksWithCategories.length - inboxCount;
      
      toast({
        title: "Tasks saved",
        description: categorizedCount > 0 
          ? `${categorizedCount} categorized, ${inboxCount} in inbox`
          : `${tasks.length} task${tasks.length > 1 ? 's' : ''} saved to inbox`,
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

  const handleConfirmTasks = async (confirmedTasks: Array<{title: string; category: string; is_focus: boolean}>) => {
    setShowConfirmation(false);
    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const tasksToCreate = confirmedTasks.map(task => ({
        title: task.title,
        category: task.category,
        input_method: 'voice' as const,
        is_focus: task.is_focus,
        focus_date: task.is_focus ? today : null,
        completed: false,
      }));

      await createTasks(tasksToCreate);
      
      setPendingTasks([]);
      toast({
        title: "Tasks saved",
        description: `${confirmedTasks.length} task${confirmedTasks.length > 1 ? 's' : ''} saved successfully`,
      });
    } catch (error: any) {
      console.error('Error saving tasks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tasks",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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

  // Expose startRecording method via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      if (!isListening && !isProcessing && !isSpeaking) {
        handleVoiceLoop();
      }
    }
  }));

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

        {/* Voice Control - Replaced with VoiceOrb */}
        <VoiceOrb 
          onVoiceInput={handleVoiceTaskCapture} 
          onPlanningModeActivated={onPlanningModeActivated}
          onReflectionModeActivated={onReflectionModeActivated}
          onOrbReflectionTrigger={onOrbReflectionTrigger}
          isSaving={isSaving}
          showSuccess={showSuccess}
        />

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

      {/* Task Confirmation Dialog */}
      {showConfirmation && pendingTasks.length > 0 && (
        <TaskConfirmation
          tasks={pendingTasks}
          originalText={originalVoiceText}
          onConfirm={handleConfirmTasks}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingTasks([]);
            setOriginalVoiceText('');
            setIsProcessing(false);
          }}
        />
      )}
    </div>
  );
});

MalunitaVoice.displayName = "MalunitaVoice";

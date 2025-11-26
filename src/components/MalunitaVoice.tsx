import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useCompanionIdentity } from "@/hooks/useCompanionIdentity";
import { useCompanionEmotion } from "@/hooks/useCompanionEmotion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAssistantMemory } from "@/hooks/useAssistantMemory";
import { MoodSelector } from "@/components/MoodSelector";
import { TaskConfirmation } from "@/components/TaskConfirmation";
import { ConversationalTaskFlow } from "@/components/ConversationalTaskFlow";
import { TaskFeedbackDialog } from "@/components/TaskFeedbackDialog";
import { TaskCorrectionPanel } from "@/components/tasks/TaskCorrectionPanel";
import { VoiceOrb } from "@/components/VoiceOrb";
import { CompanionAvatar, CompanionMode } from "@/components/companion/CompanionAvatar";
import { ClarificationBanner } from "@/components/ClarificationBanner";
import { processRawInput } from "@/lib/taskProcessing";
import { contextMapper } from "@/lib/contextMapper";
import { priorityScorer } from "@/lib/priorityScorer";
import { agendaRouter } from "@/lib/agendaRouter";
import { clarificationPrompter } from "@/lib/clarificationPrompter";
import { summaryComposer } from "@/lib/summaryComposer";
import { useMoodStore, detectMoodFromMessage } from "@/state/moodMachine";
import { useCognitiveLoad } from "@/state/cognitiveLoad";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { useAutoSplitTask } from "@/hooks/useAutoSplitTask";
import { useRelatedTaskSuggestions } from "@/hooks/useRelatedTaskSuggestions";
import { useMemoryEngine } from "@/state/memoryEngine";
import { routeReasoning } from "@/ai/reasoningRouter";
import { runLongReasoning } from "@/ai/longReasoningEngine";
import { useCaptureSessions } from "@/hooks/useCaptureSessions";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedTask {
  title: string;
  summary?: string;
  suggested_category: string;
  custom_category_id?: string;
  suggested_timeframe: string;
  confidence: number;
  confirmation_prompt: string;
  reminder_time?: string | null;
  goal_aligned?: boolean;
  alignment_reason?: string;
  hidden_intent?: string | null;
  ai_metadata?: any;
  // Virtual enrichment fields
  task_type?: 'admin' | 'communication' | 'errand' | 'focus' | 'physical' | 'creative' | 'delivery' | 'follow_up';
  tiny_task?: boolean;
  heavy_task?: boolean;
  emotional_weight?: number;
  priority_score?: number;
  ideal_time?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  ideal_day?: 'today' | 'tomorrow' | 'this_week' | 'later';
  is_one_thing?: boolean;
}

interface MalunitaVoiceProps {
  onSaveNote?: (text: string, response: string) => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
  onTasksCreated?: () => void;
  taskStreak?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onStatusChange?: (status: { isListening: boolean; isProcessing: boolean; isSpeaking: boolean; recordingDuration: number }) => void;
}

export interface MalunitaVoiceRef {
  startRecording: () => void;
  triggerMisunderstanding: () => void;
}

export const MalunitaVoice = forwardRef<MalunitaVoiceRef, MalunitaVoiceProps>(({ 
  onSaveNote, 
  onPlanningModeActivated, 
  onReflectionModeActivated, 
  onOrbReflectionTrigger, 
  onTasksCreated,
  taskStreak = 0,
  onRecordingStateChange,
  onStatusChange,
}, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stopWordDetected, setStopWordDetected] = useState(false);
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
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackTaskData, setFeedbackTaskData] = useState<{
    taskId: string;
    taskTitle: string;
    originalText: string;
    suggestedCategory?: string;
    actualCategory?: string;
  } | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false);
  const [correctionContext, setCorrectionContext] = useState<{
    transcript: string;
    aiOutput: any;
  } | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<{
    task_id: string;
    question: string;
    type: 'deadline' | 'category' | 'project' | 'priority' | 'agenda';
  } | null>(null);
  
  const { profile } = useProfile();
  const { tasks, updateTask, createTasks } = useTasks();
  const { companion } = useCompanionIdentity();
  const { taskPreference } = useCompanionEmotion(
    (profile?.companion_personality_type as any) || 'zen'
  );
  const { recordStressedLanguage, recordTaskAdded } = useCognitiveLoad();
  const { generateAndCreateSubtasks } = useAutoSplitTask();
  const { checkForRelatedTasks } = useRelatedTaskSuggestions();
  const audioEnabled = profile?.wants_voice_playback ?? true;
  const isMobile = useIsMobile();
  const { createSession } = useCaptureSessions();
  const { addMessage, getRecentContext } = useAssistantMemory();
  
  // Store extract-tasks metadata for capture session
  const [extractMetadata, setExtractMetadata] = useState<{
    raw_summary: string | null;
    intent_tags: string[];
  }>({ raw_summary: null, intent_tags: [] });

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingStateChange?.(isListening || isProcessing);
    onStatusChange?.({ isListening, isProcessing, isSpeaking, recordingDuration });
  }, [isListening, isProcessing, isSpeaking, recordingDuration, onRecordingStateChange, onStatusChange]);

  // Track recording duration
  useEffect(() => {
    if (isListening) {
      recordingStartTimeRef.current = Date.now();
      const interval = setInterval(() => {
        if (recordingStartTimeRef.current) {
          setRecordingDuration(Date.now() - recordingStartTimeRef.current);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        setRecordingDuration(0);
        recordingStartTimeRef.current = null;
      };
    } else {
      setRecordingDuration(0);
      recordingStartTimeRef.current = null;
    }
  }, [isListening]);

  // ============================================================
  // THOUGHT ENGINE 2.0: All helper functions imported from src/lib/
  // ============================================================
  
  const handleVoiceTaskCapture = async (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => {
    try {
      setIsSaving(true);
      const createdTasks = await createTasks([{
        title: text,
        category: category || 'inbox',
        input_method: 'voice',
        completed: false,
      }]);
      
      // Trigger haptic feedback on mobile devices
      if ('vibrate' in navigator) {
        // Short double pulse: vibrate-pause-vibrate
        navigator.vibrate([50, 50, 50]);
      }
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      // Notify parent that tasks were created
      if (onTasksCreated) {
        onTasksCreated();
      }
      
      // Generate and play TTS confirmation
      if (createdTasks && createdTasks.length > 0 && audioEnabled) {
        const task = createdTasks[0];
        const categoryName = (category || 'inbox').charAt(0).toUpperCase() + (category || 'inbox').slice(1);
        const confirmationMessage = `You said: "${text}" I've added it to your tasks under ${categoryName}. Want to set a reminder?`;
        
        setGptResponse(confirmationMessage);
        
        try {
          const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
            body: { text: confirmationMessage, voice: 'nova' }
          });

          if (!ttsError && ttsData?.audioContent) {
            await playAudioResponse(ttsData.audioContent);
          }
        } catch (ttsError) {
          console.error('TTS error:', ttsError);
        }
      }
      
      // Show feedback dialog for the created task
      if (createdTasks && createdTasks.length > 0) {
        const task = createdTasks[0];
        setFeedbackTaskData({
          taskId: task.id,
          taskTitle: task.title,
          originalText: text,
          suggestedCategory: category,
          actualCategory: category || 'inbox',
        });
        setShowFeedbackDialog(true);
      }
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
    const SILENCE_DURATION = 2000; // 2 seconds
    
    if (averageVolume > SILENCE_THRESHOLD) {
      lastSoundTimeRef.current = Date.now();
    } else {
      const silenceDuration = Date.now() - lastSoundTimeRef.current;
      console.log('Silence check — avgVolume:', averageVolume.toFixed(2), 'duration(ms):', silenceDuration);
      
      if (silenceDuration >= SILENCE_DURATION && isListening) {
        console.log('Silence detected for 2 seconds, stopping recording...');
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
    console.log('🎤 handleVoiceLoop called! isListening:', isListening);
    if (isListening) {
      console.log('🛑 Stopping recording...');
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
    console.log('🚀 Starting new recording...');
    try {
      console.log('📱 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      // Use a compatible audio format for transcription
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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

      let isStopCommandDetected = false;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          console.log('Audio chunk received, total chunks:', audioChunksRef.current.length);
          
          // Check for stop commands starting from the first chunk
          if (!isStopCommandDetected && audioChunksRef.current.length >= 1) {
            const recentChunks = audioChunksRef.current.slice(-3); // Check last 3 seconds
            const recentBlob = new Blob(recentChunks, { type: mediaRecorder.mimeType });
            
            console.log('Checking for stop command, blob size:', recentBlob.size);
            
            // Only check if blob is large enough (has actual audio)
            if (recentBlob.size > 3000) {
              const reader = new FileReader();
              reader.readAsDataURL(recentBlob);
              reader.onloadend = async () => {
                const base64Audio = reader.result?.toString().split(',')[1];
                if (!base64Audio) return;
                
                try {
                  console.log('Transcribing audio chunk for stop detection...');
                  const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
                    body: { audio: base64Audio }
                  });
                  
                  if (transcribeError) {
                    console.error('Transcription error during stop detection:', transcribeError);
                  }
                  
                  if (transcribeData?.text) {
                    console.log('Transcribed chunk:', transcribeData.text);
                    const lowerTranscribed = transcribeData.text.toLowerCase().trim();
                    const stopPhrases = [
                      'stop recording', 
                      'that\'s it', 
                      'done', 
                      'stop', 
                      'finish',
                      'i\'m done',
                      'im done',
                      'i am done',
                      'stop done',
                      'done stop'
                    ];
                    
                    const cleanTranscribed = lowerTranscribed.replace(/[.,!?;]+/g, '').replace(/'/g, '').trim();
                    const words = cleanTranscribed.split(/\s+/);
                    
                    console.log('Cleaned transcription:', cleanTranscribed, 'Words:', words);
                    
                    const hasStopCommand = stopPhrases.some(phrase => {
                      const cleanPhrase = phrase.replace(/'/g, '');
                      
                      if (phrase.includes(' ')) {
                        return cleanTranscribed.endsWith(cleanPhrase) || 
                               cleanTranscribed === cleanPhrase ||
                               words.slice(-5).join(' ').includes(cleanPhrase);
                      } else {
                        const lastWord = words[words.length - 1];
                        const secondLastWord = words.length >= 2 ? words[words.length - 2] : '';
                        
                        return lastWord === cleanPhrase || 
                               cleanTranscribed === cleanPhrase || 
                               (secondLastWord === cleanPhrase && lastWord.length <= 4) ||
                               (words.length === 2 && secondLastWord.match(/^i'?m?$/) && lastWord === 'done');
                      }
                    });
                    
                    if (hasStopCommand) {
                      console.log('🛑 STOP COMMAND DETECTED during recording:', transcribeData.text);
                      isStopCommandDetected = true;
                      setStopWordDetected(true);
                      
                      // Haptic feedback
                      if ('vibrate' in navigator) {
                        navigator.vibrate([50, 100, 50]);
                      }
                      
                      // Stop recording immediately
                      console.log('Stopping recording, current state:', mediaRecorder.state);
                      if (mediaRecorder.state === 'recording') {
                        console.log('Calling mediaRecorder.stop()');
                        mediaRecorder.stop();
                        stream.getTracks().forEach(track => track.stop());
                      }
                    } else {
                      console.log('No stop command found in transcription');
                    }
                  }
                } catch (error) {
                  console.error('Error checking for stop commands:', error);
                }
              };
            }
          }
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 RECORDING STOPPED');
        setIsListening(false);
        setIsProcessing(true);
        setTranscribedText("");
        setGptResponse("");
        console.log('Processing audio...');
        
        // Haptic feedback when recording stops
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]); // Double pulse
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        
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
            console.log('🎯 STEP 1: Transcribing audio...');
            const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (transcribeError) {
              console.error('❌ Transcription error:', transcribeError);
              throw transcribeError;
            }
            console.log('✅ Transcription successful');

            const transcribed = transcribeData.text;
            const lowerTranscribed = transcribed.toLowerCase().trim();
            console.log('📝 Transcribed text:', transcribed);
            
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
                    userProfile: profile,
                    companionMood: taskPreference
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
                    
                    // Check prediction for each suggested focus task
                    checkAndHandlePrediction(task.id, task.title);
                    
                    // Auto-split if complex
                    generateAndCreateSubtasks(task);
                    
                    // Check for related tasks (only for first focus task)
                    if (suggestion.taskIndex === 0) {
                      checkForRelatedTasks(task);
                    }
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
            
            // Check for stop commands - more flexible matching for mobile
            const defaultStopPhrases = [
              'stop recording', 
              'that\'s it', 
              'done', 
              'stop', 
              'finish',
              'i\'m done',
              'im done',
              'i am done'
            ];
            // @ts-ignore - custom_stop_commands field exists after migration
            const customStopPhrases = profile?.custom_stop_commands || [];
            const stopPhrases = [...defaultStopPhrases, ...customStopPhrases];
            
            const isStopCommand = stopPhrases.some(phrase => {
              // Remove punctuation and extra spaces for better matching
              const cleanTranscribed = lowerTranscribed.replace(/[.,!?;]+/g, '').replace(/'/g, '').trim();
              const words = cleanTranscribed.split(/\s+/);
              const cleanPhrase = phrase.replace(/'/g, '');
              
              // Check if the phrase appears anywhere in the last part of the sentence
              if (phrase.includes(' ') || cleanPhrase.includes(' ')) {
                // Multi-word phrase - check if it appears at the end
                return cleanTranscribed.endsWith(cleanPhrase) || 
                       cleanTranscribed === cleanPhrase ||
                       // Also check within the last 5 words
                       words.slice(-5).join(' ').includes(cleanPhrase);
              } else {
                // Single word - be very flexible on mobile
                const lastWord = words[words.length - 1];
                const secondLastWord = words.length >= 2 ? words[words.length - 2] : '';
                
                return lastWord === cleanPhrase || 
                       cleanTranscribed === cleanPhrase || 
                       // Match if preceded by short connector words
                       (secondLastWord === cleanPhrase && lastWord.length <= 4) ||
                       // Match "i done", "im done" patterns
                       (words.length === 2 && secondLastWord.match(/^i'?m?$/) && lastWord === 'done');
              }
            });
            
            if (isStopCommand) {
              // Show visual feedback that stop word was detected
              setStopWordDetected(true);
              setTimeout(() => setStopWordDetected(false), 1500);
              
              // Haptic feedback on mobile devices
              if ('vibrate' in navigator) {
                navigator.vibrate([50, 100, 50]); // Double pulse pattern
              }
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
                
                // Learn from writing style (async, non-blocking)
                supabase.functions.invoke('learn-writing-style', {
                  body: { 
                    text: cleanedText,
                    inputMethod: 'voice'
                  }
                }).then(({ data: learningData }) => {
                  if (learningData) {
                    const memoryEngine = useMemoryEngine.getState();
                    if (learningData.writingStyle) {
                      memoryEngine.setWritingStyle(learningData.writingStyle);
                    }
                    if (learningData.phrasings) {
                      learningData.phrasings.forEach((phrase: string) => {
                        memoryEngine.addPositiveReinforcer(phrase);
                      });
                    }
                  }
                });
                
                try {
                  // Extract tasks using AI
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-tasks', {
                    body: { 
                      text: cleanedText,
                      userProfile: profile,
                      userId: user?.id,
                      currentDate: new Date().toISOString()
                    }
                  });

                  if (extractError) throw extractError;

                  // Store metadata for later capture session creation
                  if (extractData.raw_summary || extractData.intent_tags) {
                    setExtractMetadata({
                      raw_summary: extractData.raw_summary || null,
                      intent_tags: extractData.intent_tags || [],
                    });
                  }

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
            console.log('📝 Transcribed text:', transcribed);

            // Learn from writing style (async, non-blocking)
            supabase.functions.invoke('learn-writing-style', {
              body: { 
                text: transcribed,
                inputMethod: 'voice'
              }
            }).then(({ data: learningData, error: learningError }) => {
              if (learningError) {
                console.error('Learning error:', learningError);
                return;
              }
              
              if (learningData) {
                console.log('✅ Learned writing style:', learningData.writingStyle);
                
                // Update memory engine locally
                const memoryEngine = useMemoryEngine.getState();
                if (learningData.writingStyle) {
                  memoryEngine.setWritingStyle(learningData.writingStyle);
                }
                
                // Store unique phrasings
                if (learningData.phrasings && learningData.phrasings.length > 0) {
                  learningData.phrasings.forEach((phrase: string) => {
                    memoryEngine.addPositiveReinforcer(phrase);
                  });
                }
              }
            });

            // Detect stressed language for cognitive load tracking
            recordStressedLanguage(transcribed);

            // ===========================================================
            // NEW UNIFIED VOICE PIPELINE
            // ===========================================================
            console.log('🚀 Running unified voice pipeline...');
            const { data: { user } } = await supabase.auth.getUser();
            
            // Get conversation context for memory
            const conversationHistory = getRecentContext(10);
            
            // Add user message to memory
            addMessage('user', transcribed);
            
            const { data: pipelineData, error: pipelineError } = await supabase.functions.invoke('process-voice-input', {
              body: { 
                text: transcribed,
                userProfile: profile,
                conversationHistory: conversationHistory.map(m => ({
                  role: m.role,
                  content: m.content
                }))
              }
            });

            if (pipelineError) {
              console.error('❌ Pipeline error:', pipelineError);
              throw pipelineError;
            }

            const { mode, tasks: extractedTasks, insights, reply_text } = pipelineData;
            
            console.log('✅ Pipeline complete:', {
              mode,
              taskCount: extractedTasks?.length || 0,
              hasReply: !!reply_text
            });

            // Store metadata for capture session
            if (insights?.raw_summary || insights?.intent_tags) {
              setExtractMetadata({
                raw_summary: insights.raw_summary || null,
                intent_tags: insights.intent_tags || [],
              });
            }

            // ===========================================================
            // HANDLE RESPONSE BASED ON MODE
            // ===========================================================
            
            if (mode === 'add_tasks' && extractedTasks && extractedTasks.length > 0) {
              // Store tasks first
              setPendingTasks(extractedTasks);
              setOriginalVoiceText(transcribed);
              setGptResponse(reply_text || `Found ${extractedTasks.length} task${extractedTasks.length > 1 ? 's' : ''}`);
              
              // Check if any task needs clarification
              const tasksWithIds = extractedTasks.map((t, i) => ({
                ...t,
                id: `temp_${i}`,
              }));
              
              const clarificationResult = clarificationPrompter(
                tasksWithIds,
                { projects: [], categories: [], people_mentions: [], implied_deadlines: [], time_sensitivity: [] },
                tasksWithIds.map(t => ({
                  task_id: t.id!,
                  priority: t.priority_score && t.priority_score > 70 ? 'MUST' : t.priority_score && t.priority_score > 40 ? 'SHOULD' : 'COULD',
                  effort: t.tiny_task ? 'tiny' : t.heavy_task ? 'large' : 'medium',
                  fiesta_ready: !!t.tiny_task,
                  big_task: !!t.heavy_task,
                })),
                { summary: '', topics: [], insights: [], decisions: [], ideas: [], followups: [], questions: [], emotional_tone: 'neutral' }
              );
              
              if (clarificationResult.needs_clarification && clarificationResult.questions.length > 0) {
                // Show first clarification question
                setClarificationQuestion(clarificationResult.questions[0]);
              } else {
                // No clarification needed, show confirmation directly
                setShowConfirmation(true);
              }
              
              // Add reply to memory
              if (reply_text) {
                addMessage('assistant', reply_text);
              }
            } else {
              // For all other modes, show the AI's reply
              setGptResponse(reply_text);
              
              // Add reply to memory
              if (reply_text) {
                addMessage('assistant', reply_text);
              }
              
              // Play audio response if enabled
              if (audioEnabled && reply_text) {
                try {
                  const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                    body: { text: reply_text, voice: 'nova' }
                  });

                  if (!ttsError && ttsData?.audioContent) {
                    await playAudioResponse(ttsData.audioContent);
                  }
                } catch (ttsError) {
                  console.error('TTS error:', ttsError);
                }
              }
              
              // Update conversation history
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: transcribed },
                { role: 'assistant', content: reply_text }
              ]);
              
              // Save to database
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
                    content: reply_text,
                    audio_played: audioEnabled,
                  }
                ]);
              }
              
              // Show mood selector for feedback
              setShowMoodSelector(true);
            }
            
            setIsProcessing(false);
          } catch (error: any) {
            console.error('Error processing voice input:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to process input",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        };

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with timeslice to get data chunks every 1 second
      mediaRecorder.start(1000);
      setIsListening(true);
      console.log('🎤 RECORDING STARTED');
      console.log('Audio enabled:', audioEnabled);
      console.log('Profile wants_voice_playback:', profile?.wants_voice_playback);
      
      // Haptic feedback when recording starts
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Short single pulse
      }
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
      console.log('🚀 Starting Task Intelligence Pipeline...');
      
      // Process raw input through intelligence pipeline
      const result = await processRawInput(transcription);
      
      if (result.tasks.length === 0) {
        console.log('No actionable tasks detected in transcription');
        return;
      }

      console.log(`✅ Processed ${result.tasks.length} enriched tasks`);

      // Save tasks to database
      if (!user) return;

      const tasksToCreate = result.tasks.map(task => ({
        title: task.title,
        category: task.category,
        custom_category_id: task.custom_category_id,
        context: task.context,
        input_method: 'voice' as const,
        has_reminder: !!task.reminder_time,
        reminder_time: task.reminder_time,
        goal_aligned: task.goal_aligned,
        alignment_reason: task.alignment_reason,
        // Intelligence fields
        priority: task.priority,
        effort: task.effort,
        scheduled_bucket: task.scheduled_bucket,
        is_tiny: task.is_tiny,
        // Store metadata as JSON
        keywords: task.idea_metadata?.topics || [],
      }));

      await createTasks(tasksToCreate);

      setIsSaving(false);
      setShowSuccess(true);
      recordTaskAdded();

      if (onTasksCreated) {
        onTasksCreated();
      }

      toast({
        title: "Tasks saved",
        description: `${result.tasks.length} enriched task${result.tasks.length > 1 ? 's' : ''} created with full intelligence`,
      });

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Failed to save tasks:', error);
      toast({
        title: "Error",
        description: "Failed to save tasks",
        variant: "destructive",
      });
      setIsSaving(false);
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

  const handleConfirmTasks = async (confirmedTasks: Array<{
    title: string; 
    category: string; 
    is_focus: boolean; 
    custom_category_id?: string; 
    reminder_time?: string | null;
    recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrence_day?: number;
  }>) => {
    setShowConfirmation(false);
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];
      const tasksToCreate = confirmedTasks.map((task, index) => {
        // Get original enriched metadata from pendingTasks
        const originalTask = pendingTasks[index];
        
        return {
          title: task.title,
          category: task.category,
          custom_category_id: task.custom_category_id,
          input_method: 'voice' as const,
          is_focus: task.is_focus || originalTask?.is_one_thing,
          focus_date: (task.is_focus || originalTask?.is_one_thing) ? today : null,
          reminder_time: task.reminder_time || null,
          has_reminder: !!task.reminder_time,
          recurrence_pattern: task.recurrence_pattern || 'none',
          recurrence_day: task.recurrence_day,
          completed: false,
          // Store enriched metadata as Json
          ai_metadata: {
            summary: originalTask?.summary,
            task_type: originalTask?.task_type,
            tiny_task: originalTask?.tiny_task,
            heavy_task: originalTask?.heavy_task,
            emotional_weight: originalTask?.emotional_weight,
            priority_score: originalTask?.priority_score,
            ideal_time: originalTask?.ideal_time,
            ideal_day: originalTask?.ideal_day,
            is_one_thing: originalTask?.is_one_thing,
            confidence: originalTask?.confidence,
            goal_aligned: originalTask?.goal_aligned,
            alignment_reason: originalTask?.alignment_reason,
            hidden_intent: originalTask?.hidden_intent,
          } as any,
        };
      });

      const createdTasks = await createTasks(tasksToCreate);
      
      // Save capture session with task metadata
      if (user && createdTasks && createdTasks.length > 0) {
        const taskIds = createdTasks.map(t => t.id);
        createSession({
          raw_text: originalVoiceText,
          summary: extractMetadata.raw_summary,
          task_ids: taskIds,
          intent_tags: extractMetadata.intent_tags,
        });
        
        // Reset metadata
        setExtractMetadata({ raw_summary: null, intent_tags: [] });
      }
      
      // Store feedback for each task comparing AI suggestions vs user choices
      if (user && createdTasks) {
        const feedbackPromises = confirmedTasks.map(async (confirmedTask, index) => {
          const originalSuggestion = pendingTasks[index];
          if (originalSuggestion) {
            const wasCorrected = 
              confirmedTask.category !== originalSuggestion.suggested_category ||
              confirmedTask.title !== originalSuggestion.title;

            await supabase.from("task_learning_feedback").insert({
              user_id: user.id,
              original_text: originalVoiceText,
              task_title: confirmedTask.title,
              suggested_category: originalSuggestion.suggested_category,
              actual_category: confirmedTask.category,
              suggested_timeframe: originalSuggestion.suggested_timeframe || "",
              actual_timeframe: originalSuggestion.suggested_timeframe || "",
              was_corrected: wasCorrected,
            });
          }
        });
        
        await Promise.all(feedbackPromises);
      }
      
      setPendingTasks([]);
      toast({
        title: "Tasks saved",
        description: `${confirmedTasks.length} task${confirmedTasks.length > 1 ? 's' : ''} saved successfully`,
      });
      
      // Notify parent that tasks were created
      if (onTasksCreated) {
        onTasksCreated();
      }
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

  // Reset activity timer whenever there's user interaction
  const resetActivityTimer = () => {
    lastActivityRef.current = Date.now();
    setIsSleeping(false);
    
    // Clear existing timer
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    
    // Set new timer for 2 minutes (120000ms)
    sleepTimerRef.current = setTimeout(() => {
      setIsSleeping(true);
    }, 120000);
  };

  // Track activity when states change
  useEffect(() => {
    if (isListening || isProcessing || isSpeaking || isSaving || showSuccess) {
      resetActivityTimer();
    }
  }, [isListening, isProcessing, isSpeaking, isSaving, showSuccess]);

  // Initialize activity timer
  useEffect(() => {
    resetActivityTimer();
    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, []);

  // Expose startRecording method via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      console.log('🎯 startRecording called! State:', { isListening, isProcessing, isSpeaking });
      resetActivityTimer(); // Reset sleep timer on interaction
      // Always delegate to handleVoiceLoop; it decides whether to start or stop
      console.log('✅ Delegating to handleVoiceLoop');
      handleVoiceLoop();
    },
    triggerMisunderstanding: () => {
      handleMisunderstood();
    }
  }));

  const handleMisunderstood = () => {
    if (!transcribedText) return;
    
    // Emit ai:misunderstood event
    window.dispatchEvent(new CustomEvent('ai:misunderstood', {
      detail: {
        transcript: transcribedText,
        response: gptResponse,
      }
    }));
    
    // Prepare correction context
    setCorrectionContext({
      transcript: transcribedText,
      aiOutput: {
        category: 'inbox',
        priority: 'SHOULD',
      }
    });
    
    setShowCorrectionPanel(true);
  };

  const handleCorrectionSubmit = async (correctedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Invoke thought-engine-trainer with correction
      await supabase.functions.invoke('thought-engine-trainer', {
        body: {
          userId: user.id,
          taskId: null, // No task ID for voice misunderstandings
          correction: {
            aiOutput: correctionContext?.aiOutput || {},
            userCorrection: correctedData,
            taskTitle: transcribedText,
            originalText: transcribedText,
          }
        }
      });

      toast({
        title: "Thanks for teaching me!",
        description: "I'll learn from this correction.",
      });
    } catch (error) {
      console.error('Error submitting voice correction:', error);
    } finally {
      setShowCorrectionPanel(false);
      setCorrectionContext(null);
    }
  };

  const handleClarificationAnswer = (answer: string) => {
    if (!clarificationQuestion) return;
    
    // Find the task that needs clarification
    const taskIdNum = parseInt(clarificationQuestion.task_id.replace('temp_', ''));
    const updatedTasks = [...pendingTasks];
    
    if (taskIdNum >= 0 && taskIdNum < updatedTasks.length) {
      const task = updatedTasks[taskIdNum];
      
      // Update task based on clarification type
      switch (clarificationQuestion.type) {
        case 'deadline':
          if (answer === 'Today') {
            task.ideal_day = 'today';
            task.reminder_time = new Date().toISOString();
          } else if (answer === 'Tomorrow') {
            task.ideal_day = 'tomorrow';
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.reminder_time = tomorrow.toISOString();
          } else if (answer === 'This week') {
            task.ideal_day = 'this_week';
          }
          break;
        case 'category':
          task.suggested_category = answer.toLowerCase();
          break;
        case 'priority':
          if (answer === 'Must do') {
            task.priority_score = 90;
          } else if (answer === 'Should do') {
            task.priority_score = 60;
          } else {
            task.priority_score = 30;
          }
          break;
        case 'agenda':
          if (answer === 'Yes') {
            task.is_one_thing = true;
          }
          break;
      }
      
      setPendingTasks(updatedTasks);
    }
    
    // Clear clarification and show confirmation
    setClarificationQuestion(null);
    setShowConfirmation(true);
  };

  const handleDismissClarification = () => {
    setClarificationQuestion(null);
    setShowConfirmation(true);
  };

  return (
    <>
      {/* Clarification Banner - Rendered above orb */}
      {clarificationQuestion && (
        <div className="fixed bottom-32 left-0 right-0 z-50 flex items-center justify-center px-4">
          <ClarificationBanner
            question={clarificationQuestion.question}
            type={clarificationQuestion.type}
            onAnswer={handleClarificationAnswer}
            onDismiss={handleDismissClarification}
          />
        </div>
      )}
      
      <div className="hidden">
        {/* Hidden voice recorder - only for functionality, visuals disabled on home page */}
        
        {/* Conversational Task Flow */}
        {showConfirmation && pendingTasks.length > 0 && !clarificationQuestion && (
          <ConversationalTaskFlow
            tasks={pendingTasks}
            originalText={originalVoiceText}
            onComplete={handleConfirmTasks}
            onCancel={() => {
              setShowConfirmation(false);
              setPendingTasks([]);
              setOriginalVoiceText('');
              setIsProcessing(false);
            }}
            audioEnabled={audioEnabled}
          />
        )}

        {/* Task Feedback Dialog */}
        {showFeedbackDialog && feedbackTaskData && (
          <TaskFeedbackDialog
            open={showFeedbackDialog}
            onOpenChange={setShowFeedbackDialog}
            taskId={feedbackTaskData.taskId}
            taskTitle={feedbackTaskData.taskTitle}
            originalText={feedbackTaskData.originalText}
            suggestedCategory={feedbackTaskData.suggestedCategory}
            actualCategory={feedbackTaskData.actualCategory}
          />
        )}

        {/* Task Correction Panel for Voice Misunderstandings */}
        {showCorrectionPanel && correctionContext && (
          <TaskCorrectionPanel
            task={{
              id: 'voice-transcript',
              title: correctionContext.transcript,
              context: correctionContext.transcript,
              category: 'inbox',
              completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: '',
            } as any}
            initialAIOutput={correctionContext.aiOutput}
            onSubmitCorrection={handleCorrectionSubmit}
            open={showCorrectionPanel}
            onClose={() => {
              setShowCorrectionPanel(false);
              setCorrectionContext(null);
            }}
          />
        )}
      </div>
    </>
  );
});

MalunitaVoice.displayName = "MalunitaVoice";

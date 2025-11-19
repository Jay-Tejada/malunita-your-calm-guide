import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Mic, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MoodSelector } from "@/components/MoodSelector";
import { TaskConfirmation } from "@/components/TaskConfirmation";
import { ConversationalTaskFlow } from "@/components/ConversationalTaskFlow";
import { TaskFeedbackDialog } from "@/components/TaskFeedbackDialog";
import { VoiceOrb } from "@/components/VoiceOrb";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedTask {
  title: string;
  suggested_category: string;
  custom_category_id?: string;
  suggested_timeframe: string;
  confidence: number;
  confirmation_prompt: string;
  reminder_time?: string | null;
  goal_aligned?: boolean;
  alignment_reason?: string;
}

interface MalunitaVoiceProps {
  onSaveNote?: (text: string, response: string) => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
  onTasksCreated?: () => void;
}

export interface MalunitaVoiceRef {
  startRecording: () => void;
}

export const MalunitaVoice = forwardRef<MalunitaVoiceRef, MalunitaVoiceProps>(({ onSaveNote, onPlanningModeActivated, onReflectionModeActivated, onOrbReflectionTrigger, onTasksCreated }, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
  
  const { profile } = useProfile();
  const { tasks, updateTask, createTasks } = useTasks();
  const audioEnabled = profile?.wants_voice_playback ?? true;
  const isMobile = useIsMobile();

  // ============================================================
  // THOUGHT ENGINE 2.0: Helper Functions
  // ============================================================

  // Context Mapper: Infer projects, categories, people, deadlines
  const contextMapper = (extractedTasks: any[], ideaAnalysis: any) => {
    const context: any = {
      inferredProjects: [],
      categories: new Set(),
      relatedPeople: [],
      deadlines: [],
      impliedContext: [],
      timeSensitivity: 'normal'
    };

    // Extract projects from topics
    if (ideaAnalysis?.topics) {
      context.inferredProjects = ideaAnalysis.topics.filter((t: string) => 
        !['Work', 'Personal', 'Health'].includes(t)
      );
    }

    // Map tasks to categories
    extractedTasks.forEach((task: any) => {
      if (task.category) context.categories.add(task.category);
      if (task.custom_category_id) context.categories.add('custom');
      
      // Extract deadlines
      if (task.reminder_time) {
        context.deadlines.push({
          task: task.title,
          when: new Date(task.reminder_time).toLocaleString()
        });
      }
      
      // Check if has person name
      if (task.has_person_name) {
        const words = task.title.split(' ');
        const capitalizedWords = words.filter((w: string) => /^[A-Z]/.test(w));
        context.relatedPeople.push(...capitalizedWords);
      }
    });

    // Detect time sensitivity from emotional tone
    if (ideaAnalysis?.emotional_tone) {
      if (['stressed', 'overwhelmed', 'urgent'].includes(ideaAnalysis.emotional_tone.toLowerCase())) {
        context.timeSensitivity = 'high';
      } else if (['calm', 'thoughtful'].includes(ideaAnalysis.emotional_tone.toLowerCase())) {
        context.timeSensitivity = 'low';
      }
    }

    return {
      ...context,
      categories: Array.from(context.categories)
    };
  };

  // Priority Scorer: Mark tasks as MUST/SHOULD/COULD/BIG/TINY
  const priorityScorer = (extractedTasks: any[], ideaAnalysis: any) => {
    return extractedTasks.map((task: any) => {
      let priority = 'SHOULD';
      let taskType = 'NORMAL';

      // Check task size
      const wordCount = task.title.split(' ').length;
      if (wordCount <= 5 && !task.has_reminder && task.suggested_timeframe === 'today') {
        taskType = 'TINY_TASK';
      } else if (wordCount > 10 || task.title.toLowerCase().includes('project') || task.title.toLowerCase().includes('plan')) {
        taskType = 'BIG_TASK';
      }

      // Check priority based on timeframe and urgency
      if (task.suggested_timeframe === 'today' || task.has_reminder) {
        priority = 'MUST';
      } else if (task.suggested_timeframe === 'this week') {
        priority = 'SHOULD';
      } else if (task.suggested_timeframe === 'someday') {
        priority = 'COULD';
      }

      // Boost priority if emotional tone is urgent
      if (ideaAnalysis?.emotional_tone && ['stressed', 'overwhelmed'].includes(ideaAnalysis.emotional_tone.toLowerCase())) {
        if (priority === 'SHOULD') priority = 'MUST';
      }

      return {
        ...task,
        priority,
        taskType
      };
    });
  };

  // Agenda Router: Auto-assign to Today/Tomorrow/Week/Upcoming/Someday
  const agendaRouter = (tasks: any[], ideaAnalysis: any) => {
    return tasks.map((task: any) => {
      let agenda = 'Upcoming';

      // Route based on timeframe
      if (task.suggested_timeframe === 'today') {
        agenda = 'Today';
      } else if (task.suggested_timeframe === 'tomorrow') {
        agenda = 'Tomorrow';
      } else if (task.suggested_timeframe === 'this week') {
        agenda = 'This Week';
      } else if (task.suggested_timeframe === 'someday') {
        agenda = 'Someday';
      }

      // Check for time-based keywords
      const title = task.title.toLowerCase();
      if (title.includes('tonight') || title.includes('this evening')) {
        agenda = 'Today';
      } else if (title.includes('tomorrow') || title.includes('next day')) {
        agenda = 'Tomorrow';
      } else if (title.includes('next week') || title.includes('this week')) {
        agenda = 'This Week';
      }

      // Boost MUST items to Today if not already scheduled
      if (task.priority === 'MUST' && agenda === 'Upcoming') {
        agenda = 'Today';
      }

      return {
        ...task,
        agenda
      };
    });
  };

  // Clarification Prompter: Generate questions for missing context
  const clarificationPrompter = (tasks: any[], ideaAnalysis: any) => {
    const questions: string[] = [];

    // Check for tasks without timeframes
    const noTimeframe = tasks.filter((t: any) => !t.suggested_timeframe || t.suggested_timeframe === 'someday');
    if (noTimeframe.length > 0) {
      questions.push(`When would you like to tackle "${noTimeframe[0].title}"? Today or later?`);
    }

    // Check for tasks without categories
    const noCategory = tasks.filter((t: any) => !t.category && !t.custom_category_id);
    if (noCategory.length > 0 && questions.length < 2) {
      questions.push(`What area does "${noCategory[0].title}" belong to? Work or Personal?`);
    }

    // Check for vague decisions
    if (ideaAnalysis?.decisions && ideaAnalysis.decisions.length > 0) {
      const firstDecision = ideaAnalysis.decisions[0];
      if (firstDecision && questions.length < 2) {
        questions.push(`About "${firstDecision}" - have you decided yet?`);
      }
    }

    // Check for unanswered questions
    if (ideaAnalysis?.questions && ideaAnalysis.questions.length > 0 && questions.length < 2) {
      questions.push(`I noticed you asked: "${ideaAnalysis.questions[0]}" - want to explore this?`);
    }

    return questions.slice(0, 2); // Max 2 clarification questions
  };

  // Summary Composer: Create notebook-style summary
  const summaryComposer = (
    ideaAnalysis: any,
    extractedTasks: any[],
    contextMap: any,
    prioritizedTasks: any[],
    routedTasks: any[],
    clarifications: string[]
  ) => {
    const mustTasks = prioritizedTasks.filter((t: any) => t.priority === 'MUST');
    const tinyTasks = prioritizedTasks.filter((t: any) => t.taskType === 'TINY_TASK');
    const bigTasks = prioritizedTasks.filter((t: any) => t.taskType === 'BIG_TASK');

    const summary = {
      insight: ideaAnalysis?.summary || 'Capturing your thoughts...',
      extractedTasks: extractedTasks.map((t: any) => t.title),
      decisions: ideaAnalysis?.decisions || [],
      recommendations: [],
      suggestedProjects: contextMap.inferredProjects || [],
      nextActions: []
    };

    // Generate recommendations
    if (mustTasks.length > 0) {
      summary.recommendations.push(`Focus on ${mustTasks.length} high-priority item${mustTasks.length > 1 ? 's' : ''} first`);
    }
    if (tinyTasks.length >= 3) {
      summary.recommendations.push(`Bundle ${tinyTasks.length} tiny tasks into a Fiesta session`);
    }
    if (bigTasks.length > 0) {
      summary.recommendations.push(`Break down "${bigTasks[0].title}" into smaller steps`);
    }
    if (contextMap.timeSensitivity === 'high') {
      summary.recommendations.push('Take a breath - let\'s tackle this step by step');
    }

    // Generate next actions
    const todayTasks = routedTasks.filter((t: any) => t.agenda === 'Today');
    if (todayTasks.length > 0) {
      summary.nextActions.push(`Start with: ${todayTasks[0].title}`);
    }
    if (clarifications.length > 0) {
      summary.nextActions.push('Answer clarification questions to organize better');
    }
    if (ideaAnalysis?.followups && ideaAnalysis.followups.length > 0) {
      summary.nextActions.push(ideaAnalysis.followups[0]);
    }

    return summary;
  };
  
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

      let isStopCommandDetected = false;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          console.log('Audio chunk received, total chunks:', audioChunksRef.current.length);
          
          // Check for stop commands starting from the first chunk
          if (!isStopCommandDetected && audioChunksRef.current.length >= 1) {
            const recentChunks = audioChunksRef.current.slice(-3); // Check last 3 seconds
            const recentBlob = new Blob(recentChunks, { type: 'audio/webm' });
            
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
            console.log('📝 Transcribed text:', transcribed);

            // ===========================================================
            // THOUGHT ENGINE 2.0 PIPELINE
            // ===========================================================

            // Step 2: Split into multiple tasks
            console.log('✂️ STEP 2: Splitting tasks...');
            const { data: splitData, error: splitError } = await supabase.functions.invoke('split-tasks', {
              body: { text: transcribed }
            });

            if (splitError) {
              console.error('❌ Split tasks error:', splitError);
            }

            const taskTexts = splitData?.tasks || [transcribed];
            console.log('✅ Split into', taskTexts.length, 'item(s)');

            // Step 3: Extract tasks
            console.log('🔍 STEP 3: Extracting tasks...');
            const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-tasks', {
              body: { text: transcribed }
            });

            if (extractError) {
              console.error('❌ Extract tasks error:', extractError);
            }

            const extractedTasks = extractData?.tasks || [];
            console.log('✅ Extracted', extractedTasks.length, 'task(s)');

            // Step 4: Deep idea analysis using GPT-4-turbo
            console.log('🧠 STEP 4: Idea analysis (GPT-4)...');
            const { data: ideaData, error: ideaError } = await supabase.functions.invoke('idea-analyzer', {
              body: { text: transcribed }
            });

            if (ideaError) {
              console.error('❌ Idea analyzer error:', ideaError);
            }

            const ideaAnalysis = ideaData?.analysis || {};
            console.log('💡 Idea analysis:', ideaAnalysis);

            // Step 5: Context mapping
            console.log('🗺️ STEP 5: Context mapping...');
            const contextMap = contextMapper(extractedTasks, ideaAnalysis);
            console.log('📍 Context map:', contextMap);

            // Step 6: Priority scoring
            console.log('⭐ STEP 6: Priority scoring...');
            const prioritizedTasks = priorityScorer(extractedTasks, ideaAnalysis);
            console.log('🎯 Prioritized tasks:', prioritizedTasks);

            // Step 7: Agenda routing
            console.log('📅 STEP 7: Agenda routing...');
            const routedTasks = agendaRouter(prioritizedTasks, ideaAnalysis);
            console.log('🗓️ Routed tasks:', routedTasks);

            // Step 8: Clarification prompting
            console.log('❓ STEP 8: Clarification prompting...');
            const clarifications = clarificationPrompter(routedTasks, ideaAnalysis);
            console.log('💬 Clarifications needed:', clarifications);

            // Step 9: Summary composition
            console.log('📝 STEP 9: Summary composition...');
            const structuredSummary = summaryComposer(
              ideaAnalysis,
              extractedTasks,
              contextMap,
              prioritizedTasks,
              routedTasks,
              clarifications
            );
            console.log('📊 Structured summary:', structuredSummary);

            // Step 10: Get user profile
            console.log('👤 STEP 10: Getting user profile...');
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            let userProfileData = null;
            
            if (currentUser) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
              
              userProfileData = profileData;

              // Save structured summary to conversation history
              await supabase.from('conversation_history').insert({
                user_id: currentUser.id,
                session_id: sessionId,
                role: 'assistant_summary',
                content: JSON.stringify({
                  ideaAnalysis,
                  contextMap,
                  structuredSummary,
                  clarifications
                }),
              });
            }

            // Step 11: Send to chat-completion with FULL STRUCTURED CONTEXT
            console.log('🤖 STEP 11: Chat completion with structured context...');
            
            const messages: Message[] = [
              ...conversationHistory,
              { role: 'user', content: transcribed }
            ];

            const fullAnalysis = {
              summary: structuredSummary.insight,
              tasks: routedTasks,
              insights: ideaAnalysis.insights || [],
              topics: ideaAnalysis.topics || [],
              decisions: ideaAnalysis.decisions || [],
              ideas: ideaAnalysis.ideas || [],
              questions: ideaAnalysis.questions || [],
              followups: ideaAnalysis.followups || [],
              emotionalTone: ideaAnalysis.emotional_tone,
              contextMap,
              recommendations: structuredSummary.recommendations,
              nextActions: structuredSummary.nextActions,
              clarifications,
              agenda: {
                today: routedTasks.filter((t: any) => t.agenda === 'Today').length,
                tomorrow: routedTasks.filter((t: any) => t.agenda === 'Tomorrow').length,
                thisWeek: routedTasks.filter((t: any) => t.agenda === 'This Week').length,
                upcoming: routedTasks.filter((t: any) => t.agenda === 'Upcoming').length,
                someday: routedTasks.filter((t: any) => t.agenda === 'Someday').length,
              }
            };

            const { data: chatData, error: chatError } = await supabase.functions.invoke('chat-completion', {
              body: { 
                messages,
                userProfile: userProfileData,
                currentMood,
                analysis: fullAnalysis
              }
            });

            if (chatError) {
              console.error('❌ Chat completion error:', chatError);
              throw chatError;
            }
            console.log('✅ Chat completion successful');

            const response = chatData.reply;
            setGptResponse(response);
            console.log('💬 GPT Response:', response);

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
            console.log('🔊 STEP 3: Text-to-Speech');
            console.log('Audio enabled:', audioEnabled);
            if (audioEnabled) {
              console.log('🎵 Generating speech for response:', response);
              try {
                const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                  body: { text: response, voice: 'nova' }
                });

                console.log('TTS response received:', { hasData: !!ttsData, hasError: !!ttsError });

                if (ttsError) {
                  console.error('TTS Error:', ttsError);
                  throw ttsError;
                }

                if (!ttsData?.audioContent) {
                  console.error('No audio content in TTS response');
                  throw new Error('No audio content received from TTS');
                }

                console.log('🔊 Playing audio response...');
                await playAudioResponse(ttsData.audioContent);
                console.log('✅ Audio playback complete');
              } catch (ttsError: any) {
                console.error('TTS processing failed:', ttsError);
                toast({
                  title: "Audio generation failed",
                  description: ttsError.message || "Could not generate audio response",
                  variant: "destructive",
                });
              }
            } else {
              console.log('🔇 Audio playback disabled by user settings');
              console.log('Profile wants_voice_playback:', profile?.wants_voice_playback);
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

  const handleConfirmTasks = async (confirmedTasks: Array<{title: string; category: string; is_focus: boolean; custom_category_id?: string; reminder_time?: string | null}>) => {
    setShowConfirmation(false);
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];
      const tasksToCreate = confirmedTasks.map(task => ({
        title: task.title,
        category: task.category,
        custom_category_id: task.custom_category_id,
        input_method: 'voice' as const,
        is_focus: task.is_focus,
        focus_date: task.is_focus ? today : null,
        reminder_time: task.reminder_time || null,
        completed: false,
      }));

      const createdTasks = await createTasks(tasksToCreate);
      
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

  // Expose startRecording method via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      console.log('🎯 startRecording called! State:', { isListening, isProcessing, isSpeaking });
      if (!isListening && !isProcessing && !isSpeaking) {
        console.log('✅ Conditions met, calling handleVoiceLoop');
        handleVoiceLoop();
      } else {
        console.log('❌ Blocked by state:', { isListening, isProcessing, isSpeaking });
      }
    }
  }));

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        
        {/* Transcription and Response Display - Hidden on mobile for cleaner UI */}
        {!isMobile && (
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
        )}
        
        {/* Mobile: Show minimal status indicator */}
        {isMobile && (isProcessing || isSpeaking) && (
          <div className="w-full flex justify-center py-4">
            {isProcessing && (
              <div className="text-sm text-muted-foreground animate-pulse">
                {!transcribedText ? 'Processing...' : 'Organizing tasks...'}
              </div>
            )}
            {isSpeaking && (
              <div className="flex items-center gap-2 text-primary text-sm">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Speaking...</span>
              </div>
            )}
          </div>
        )}

        {/* Stop Word Detection Confirmation */}
        {stopWordDetected && (
          <div className="w-full flex justify-center py-4 animate-in fade-in scale-in duration-300">
            <div className="flex items-center gap-3 bg-primary/10 text-primary px-6 py-3 rounded-full border-2 border-primary shadow-lg animate-pulse">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-sm">Stop detected</span>
            </div>
          </div>
        )}

        {/* Voice Control - Replaced with VoiceOrb */}
        <VoiceOrb
          onVoiceInput={handleVoiceTaskCapture} 
          onPlanningModeActivated={onPlanningModeActivated}
          onReflectionModeActivated={onReflectionModeActivated}
          onOrbReflectionTrigger={onOrbReflectionTrigger}
          isSaving={isSaving}
          showSuccess={showSuccess}
          stopWordDetected={stopWordDetected}
        />

        {/* Action buttons - Only show on desktop */}
        {!isMobile && gptResponse && !isProcessing && !isSpeaking && !showMoodSelector && (
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

      {/* Conversational Task Flow */}
      {showConfirmation && pendingTasks.length > 0 && (
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
    </div>
  );
});

MalunitaVoice.displayName = "MalunitaVoice";

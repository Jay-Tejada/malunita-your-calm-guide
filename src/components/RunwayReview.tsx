import { useState, useEffect, useRef } from "react";
import { X, Check, Clock, Archive, Edit3, Plus, Mic, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { MoodSelector } from "@/components/MoodSelector";
import { findTinyTasks } from "@/lib/tinyTaskDetector";
import { useNavigate } from "react-router-dom";

interface RunwayReviewProps {
  onClose: () => void;
}

interface CategorizedTasks {
  urgentToday: any[];
  upcoming: any[];
  stuckOverdue: any[];
}

export const RunwayReview = ({ onClose }: RunwayReviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategorizedTasks>({
    urgentToday: [],
    upcoming: [],
    stuckOverdue: []
  });
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [audioReady, setAudioReady] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  
  const { updateTask, deleteTask } = useTasks();
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (voiceAnimationRef.current) {
        cancelAnimationFrame(voiceAnimationRef.current);
      }
      if (voiceAudioContextRef.current) {
        voiceAudioContextRef.current.close();
      }
    };
  }, []);

  const animateWaveform = () => {
    const newLevels = audioLevels.map(() => 
      Math.random() * 0.5 + 0.3 // Random height between 0.3 and 0.8
    );
    setAudioLevels(newLevels);
    animationRef.current = requestAnimationFrame(animateWaveform);
  };

  const loadReview = async (mood: string | null = null) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('runway-review', {
        body: { mood }
      });

      if (error) throw error;

      setReview(data.review);
      setTasks(data.tasks || []);
      setCategories(data.categories || {
        urgentToday: [],
        upcoming: [],
        stuckOverdue: []
      });
      setTimeOfDay(data.timeOfDay || 'morning');

      // Generate speech - but don't fail the whole review if TTS fails
      try {
        console.log('Calling text-to-speech for runway review...');
        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: { text: data.review, voice: 'alloy' }
        });

        if (ttsError) {
          console.error('TTS error:', ttsError);
          throw ttsError;
        }

        if (ttsData?.audioContent) {
          console.log('Playing audio response...');
          await playAudioResponse(ttsData.audioContent);
        } else {
          console.warn('No audio content received from TTS');
        }
      } catch (ttsError) {
        console.error('Failed to generate or play audio:', ttsError);
        // Don't fail the whole review, just log and continue
        toast({
          title: "Audio unavailable",
          description: "Showing text review only",
          variant: "default",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Store for manual play if autoplay fails
      setAudioBlob(audioUrl);
      setAudioReady(true);

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        setAudioReady(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevels(new Array(20).fill(0));
        URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevels(new Array(20).fill(0));
        URL.revokeObjectURL(audioUrl);
      };

      // Try to play - will show play button if autoplay is blocked
      try {
        setIsSpeaking(true);
        animateWaveform();
        await audio.play();
      } catch (playError) {
        console.log('Autoplay blocked, showing play button:', playError);
        setIsSpeaking(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevels(new Array(20).fill(0));
        // Keep audioReady true so play button shows
        toast({
          title: "Tap to hear",
          description: "Audio is ready - tap the play button",
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      setAudioReady(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevels(new Array(20).fill(0));
    }
  };

  const handleManualPlay = async () => {
    if (audioElementRef.current && audioReady) {
      try {
        setIsSpeaking(true);
        animateWaveform();
        await audioElementRef.current.play();
        setAudioReady(false);
      } catch (error) {
        console.error('Manual play error:', error);
        toast({
          title: "Playback failed",
          description: "Could not play audio",
          variant: "destructive",
        });
      }
    }
  };

  const handleMoodSelect = async (mood: string) => {
    setCurrentMood(mood);
    setShowMoodSelector(false);
    await loadReview(mood);
  };

  const handleSkipMood = async () => {
    setShowMoodSelector(false);
    await loadReview(null);
  };

  const handleMarkDone = async (taskId: string) => {
    updateTask({ id: taskId, updates: { completed: true, completed_at: new Date().toISOString() } });
    setTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: "Task completed" });
  };

  const handleArchive = async (taskId: string) => {
    deleteTask(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    toast({ title: "Task archived" });
  };

  const analyzeVoiceAudio = () => {
    if (!voiceAnalyserRef.current) return;

    const dataArray = new Uint8Array(voiceAnalyserRef.current.frequencyBinCount);
    voiceAnalyserRef.current.getByteFrequencyData(dataArray);

    const bands = 20;
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
    voiceAnimationRef.current = requestAnimationFrame(analyzeVoiceAudio);
  };

  const processVoiceCommand = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Match patterns like "mark task 1 done" or "complete task 2"
    const markDoneMatch = lowerTranscript.match(/(?:mark|complete|finish|done)\s+task\s+(\d+)/);
    if (markDoneMatch) {
      const taskIndex = parseInt(markDoneMatch[1]) - 1;
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        await handleMarkDone(tasks[taskIndex].id);
        return `Task ${markDoneMatch[1]} marked as done`;
      }
    }

    // Match patterns like "archive task 3" or "delete task 1"
    const archiveMatch = lowerTranscript.match(/(?:archive|delete|remove)\s+task\s+(\d+)/);
    if (archiveMatch) {
      const taskIndex = parseInt(archiveMatch[1]) - 1;
      if (taskIndex >= 0 && taskIndex < tasks.length) {
        await handleArchive(tasks[taskIndex].id);
        return `Task ${archiveMatch[1]} archived`;
      }
    }

    // Ask AI to respond to general questions about tasks
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          messages: [
            { role: 'user', content: `User is in their Runway Review ritual. They have ${tasks.length} tasks. Their question: ${transcript}` }
          ],
          currentMood
        }
      });

      if (error) throw error;
      
      // Generate speech for response
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: data.reply, voice: 'alloy' }
      });

      if (!ttsError && ttsData) {
        await playAudioResponse(ttsData.audioContent);
      }

      return data.reply;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return "I couldn't process that. Try again?";
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (voiceAnimationRef.current) {
        cancelAnimationFrame(voiceAnimationRef.current);
      }
      if (voiceAudioContextRef.current) {
        voiceAudioContextRef.current.close();
        voiceAudioContextRef.current = null;
      }
      setAudioLevels(new Array(20).fill(0));
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis for visual feedback
      const audioContext = new AudioContext();
      voiceAudioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      voiceAnalyserRef.current = analyser;
      source.connect(analyser);
      analyzeVoiceAudio();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessingVoice(true);
        setVoiceTranscript("");

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
            setIsProcessingVoice(false);
            return;
          }

          try {
            // Transcribe audio
            const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (transcribeError) throw transcribeError;

            const transcript = transcribeData.text;
            setVoiceTranscript(transcript);

            // Process the voice command
            const response = await processVoiceCommand(transcript);
            
            toast({
              title: "Voice command",
              description: response,
            });

            // Clear transcript after 3 seconds
            setTimeout(() => setVoiceTranscript(""), 3000);

          } catch (error: any) {
            console.error('Voice input error:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to process voice input",
              variant: "destructive",
            });
          } finally {
            setIsProcessingVoice(false);
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

  // Visual theme based on time of day
  const theme = timeOfDay === 'morning' 
    ? {
        gradient: 'from-amber-50 via-orange-50 to-yellow-50',
        overlay: 'bg-gradient-to-b from-transparent via-amber-100/20 to-amber-200/30',
        text: 'text-amber-900',
        accent: 'text-orange-600'
      }
    : {
        gradient: 'from-slate-900 via-indigo-950 to-slate-900',
        overlay: 'bg-gradient-to-b from-transparent via-indigo-950/30 to-purple-950/20',
        text: 'text-slate-100',
        accent: 'text-purple-300'
      };

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br ${theme.gradient} overflow-y-auto`}>
      {/* Overlay animation */}
      <div className={`absolute inset-0 ${theme.overlay} animate-pulse`} style={{ animationDuration: '8s' }} />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-6 right-6 ${theme.text} hover:opacity-70 transition-opacity z-10`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Voice Input Button */}
      <button
        onClick={handleVoiceInput}
        disabled={isProcessingVoice}
        className={`absolute bottom-6 right-6 z-10 ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : timeOfDay === 'morning'
            ? 'bg-orange-500 hover:bg-orange-600'
            : 'bg-purple-500 hover:bg-purple-600'
        } text-white rounded-full p-4 shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
      </button>

      {/* Voice Transcript Display */}
      {voiceTranscript && (
        <div className="absolute bottom-24 right-6 z-10 max-w-xs bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg animate-in fade-in duration-200">
          <p className="text-sm text-gray-800">{voiceTranscript}</p>
        </div>
      )}

      {isProcessingVoice && (
        <div className="absolute bottom-24 right-6 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <p className="text-sm text-gray-800">Processing...</p>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-light tracking-tight mb-2 ${theme.text}`}>
            {timeOfDay === 'morning' ? '🌅 Morning Clarity' : '🌙 Evening Wind-Down'}
          </h1>
          <p className={`text-sm ${theme.accent}`}>Runway Review Ritual</p>
        </div>

        {/* Mood Selector */}
        {showMoodSelector && (
          <div className="mb-8">
            <MoodSelector 
              onMoodSelect={handleMoodSelect}
              onSkip={handleSkipMood}
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className={`text-center ${theme.text}`}>
            <p>Preparing your review...</p>
          </div>
        )}

        {/* Waveform */}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-1 h-32 mb-8">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className={`w-2 ${timeOfDay === 'morning' ? 'bg-orange-400' : 'bg-purple-400'} rounded-full transition-all duration-100`}
                style={{ height: `${level * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Play Button - shows if autoplay was blocked */}
        {audioReady && !isSpeaking && (
          <div className="flex flex-col items-center justify-center mb-8 gap-4">
            <button
              onClick={handleManualPlay}
              className={`${
                timeOfDay === 'morning' 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-purple-500 hover:bg-purple-600'
              } text-white rounded-full p-6 shadow-lg transition-all hover:scale-105 animate-pulse`}
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <p className={`text-sm ${theme.accent}`}>Tap to hear the review</p>
          </div>
        )}

        {/* Review Text */}
        {!isLoading && review && (
          <div className={`bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 ${theme.text}`}>
            <p className="leading-relaxed whitespace-pre-line">{review}</p>
          </div>
        )}

        {/* Task Categories */}
        {!isLoading && !showMoodSelector && (
          <div className="space-y-6">
            {/* Urgent Today */}
            {categories.urgentToday.length > 0 && (
              <TaskSection 
                title="🚨 Urgent Today"
                description="Time-sensitive tasks and today's focus items that need immediate attention"
                tasks={categories.urgentToday}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
                variant="urgent"
              />
            )}
            
            {/* Upcoming */}
            {categories.upcoming.length > 0 && (
              <TaskSection 
                title="📅 Upcoming"
                description="Recent tasks to prepare for - your next priorities"
                tasks={categories.upcoming}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
                variant="priority"
              />
            )}
            
            {/* Stuck/Overdue */}
            {categories.stuckOverdue.length > 0 && (
              <TaskSection 
                title="⚠️ Stuck or Overdue"
                description="Older tasks that may need to be archived, rescheduled, or broken down"
                tasks={categories.stuckOverdue}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
                variant="stuck"
              />
            )}

            {/* Fiesta Suggestion - if many small tasks detected */}
            {categories.stuckOverdue.length > 0 && findTinyTasks(categories.stuckOverdue).length >= 3 && (
              <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <h3 className="font-semibold text-lg">Tiny Task Fiesta?</h3>
                    <p className="text-sm text-muted-foreground">
                      Many of your stuck items are tiny tasks. Want to clear them in a fun, focused sprint?
                    </p>
                    <Button 
                      onClick={() => {
                        onClose();
                        navigate('/tiny-task-fiesta');
                      }}
                      size="sm"
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Tiny Task Fiesta
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  description?: string;
  tasks: any[];
  theme: any;
  onMarkDone: (id: string) => void;
  onArchive: (id: string) => void;
  variant?: 'urgent' | 'priority' | 'stuck' | 'upcoming';
}

const TaskSection = ({ title, description, tasks, theme, onMarkDone, onArchive, variant }: TaskSectionProps) => {
  const variantStyles = {
    urgent: 'border-red-500/20 bg-red-500/5',
    priority: 'border-primary/20 bg-primary/5',
    stuck: 'border-orange-500/20 bg-orange-500/5',
    upcoming: 'border-blue-500/20 bg-blue-500/5',
  };

  return (
    <div className={`backdrop-blur-sm rounded-2xl p-6 border-2 ${variant ? variantStyles[variant] : 'bg-white/10'}`}>
      <div className="mb-4">
        <h3 className={`text-lg font-semibold mb-1 ${theme.text}`}>{title}</h3>
        {description && (
          <p className={`text-sm ${theme.accent} opacity-80`}>{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-colors"
          >
            <div className="flex-1">
              <p className={`font-medium ${theme.text}`}>{task.title}</p>
              {task.context && (
                <p className={`text-sm mt-1 ${theme.accent} opacity-70`}>
                  {task.context.length > 100 ? `${task.context.slice(0, 100)}...` : task.context}
                </p>
              )}
              {task.is_time_based && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                  <Clock className="w-3 h-3" />
                  Time-sensitive
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkDone(task.id)}
                className={`h-8 w-8 p-0 ${theme.text} hover:bg-green-500/20`}
                title="Mark complete"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onArchive(task.id)}
                className={`h-8 w-8 p-0 ${theme.text} hover:bg-red-500/20`}
                title="Archive task"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

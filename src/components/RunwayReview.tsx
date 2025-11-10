import { useState, useEffect, useRef } from "react";
import { X, Check, Clock, Archive, Edit3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { MoodSelector } from "@/components/MoodSelector";

interface RunwayReviewProps {
  onClose: () => void;
}

interface CategorizedTasks {
  nextActions: any[];
  timeSensitive: any[];
  unfinished: any[];
  clutter: any[];
}

export const RunwayReview = ({ onClose }: RunwayReviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategorizedTasks>({
    nextActions: [],
    timeSensitive: [],
    unfinished: [],
    clutter: []
  });
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  
  const { updateTask, deleteTask } = useTasks();
  const { toast } = useToast();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
        nextActions: [],
        timeSensitive: [],
        unfinished: [],
        clutter: []
      });
      setTimeOfDay(data.timeOfDay || 'morning');

      // Generate speech
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: data.review, voice: 'alloy' }
      });

      if (ttsError) throw ttsError;

      await playAudioResponse(ttsData.audioContent);

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
      setIsSpeaking(true);
      animateWaveform();
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevels(new Array(20).fill(0));
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setAudioLevels(new Array(20).fill(0));
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevels(new Array(20).fill(0));
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

        {/* Review Text */}
        {!isLoading && review && (
          <div className={`bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 ${theme.text}`}>
            <p className="leading-relaxed whitespace-pre-line">{review}</p>
          </div>
        )}

        {/* Task Categories */}
        {!isLoading && !showMoodSelector && (
          <div className="space-y-6">
            {categories.nextActions.length > 0 && (
              <TaskSection 
                title="✅ Next Actions"
                tasks={categories.nextActions}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
              />
            )}
            
            {categories.timeSensitive.length > 0 && (
              <TaskSection 
                title="⏳ Time-Sensitive"
                tasks={categories.timeSensitive}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
              />
            )}
            
            {categories.unfinished.length > 0 && (
              <TaskSection 
                title="🧠 Unfinished Thoughts"
                tasks={categories.unfinished}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
              />
            )}
            
            {categories.clutter.length > 0 && (
              <TaskSection 
                title="🧹 Possible Clutter"
                tasks={categories.clutter}
                theme={theme}
                onMarkDone={handleMarkDone}
                onArchive={handleArchive}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskSectionProps {
  title: string;
  tasks: any[];
  theme: any;
  onMarkDone: (id: string) => void;
  onArchive: (id: string) => void;
}

const TaskSection = ({ title, tasks, theme, onMarkDone, onArchive }: TaskSectionProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
      <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 bg-white/5 rounded-xl p-4"
          >
            <div className="flex-1">
              <p className={theme.text}>{task.title}</p>
              {task.context && (
                <p className={`text-sm mt-1 ${theme.accent} opacity-70`}>
                  {task.context.slice(0, 100)}...
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkDone(task.id)}
                className="h-8 w-8 p-0"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onArchive(task.id)}
                className="h-8 w-8 p-0"
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

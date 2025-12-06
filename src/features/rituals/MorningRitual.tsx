import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreatureSprite } from "@/components/CreatureSprite";
import { useMoodStore } from "@/state/moodMachine";
import { useEmotionalMemory } from "@/state/emotionalMemory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useOrbRituals } from "@/hooks/useOrbRituals";
import { useOrbTriggers } from "@/hooks/useOrbTriggers";
import { useRitualInsights, MorningInsight } from "@/hooks/useRitualInsights";
import { RitualInsightCard } from "@/components/rituals/RitualInsightCard";
import { HabitCard } from "@/components/habits/HabitCard";
import { Sparkles, Sun, Calendar } from "lucide-react";

interface MorningRitualProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = "greeting" | "focus" | "appointments" | "processing" | "complete";

export function MorningRitual({ onComplete, onSkip }: MorningRitualProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [focusAnswer, setFocusAnswer] = useState("");
  const [appointmentsAnswer, setAppointmentsAnswer] = useState("");
  const [insight, setInsight] = useState<MorningInsight | null>(null);
  const { mood, updateMood } = useMoodStore();
  const { createTasks } = useTasks();
  const { habits, toggleCompletion, isCompletedToday, getStreak } = useHabits();
  const { toast } = useToast();
  const emotionalMemory = useEmotionalMemory();
  const { onStartMyDay } = useOrbRituals();
  const { onAIStart, onAIEnd } = useOrbTriggers();
  const { getMorningInsight, loading: insightLoading } = useRitualInsights();

  // Get today's habits for the ritual
  const todaysHabits = habits.filter(h => {
    const dayOfWeek = new Date().getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekdays' && isWeekday) return true;
    if (h.frequency === 'weekly' && dayOfWeek === 0) return true;
    return false;
  });

  // Fetch insight on mount
  useEffect(() => {
    const fetchInsight = async () => {
      onAIStart();
      const result = await getMorningInsight();
      onAIEnd();
      setInsight(result);
    };
    fetchInsight();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (emotionalMemory.affection >= 75) {
      return "Good morning! 💛 I'm so happy to see you!";
    }
    
    if (emotionalMemory.fatigue >= 70) {
      return "Morning... let's take it easy today, okay?";
    }
    
    if (hour < 7) {
      return "You're up early! ☀️ Ready to make today great?";
    }
    
    return "Good morning! Let's plan a wonderful day together.";
  };

  const handleStart = () => {
    updateMood("welcoming");
    emotionalMemory.adjustAffection(3);
    setStep("focus");
  };

  const handleFocusNext = () => {
    if (!focusAnswer.trim()) {
      toast({
        title: "Share your thoughts",
        description: "Tell me what's important today",
        variant: "destructive"
      });
      return;
    }
    updateMood("excited");
    setStep("appointments");
  };

  const handleComplete = async () => {
    if (!focusAnswer.trim()) {
      toast({
        title: "Share your focus",
        description: "Let me know what's important today",
        variant: "destructive"
      });
      return;
    }

    setStep("processing");
    updateMood("happy");

    try {
      // Get current session to ensure auth token is fresh
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // TODO: legacy reference, removed in consolidation
      // const { data, error } = await supabase.functions.invoke('process-ritual', {
      //   body: {
      //     type: 'morning',
      //     focusAnswer,
      //     appointmentsAnswer: appointmentsAnswer || null
      //   },
      //   headers: {
      //     Authorization: `Bearer ${session.access_token}`
      //   }
      // });
      const data = null;
      const error = null;

      if (error) throw error;

      // Create tasks from AI analysis
      if (data.tasks && data.tasks.length > 0) {
        await createTasks(data.tasks);
      }

      // Update emotional memory
      emotionalMemory.adjustJoy(5);
      emotionalMemory.recordActivity();

      // Update profile with ritual completion
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ritual_preferences')
          .eq('id', user.id)
          .single();

        const ritualPrefs = (profile?.ritual_preferences as any) || {};

        await supabase
          .from('profiles')
          .update({
            ritual_preferences: {
              ...ritualPrefs,
              last_morning_ritual: new Date().toISOString()
            }
          })
          .eq('id', user.id);
      }

      updateMood("loving");
      setStep("complete");
      onStartMyDay();
      
      toast({
        title: "Morning ritual complete! ✨",
        description: `Created ${data.tasks?.length || 0} tasks for today`,
      });

      // Delay onComplete to show cutscene first
      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error) {
      console.error('Error processing morning ritual:', error);
      toast({
        title: "Error",
        description: "Failed to process ritual. Please try again.",
        variant: "destructive"
      });
      setStep("appointments");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <CreatureSprite
              emotion={mood === "neutral" ? "welcoming" : mood}
              size={120}
              animate={true}
            />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" />
            Morning Ritual
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "greeting" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <p className="text-lg text-center text-muted-foreground">
                {getGreeting()}
              </p>
              
              {/* AI Insight Card */}
              {insightLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              {insight && <RitualInsightCard type="morning" insight={insight} />}
              
              {/* Today's Habits */}
              {todaysHabits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Today's Habits
                  </p>
                  <div className="space-y-2">
                    {todaysHabits.map(habit => (
                      <HabitCard
                        key={habit.id}
                        habit={{
                          id: habit.id,
                          title: habit.title,
                          icon: habit.icon,
                          completed: isCompletedToday(habit.id),
                          streak: getStreak(habit.id)
                        }}
                        onToggle={(id, completed) => {
                          toggleCompletion.mutate({ habitId: id });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Let's start
                </Button>
                <Button onClick={onSkip} variant="ghost" size="lg">
                  Skip today
                </Button>
              </div>
            </motion.div>
          )}

          {step === "focus" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                What's one important thing today?
              </label>
              <Textarea
                value={focusAnswer}
                onChange={(e) => setFocusAnswer(e.target.value)}
                placeholder="E.g., Finish the presentation for tomorrow's meeting"
                className="min-h-24 resize-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button onClick={onSkip} variant="ghost">
                  Skip
                </Button>
                <Button onClick={handleFocusNext}>
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {step === "appointments" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Any appointments or time-based tasks?
              </label>
              <Textarea
                value={appointmentsAnswer}
                onChange={(e) => setAppointmentsAnswer(e.target.value)}
                placeholder="Optional: E.g., Team call at 2pm, Gym at 6pm"
                className="min-h-24 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button onClick={onSkip} variant="ghost">
                  Skip
                </Button>
                <Button onClick={handleComplete}>
                  Complete ritual
                </Button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4 py-8"
            >
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-muted-foreground">
                Creating your tasks for today...
              </p>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-8"
            >
              <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
              <p className="text-lg font-medium">
                Perfect! Let's make today amazing! ✨
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
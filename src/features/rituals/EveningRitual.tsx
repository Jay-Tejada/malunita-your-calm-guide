import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreatureSprite } from "@/components/CreatureSprite";
import { useMoodStore } from "@/state/moodMachine";
import { useEmotionalMemory } from "@/state/emotionalMemory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Moon, Heart, AlertCircle, Sparkles } from "lucide-react";

interface EveningRitualProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = "greeting" | "wins" | "stress" | "tomorrow" | "processing" | "complete";

export function EveningRitual({ onComplete, onSkip }: EveningRitualProps) {
  const [step, setStep] = useState<Step>("greeting");
  const [winsAnswer, setWinsAnswer] = useState("");
  const [stressAnswer, setStressAnswer] = useState("");
  const [tomorrowAnswer, setTomorrowAnswer] = useState("");
  const { mood, updateMood } = useMoodStore();
  const { toast } = useToast();
  const emotionalMemory = useEmotionalMemory();

  const getGreeting = () => {
    if (emotionalMemory.stress >= 70) {
      return "Hey... looks like today was tough. Let's wind down together.";
    }
    
    if (emotionalMemory.joy >= 75) {
      return "Evening friend! 💛 Sounds like you had a great day!";
    }
    
    if (emotionalMemory.fatigue >= 70) {
      return "I'm pretty sleepy too... but let's reflect on today first. 🌙";
    }
    
    return "Evening friend 🌙 How was your day?";
  };

  const handleStart = () => {
    updateMood("neutral");
    emotionalMemory.adjustAffection(3);
    setStep("wins");
  };

  const handleWinsNext = () => {
    updateMood("loving");
    setStep("stress");
  };

  const handleStressNext = () => {
    updateMood("neutral");
    setStep("tomorrow");
  };

  const handleComplete = async () => {
    setStep("processing");
    updateMood("sleepy");

    try {
      // Get current session to ensure auth token is fresh
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // TODO: legacy reference, removed in consolidation
      // const { data, error } = await supabase.functions.invoke('process-ritual', {
      //   body: {
      //     type: 'evening',
      //     winsAnswer: winsAnswer || null,
      //     stressAnswer: stressAnswer || null,
      //     tomorrowAnswer: tomorrowAnswer || null
      //   },
      //   headers: {
      //     Authorization: `Bearer ${session.access_token}`
      //   }
      // });
      const data = null;
      const error = null;

      if (error) throw error;

      // Update emotional memory based on responses
      if (winsAnswer) {
        emotionalMemory.adjustJoy(7);
      }
      if (stressAnswer) {
        emotionalMemory.adjustStress(-5); // Reduce stress by acknowledging it
      }
      emotionalMemory.adjustFatigue(3); // End of day fatigue
      emotionalMemory.recordActivity();

      // Update insights only (timestamp handled in App.tsx)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('insights')
          .eq('id', user.id)
          .single();

        const insights = (profile?.insights as any) || {};

        await supabase
          .from('profiles')
          .update({
            insights: {
              ...insights,
              last_reflection: {
                date: new Date().toISOString(),
                wins: winsAnswer || null,
                stress: stressAnswer || null,
                tomorrow_prep: tomorrowAnswer || null,
                ai_insights: data.insights
              }
            }
          })
          .eq('id', user.id);
      }

      updateMood("sleeping");
      setStep("complete");
      
      toast({
        title: "Good night! 🌙",
        description: data.message || "Rest well, see you tomorrow!",
      });

      // Delay onComplete to show cutscene first
      setTimeout(() => {
        onComplete();
      }, 100);
    } catch (error) {
      console.error('Error processing evening ritual:', error);
      toast({
        title: "Error",
        description: "Failed to process ritual. Please try again.",
        variant: "destructive"
      });
      setStep("tomorrow");
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
              emotion={mood === "neutral" ? "calm" : mood}
              size={120}
              animate={true}
            />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Moon className="w-6 h-6 text-indigo-400" />
            Evening Ritual
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
              <div className="flex gap-3 justify-center">
                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Let's reflect
                </Button>
                <Button onClick={onSkip} variant="ghost" size="lg">
                  Skip tonight
                </Button>
              </div>
            </motion.div>
          )}

          {step === "wins" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="text-sm font-medium flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                What went well today?
              </label>
              <Textarea
                value={winsAnswer}
                onChange={(e) => setWinsAnswer(e.target.value)}
                placeholder="Share your wins, big or small..."
                className="min-h-24 resize-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button onClick={onSkip} variant="ghost">
                  Skip
                </Button>
                <Button onClick={handleWinsNext}>
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {step === "stress" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                What stressed you today?
              </label>
              <Textarea
                value={stressAnswer}
                onChange={(e) => setStressAnswer(e.target.value)}
                placeholder="Optional: Let it out, I'm here to listen..."
                className="min-h-24 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button onClick={onSkip} variant="ghost">
                  Skip
                </Button>
                <Button onClick={handleStressNext}>
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {step === "tomorrow" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Anything we should prepare for tomorrow?
              </label>
              <Textarea
                value={tomorrowAnswer}
                onChange={(e) => setTomorrowAnswer(e.target.value)}
                placeholder="Optional: Important meetings, deadlines, or things to remember..."
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
                Saving your reflections...
              </p>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-8"
            >
              <Moon className="w-16 h-16 mx-auto text-indigo-400 animate-pulse" />
              <p className="text-lg font-medium">
                Good night! Rest well. 🌙✨
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
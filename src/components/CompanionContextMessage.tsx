import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Brain, Flame, TrendingUp, Zap, Calendar } from 'lucide-react';

interface CompanionContextMessageProps {
  onMessage?: (message: string) => void;
}

export const CompanionContextMessage = ({ onMessage }: CompanionContextMessageProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [icon, setIcon] = useState<React.ReactNode>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    checkIntelligentContext();

    // Check every 10 minutes
    const interval = setInterval(checkIntelligentContext, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkIntelligentContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check burnout recovery
    const { data: profile } = await supabase
      .from('profiles')
      .select('burnout_recovery_until, burnout_risk')
      .eq('id', user.id)
      .single();

    const inRecoveryMode = profile?.burnout_recovery_until 
      ? new Date(profile.burnout_recovery_until) > new Date()
      : false;

    if (inRecoveryMode) {
      setIcon(<Flame className="w-5 h-5 text-orange-500" />);
      setMessage("I'm keeping things gentle for the next 48 hours. Let's focus on recovery tasks.");
      setShow(true);
      onMessage?.("I'm keeping things gentle for the next 48 hours. Let's focus on recovery tasks.");
      setTimeout(() => setShow(false), 15000);
      return;
    }

    if (profile?.burnout_risk && profile.burnout_risk >= 0.5) {
      setIcon(<Brain className="w-5 h-5 text-yellow-500" />);
      setMessage("I'm noticing signs of overload. Want to lighten today's agenda?");
      setShow(true);
      onMessage?.("I'm noticing signs of overload. Want to lighten today's agenda?");
      setTimeout(() => setShow(false), 12000);
      return;
    }

    // Check focus streak
    const { data: streakData } = await supabase
      .from('focus_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentStreak = streakData?.current_streak || 0;
    if (currentStreak >= 5) {
      setIcon(<TrendingUp className="w-5 h-5 text-green-500" />);
      setMessage(`${currentStreak} days in a row! You're on fire! 🔥`);
      setShow(true);
      onMessage?.(`${currentStreak} days in a row! You're on fire! 🔥`);
      setTimeout(() => setShow(false), 10000);
      return;
    }

    if (currentStreak >= 3) {
      setIcon(<TrendingUp className="w-5 h-5 text-blue-500" />);
      setMessage(`${currentStreak}-day streak! Keep it going!`);
      setShow(true);
      onMessage?.(`${currentStreak}-day streak! Keep it going!`);
      setTimeout(() => setShow(false), 8000);
      return;
    }

    // Check for storm tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const { data: stormData } = await supabase
      .from('priority_storms')
      .select('expected_load_score, recommended_focus_task')
      .eq('user_id', user.id)
      .eq('date', tomorrowDate)
      .maybeSingle();

    if (stormData && stormData.expected_load_score >= 60) {
      setIcon(<Calendar className="w-5 h-5 text-purple-500" />);
      setMessage(`Tomorrow looks intense. Want to prepare now?`);
      setShow(true);
      onMessage?.(`Tomorrow looks intense. Want to prepare now?`);
      setTimeout(() => setShow(false), 12000);
      return;
    }

    // Check unlocks count on current ONE thing
    const today = new Date().toISOString().split('T')[0];
    const { data: focusTasks } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('is_focus', true)
      .eq('focus_date', today)
      .maybeSingle();

    if (focusTasks) {
      const { data: embeddingData } = await supabase
        .from('focus_embeddings')
        .select('unlocks_count')
        .eq('user_id', user.id)
        .eq('task_id', focusTasks.id)
        .maybeSingle();

      const unlocksCount = embeddingData?.unlocks_count || 0;
      if (unlocksCount >= 5) {
        setIcon(<Zap className="w-5 h-5 text-yellow-400" />);
        setMessage("This ONE thing will unlock so much progress. Let's crush it! 💪");
        setShow(true);
        onMessage?.("This ONE thing will unlock so much progress. Let's crush it! 💪");
        setTimeout(() => setShow(false), 10000);
        return;
      }

      if (unlocksCount >= 3) {
        setIcon(<Zap className="w-5 h-5 text-blue-400" />);
        setMessage("Today's focus will unlock several other tasks. Worth the effort!");
        setShow(true);
        onMessage?.("Today's focus will unlock several other tasks. Worth the effort!");
        setTimeout(() => setShow(false), 8000);
        return;
      }
    }
  };

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-30"
        >
          <Card className="p-4 bg-card/95 backdrop-blur-lg border-primary/20 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {icon}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {message}
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

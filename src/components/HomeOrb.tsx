import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { processInput, ProcessInputResult } from "@/lib/api/processInput";
import { fetchDailyPlan, DailyPlan } from "@/lib/ai/fetchDailyPlan";
import { fetchDailyAlerts, DailyAlerts } from "@/lib/ai/fetchDailyAlerts";
import { useAttentionTracker } from "@/state/attentionTracker";

interface HomeOrbProps {
  onCapture?: () => void;
  isRecording?: boolean;
  status?: 'ready' | 'listening' | 'processing' | 'speaking';
  recordingDuration?: number;
  onAISummaryUpdate?: (summary: AISummary | null) => void;
  onAIPlanUpdate?: (plan: DailyPlan | null) => void;
  onAIAlertsUpdate?: (alerts: DailyAlerts | null) => void;
}

interface AISummary {
  decisions: string[];
  ideas: string[];
  clarifyingQuestions: string[];
  emotion: string;
  focus: string | null;
}

interface DailyCommandCenterResponse {
  headline?: string;
}

export const HomeOrb = ({ 
  onCapture, 
  isRecording = false, 
  status = 'ready', 
  recordingDuration = 0,
  onAISummaryUpdate,
  onAIPlanUpdate,
  onAIAlertsUpdate
}: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [headline, setHeadline] = useState<string | null>(null);
  const [showBillboard, setShowBillboard] = useState(false);
  const [interruptionAlert, setInterruptionAlert] = useState<string | null>(null);
  
  const { getMinutesAway, lastFocusedTaskId } = useAttentionTracker();

  // Example: Call processInput when you have text input
  // This would typically be triggered after voice transcription or text input
  const handleProcessInput = async (text: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await processInput({
        text,
        userId: user.id,
      });

      // Extract AI summary
      const aiSummary: AISummary = {
        decisions: result.decisions,
        ideas: result.ideas,
        clarifyingQuestions: result.clarifyingQuestions,
        emotion: result.emotion,
        focus: result.contextSummary?.totalTasks ? `${result.contextSummary.totalTasks} tasks` : null,
      };

      // Pass it up to parent component
      if (onAISummaryUpdate) {
        onAISummaryUpdate(aiSummary);
      }

      // Refresh daily plan after processing input
      const updatedPlan = await fetchDailyPlan(user.id);
      if (onAIPlanUpdate) {
        onAIPlanUpdate(updatedPlan);
      }

      // Refresh daily alerts after processing input
      const alerts = await fetchDailyAlerts();
      if (onAIAlertsUpdate) {
        onAIAlertsUpdate(alerts);
      }

      // You can also use result.tasks to create tasks, result.routing for categorization, etc.
    } catch (error) {
      console.error('Failed to process input:', error);
    }
  };

  // Fetch daily command center data for headline only
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch daily command center data
      const { data: commandData, error } = await supabase.functions.invoke<DailyCommandCenterResponse>(
        'daily-command-center',
        { body: { mode: 'home_screen' } }
      );

      if (!error && commandData?.headline) {
        setHeadline(commandData.headline);
        // Show billboard after 2 seconds if there's a headline
        setTimeout(() => setShowBillboard(true), 2000);
      }
    };

    fetchData();
  }, []);

  // Check focus drift every 5 minutes
  useEffect(() => {
    if (!lastFocusedTaskId) return;

    const checkFocusDrift = () => {
      const minutesAway = getMinutesAway();
      if (minutesAway > 30) {
        setInterruptionAlert("You drifted away from your top priority. Want to resume?");
      } else {
        setInterruptionAlert(null);
      }
    };

    // Initial check
    checkFocusDrift();

    // Check every 5 minutes
    const interval = setInterval(checkFocusDrift, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [lastFocusedTaskId, getMinutesAway]);

  // All states use warm golden palette - only animation intensity changes
  const orbGradient = "radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9), rgba(247, 217, 141, 0.8) 50%, rgba(237, 197, 101, 0.7))";
  const orbGlow = "rgba(247, 217, 141, 0.5)";

  return (
    <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center">
      {/* Interruption Alert */}
      <AnimatePresence>
        {interruptionAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-foreground/80 max-w-md px-4">
              {interruptionAlert}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Billboard Message - Auto-hide after 5 seconds */}
      <AnimatePresence>
        {showBillboard && headline && !interruptionAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center"
            onAnimationComplete={() => {
              // Auto-hide after 5 seconds
              setTimeout(() => setShowBillboard(false), 5000);
            }}
          >
            <p className="text-sm text-muted-foreground max-w-md px-4">
              {headline}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main Orb */}
      <motion.button
        onClick={onCapture}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative group cursor-pointer"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Outer glow layer - subtle breathing pulse when recording */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[60px]"
          style={{
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.5) 0%, rgba(247, 217, 141, 0.15) 70%, transparent 100%)",
            width: "320px",
            height: "320px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.12, 1] : (isHovered ? [1, 1.1, 1] : [1, 1.05, 1]),
            opacity: isRecording ? [0.7, 0.95, 0.7] : (isHovered ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4]),
          }}
          transition={{
            duration: isRecording ? 2 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[40px]"
          style={{
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.7) 0%, rgba(247, 217, 141, 0.25) 60%, transparent 100%)",
            width: "240px",
            height: "240px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.1, 1] : (isHovered ? [1, 1.08, 1] : [1, 1.05, 1]),
            opacity: isRecording ? [0.85, 1, 0.85] : (isHovered ? [0.7, 0.9, 0.7] : [0.5, 0.7, 0.5]),
          }}
          transition={{
            duration: isRecording ? 1.8 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Core orb - consistent golden with gentle breathing */}
        <motion.div
          className="relative rounded-full shadow-2xl"
          style={{
            width: "180px",
            height: "180px",
            background: orbGradient,
            boxShadow: `0 8px 32px ${orbGlow}, inset 0 2px 8px rgba(255, 255, 255, 0.3)`,
          }}
          animate={isRecording ? {
            scale: [1, 1.03, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.button>

      {/* Status and timer text */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <motion.p
          className="text-xl font-mono tracking-wide"
          style={{ color: "rgba(128, 128, 128, 0.7)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: status === 'listening' ? [0.7, 1, 0.7] : 1, 
            y: 0,
          }}
          transition={{ 
            delay: 0.4,
            opacity: {
              duration: 2,
              repeat: status === 'listening' ? Infinity : 0,
              ease: "easeInOut"
            }
          }}
        >
          {status === 'listening' && 'Listening...'}
          {status === 'processing' && 'Processing...'}
          {status === 'speaking' && 'Speaking...'}
          {status === 'ready' && "What's on your mind?"}
        </motion.p>
        
        {status === 'listening' && recordingDuration > 0 && (
          <motion.p
            className="text-sm font-mono"
            style={{ color: "rgba(128, 128, 128, 0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {Math.floor(recordingDuration / 1000)}s
          </motion.p>
        )}
      </div>
    </div>
  );
};

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { processInput } from "@/lib/api/processInput";
import { fetchDailyPlan, DailyPlan } from "@/lib/ai/fetchDailyPlan";
import { fetchDailyAlerts, DailyAlerts } from "@/lib/ai/fetchDailyAlerts";
import { useAttentionTracker } from "@/state/attentionTracker";
import { ThinkWithMe } from "@/components/ThinkWithMe";
import { Button } from "@/components/ui/button";
import { Brain, Plus } from "lucide-react";
import { usePersonalFeed } from "@/hooks/usePersonalFeed";
import { PersonalFeedMessage } from "@/components/PersonalFeedMessage";
import { StaleTasksPopup } from "@/components/StaleTasksPopup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [interruptionAlert, setInterruptionAlert] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [taskText, setTaskText] = useState("");
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  
  const { getMinutesAway, lastFocusedTaskId } = useAttentionTracker();
  const { currentFeed, showFeed } = usePersonalFeed();

  const handleOrbTouchStart = () => {
    setIsLongPress(false);
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      if (onCapture) {
        onCapture();
      }
    }, 500); // 500ms for long press
  };

  const handleOrbTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    // If it wasn't a long press, show text input
    if (!isLongPress) {
      setShowTextInput(true);
    }
    setIsLongPress(false);
  };

  const handleOrbClick = () => {
    // On desktop, always show text input
    const isMobile = 'ontouchstart' in window;
    if (!isMobile) {
      setShowTextInput(true);
    }
  };

  const handleTextSubmit = async () => {
    if (!taskText.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await processInput({
        text: taskText,
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

      if (onAISummaryUpdate) {
        onAISummaryUpdate(aiSummary);
      }

      const updatedPlan = await fetchDailyPlan(user.id);
      if (onAIPlanUpdate) {
        onAIPlanUpdate(updatedPlan);
      }

      const alerts = await fetchDailyAlerts();
      if (onAIAlertsUpdate) {
        onAIAlertsUpdate(alerts);
      }

      toast.success("Task added");
      setTaskText("");
      setShowTextInput(false);
    } catch (error) {
      console.error('Failed to process input:', error);
      toast.error("Failed to add task");
    }
  };


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

    checkFocusDrift();
    const interval = setInterval(checkFocusDrift, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lastFocusedTaskId, getMinutesAway]);

  return (
    <>
      {/* Fixed position elements - don't interfere with layout */}
      {currentFeed && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
          <PersonalFeedMessage
            insight={currentFeed.insight}
            pattern={currentFeed.pattern}
            flashback={currentFeed.flashback}
            show={showFeed}
          />
        </div>
      )}
      
      <div className="fixed bottom-20 right-6 z-30">
        <StaleTasksPopup />
      </div>
      
      {interruptionAlert && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-foreground/80 max-w-md px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border">
              {interruptionAlert}
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Orb Container */}
      <div className="flex flex-col items-center">
        {/* Orb - brand icon, no background effects */}
        <motion.button
          onClick={handleOrbClick}
          onTouchStart={handleOrbTouchStart}
          onTouchEnd={handleOrbTouchEnd}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="relative cursor-pointer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div 
            className="rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: '160px',
              height: '160px',
              maxWidth: '22vw',
              background: 'none',
              padding: 0,
            }}
          >
            <img 
              src="/brand/orb_main.png" 
              alt="Malunita Orb"
              className="w-full h-full object-cover rounded-full block"
            />
          </div>
        </motion.button>

        {/* Status text - 24px below orb */}
        <div 
          className="flex flex-col items-center"
          style={{ marginTop: '24px' }}
        >
          {status !== 'ready' ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: '18px',
                fontFamily: 'IBM Plex Mono, monospace',
                opacity: 0.45,
                textAlign: 'center',
              }}
            >
              {status === 'listening' && 'Listening...'}
              {status === 'processing' && 'Processing...'}
              {status === 'speaking' && 'Speaking...'}
            </motion.p>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '18px',
                fontFamily: 'IBM Plex Mono, monospace',
                opacity: 0.45,
                textAlign: 'center',
              }}
            >
              What's on your mind?
            </motion.p>
          )}
          
          {/* Timer for listening state */}
          {status === 'listening' && recordingDuration > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '14px',
                fontFamily: 'IBM Plex Mono, monospace',
                opacity: 0.35,
                marginTop: '8px',
              }}
            >
              {Math.floor(recordingDuration / 1000)}s
            </motion.p>
          )}

          {/* Think With Me Button - 24px below text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: '24px' }}
          >
            <ThinkWithMe
              trigger={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background border-border/40"
                >
                  <Brain className="w-4 h-4" />
                  <span>Think With Me</span>
                </Button>
              }
            />
          </motion.div>
        </div>
      </div>

      {/* Text Input Dialog */}
      <Dialog open={showTextInput} onOpenChange={setShowTextInput}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a task</DialogTitle>
            <DialogDescription>
              What's on your mind?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                }
              }}
              placeholder="Type your task..."
              autoFocus
            />
            <Button onClick={handleTextSubmit} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

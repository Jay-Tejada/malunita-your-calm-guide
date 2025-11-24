import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HomeOrbProps {
  onCapture?: () => void;
  isRecording?: boolean;
  status?: 'ready' | 'listening' | 'processing' | 'speaking';
  recordingDuration?: number;
  onDataLoaded?: (data: {
    oneThing: string | null;
    quickWins: Array<{ id: string; title: string }>;
    focusMessage: string | null;
    dailySummary: string | null;
  }) => void;
}

interface DailyCommandCenterResponse {
  oneThing?: string;
  quickWins?: Array<{ id: string; title: string }>;
  focusMessage?: string;
  dailySummary?: string;
  headline?: string;
}

export const HomeOrb = ({ onCapture, isRecording = false, status = 'ready', recordingDuration = 0, onDataLoaded }: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [oneThing, setOneThing] = useState<string | null>(null);
  const [quickWins, setQuickWins] = useState<Array<{ id: string; title: string }>>([]);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [headline, setHeadline] = useState<string | null>(null);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(true);
  const [showOneThingPrompt, setShowOneThingPrompt] = useState(false);
  const [oneThingInput, setOneThingInput] = useState("");
  const [showBillboard, setShowBillboard] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user and daily command center data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Check if user has answered today's one thing
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAnswer } = await supabase
        .from('daily_one_thing')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setHasAnsweredToday(!!existingAnswer);

      // Fetch daily command center data
      const { data: commandData, error } = await supabase.functions.invoke<DailyCommandCenterResponse>(
        'daily-command-center',
        { body: { mode: 'home_screen' } }
      );

      if (!error && commandData) {
        setOneThing(commandData.oneThing || null);
        setQuickWins(commandData.quickWins || []);
        setFocusMessage(commandData.focusMessage || null);
        setDailySummary(commandData.dailySummary || null);
        setHeadline(commandData.headline || null);

        // Notify parent component
        if (onDataLoaded) {
          onDataLoaded({
            oneThing: commandData.oneThing || null,
            quickWins: commandData.quickWins || [],
            focusMessage: commandData.focusMessage || null,
            dailySummary: commandData.dailySummary || null,
          });
        }

        // Show billboard after 2 seconds if there's a headline
        if (commandData.headline) {
          setTimeout(() => setShowBillboard(true), 2000);
        }
      }
    };

    fetchData();
  }, [onDataLoaded]);

  const handleSaveOneThing = async () => {
    if (!oneThingInput.trim() || !userId) return;

    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_one_thing')
      .insert({
        user_id: userId,
        date: today,
        text: oneThingInput.trim(),
      });

    setHasAnsweredToday(true);
    setShowOneThingPrompt(false);
    setOneThingInput("");
  };

  // All states use warm golden palette - only animation intensity changes
  const orbGradient = "radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9), rgba(247, 217, 141, 0.8) 50%, rgba(237, 197, 101, 0.7))";
  const orbGlow = "rgba(247, 217, 141, 0.5)";

  return (
    <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center">
      {/* Billboard Message */}
      <AnimatePresence>
        {showBillboard && headline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-muted-foreground max-w-md px-4">
              {headline}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One Thing Prompt */}
      {!hasAnsweredToday && (
        <div className="mb-4">
          <button
            onClick={() => setShowOneThingPrompt(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
          >
            What is the ONE task that would make today a success?
          </button>
        </div>
      )}

      {/* One Thing Modal */}
      <Dialog open={showOneThingPrompt} onOpenChange={setShowOneThingPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your ONE Thing for Today</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={oneThingInput}
              onChange={(e) => setOneThingInput(e.target.value)}
              placeholder="What's the ONE task that would make today a success?"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveOneThing()}
            />
            <Button onClick={handleSaveOneThing} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

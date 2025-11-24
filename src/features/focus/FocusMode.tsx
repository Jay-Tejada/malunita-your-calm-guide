import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanionVisual } from '@/components/CompanionVisual';
import { HelperBubble, createMessageQueue } from '@/components/HelperBubble';
import { useLevelSystem, XP_REWARDS } from '@/state/levelSystem';
import { useEmotionalMemory, EMOTIONAL_EVENTS } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { playSfx } from '@/utils/sound';
import { questTracker } from '@/lib/questTracker';
import { useSeasonalEvent } from '@/hooks/useSeasonalEvent';

interface FocusModeProps {
  onClose: () => void;
}

type AudioOption = 'forest' | 'bells' | 'silent';

interface FocusSession {
  startTime: number;
  duration: number;
  isPaused: boolean;
  pausedTime: number;
  elapsedBeforePause: number;
}

export const FocusMode = ({ onClose }: FocusModeProps) => {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [audioOption, setAudioOption] = useState<AudioOption>('silent');
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  
  const messageQueueRef = useRef(createMessageQueue(setHelperMessage));
  const { grantXp } = useLevelSystem();
  const { adjustJoy, adjustStress } = useEmotionalMemory();
  const { updateMood } = useMoodStore();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const { getSeasonalMultiplier, currentSeason } = useSeasonalEvent();

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Load interrupted session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('focus_session');
    if (savedSession) {
      try {
        const parsed: FocusSession = JSON.parse(savedSession);
        const elapsed = parsed.elapsedBeforePause + (parsed.isPaused ? 0 : Date.now() - parsed.startTime);
        const remaining = parsed.duration - elapsed;
        
        if (remaining > 0) {
          messageQueueRef.current.enqueue("Want to continue where we left off?");
          setSession(parsed);
          setTimeLeft(Math.floor(remaining / 1000));
          setSelectedDuration(parsed.duration);
        } else {
          localStorage.removeItem('focus_session');
        }
      } catch (e) {
        localStorage.removeItem('focus_session');
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  // Save session to localStorage
  useEffect(() => {
    if (session && isActive) {
      localStorage.setItem('focus_session', JSON.stringify(session));
    }
  }, [session, isActive]);

  const startTimer = (minutes: number) => {
    const durationMs = minutes * 60 * 1000;
    const newSession: FocusSession = {
      startTime: Date.now(),
      duration: durationMs,
      isPaused: false,
      pausedTime: 0,
      elapsedBeforePause: 0,
    };
    
    setSession(newSession);
    setSelectedDuration(durationMs);
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsPaused(false);
    
    updateMood('neutral');
    messageQueueRef.current.enqueue("Let's focus together!");
    playSfx('happy', true);
    
    // Track quest progress for focus session
    questTracker.trackFocusSession();
  };

  const resumeSession = () => {
    if (session) {
      const newSession: FocusSession = {
        ...session,
        startTime: Date.now(),
        isPaused: false,
        pausedTime: 0,
      };
      setSession(newSession);
      setIsActive(true);
      setIsPaused(false);
      updateMood('neutral');
      toast({ title: "Resumed", description: "Let's keep going!" });
    }
  };

  const pauseTimer = () => {
    if (session) {
      const elapsed = session.elapsedBeforePause + (Date.now() - session.startTime);
      const newSession: FocusSession = {
        ...session,
        isPaused: true,
        pausedTime: Date.now(),
        elapsedBeforePause: elapsed,
      };
      setSession(newSession);
      setIsPaused(true);
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    localStorage.removeItem('focus_session');
    
    // Rewards with seasonal bonus
    const xpMultiplier = getSeasonalMultiplier('xp');
    const joyMultiplier = getSeasonalMultiplier('joy');
    const baseXp = 20;
    const finalXp = Math.round(baseXp * xpMultiplier);
    
    updateMood('loving');
    adjustJoy(Math.round(15 * joyMultiplier));
    adjustStress(-10);
    
    if (userId) {
      const { evolved, leveledUp } = await grantXp(finalXp, userId);
      
      if (evolved) {
        toast({
          title: "Evolution! ✨",
          description: "Malunita evolved during your focus session!",
          duration: 5000,
        });
      } else if (leveledUp) {
        toast({
          title: "Level Up! ✨",
          description: "Great work! You leveled up during focus!",
        });
      }
    }
    
    messageQueueRef.current.enqueue("I'm proud of you! You stayed focused!");
    playSfx('sparkle', true);
    
    const bonusText = xpMultiplier > 1 ? ` (${currentSeason?.name} bonus!)` : '';
    toast({
      title: "Focus Complete!",
      description: `Great work! +${finalXp} XP${bonusText}`,
    });
    
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleEarlyExit = () => {
    if (isActive && timeLeft > 0) {
      updateMood('neutral');
      adjustStress(5);
      messageQueueRef.current.enqueue("That's okay, we can try again later.");
      localStorage.removeItem('focus_session');
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioOptions: { value: AudioOption; label: string }[] = [
    { value: 'forest', label: '🌲 Forest' },
    { value: 'bells', label: '🔔 Soft Bells' },
    { value: 'silent', label: '🔇 Silent' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* Dimmed background with subtle texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEarlyExit}
          className="absolute top-0 right-0"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Malunita with breathing animation */}
        {/* CompanionVisual - COMMENTED OUT - now lives in CompanionSidebar */}
        {/* <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-4"
        >
          <CompanionVisual
            emotion="neutral"
            motion="idle"
            size="xl"
            className="animate-float-idle"
          />
        </motion.div> */}

        {/* Helper bubble */}
        <AnimatePresence>
          {helperMessage && (
            <HelperBubble
              message={helperMessage}
              onDismiss={() => setHelperMessage(null)}
            />
          )}
        </AnimatePresence>

        {/* Focus card */}
        <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-6 space-y-6">
            {!isActive ? (
              <>
                {/* Continue interrupted session */}
                {session && timeLeft > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      You have an unfinished session ({formatTime(timeLeft)} remaining)
                    </p>
                    <Button
                      onClick={resumeSession}
                      className="w-full"
                      variant="default"
                    >
                      Continue Session
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or start new</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timer selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-center">Choose your focus time</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => startTimer(25)}
                      variant="outline"
                      className="h-20 text-lg"
                    >
                      25 min
                    </Button>
                    <Button
                      onClick={() => startTimer(45)}
                      variant="outline"
                      className="h-20 text-lg"
                    >
                      45 min
                    </Button>
                  </div>
                  
                  {/* Custom duration */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Custom (minutes)"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      min="1"
                      max="180"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        const mins = parseInt(customDuration);
                        if (mins > 0 && mins <= 180) {
                          startTimer(mins);
                        }
                      }}
                      disabled={!customDuration || parseInt(customDuration) <= 0}
                    >
                      Start
                    </Button>
                  </div>
                </div>

                {/* Audio options */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Background audio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {audioOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={audioOption === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAudioOption(option.value)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Active timer */}
                <div className="text-center space-y-4">
                  <motion.div
                    key={timeLeft}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-light tabular-nums"
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '100%' }}
                      animate={{
                        width: `${(timeLeft / (selectedDuration! / 1000)) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => isPaused ? resumeSession() : pauseTimer()}
                      variant="outline"
                      size="lg"
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    <Button
                      onClick={handleEarlyExit}
                      variant="ghost"
                      size="lg"
                    >
                      End
                    </Button>
                  </div>

                  {/* Audio indicator */}
                  {audioOption !== 'silent' && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      {audioOption === 'forest' ? '🌲' : '🔔'} {audioOptions.find(o => o.value === audioOption)?.label}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

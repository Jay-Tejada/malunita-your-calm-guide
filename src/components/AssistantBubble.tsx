import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useMoodStore } from '@/state/moodMachine';
import { detectMoodFromMessage } from '@/state/moodMachine';
import { Heart, Mic, MicOff } from 'lucide-react';
import { startVoiceInput, stopVoiceInput, isVoiceInputSupported } from '@/utils/voiceInput';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { HelperBubble, createMessageQueue, MOOD_MESSAGES, ACTION_MESSAGES } from '@/components/HelperBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import type { Mood } from '@/state/moodMachine';
import { playSfx } from '@/utils/sound';
import { useLevelSystem, XP_REWARDS } from '@/state/levelSystem';
import { supabase } from '@/integrations/supabase/client';
import { greetUser } from '@/utils/greetings';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { getPredictedHabit, updateHabitMemoryScore } from '@/ai/habitPredictor';

interface AssistantBubbleProps {
  onOpenChat?: () => void;
  className?: string;
  typing?: boolean; // When AI is generating a response
}

const AssistantBubble = ({ onOpenChat, className = '', typing = false }: AssistantBubbleProps) => {
  const { mood, updateMood, recordInteraction, increaseEnergy, decreaseEnergy } = useMoodStore();
  const { grantXp, level } = useLevelSystem();
  const [idleAnimation, setIdleAnimation] = useState<'none' | 'wink' | 'bounce' | 'look'>('none');
  const [showHearts, setShowHearts] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const messageQueueRef = useRef(createMessageQueue(setHelperMessage));
  const prevMoodRef = useRef<Mood>(mood);
  
  // TODO: Connect to user profile settings
  const soundEnabled = true; // userProfile?.soundEffectsEnabled ?? true;

  // Get current user and show greeting on mount
  useEffect(() => {
    const initializeUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        
        // Load profile data for greeting context
        const { data: profile } = await supabase
          .from('profiles')
          .select('task_completion_streak, updated_at, emotional_memory')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          // Load emotional memory if available
          const emotionalMemory = useEmotionalMemory.getState();
          if (profile.emotional_memory) {
            emotionalMemory.loadFromProfile(profile.emotional_memory as any);
          }
          
          // Calculate hours since last activity
          const lastActivity = profile.updated_at ? new Date(profile.updated_at) : new Date();
          const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
          
          // Show personalized greeting
          const greeting = greetUser({
            streakCount: profile.task_completion_streak || 0,
            lastActivityHours: hoursSinceActivity,
          });
          
          // Queue greeting message after a short delay
          setTimeout(() => {
            messageQueueRef.current.enqueue(greeting);
          }, 1000);
          
          // Check for habit prediction after greeting
          setTimeout(async () => {
            try {
              const prediction = await getPredictedHabit();
              if (prediction && prediction.confidence >= 0.65) {
                messageQueueRef.current.enqueue(prediction.suggestion);
                
                // Update emotional memory based on consistency
                if (prediction.consistencyScore) {
                  updateHabitMemoryScore(prediction.consistencyScore);
                }
              }
            } catch (error) {
              console.error('Error getting habit prediction:', error);
            }
          }, 3000);
        }
      }
    };
    
    initializeUser();
  }, []);

  // Idle cycle behavior - random animations every 15-25 seconds
  useEffect(() => {
    // Don't idle-cycle during these moods
    if (mood === 'sleeping' || mood === 'angry' || mood === 'worried' || mood === 'sad') {
      return;
    }

    const scheduleNextIdle = () => {
      const delay = 15000 + Math.random() * 10000; // 15-25 seconds
      return setTimeout(() => {
        const animations: Array<'wink' | 'bounce' | 'look'> = ['wink', 'bounce', 'look'];
        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        setIdleAnimation(randomAnim);

        // Reset after animation plays
        setTimeout(() => setIdleAnimation('none'), 1000);
        
        scheduleNextIdle();
      }, delay);
    };

    const timer = scheduleNextIdle();
    return () => clearTimeout(timer);
  }, [mood]);

  // Heart particles when mood is loving
  useEffect(() => {
    if (mood === 'loving') {
      setShowHearts(true);
      const timer = setTimeout(() => setShowHearts(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mood]);

  // Helper bubble messages and sound effects based on mood changes
  useEffect(() => {
    // Only react when mood actually changes
    if (prevMoodRef.current !== mood) {
      // Play sound effects for mood changes
      if (mood === 'loving') {
        playSfx('sparkle', soundEnabled);
      } else if (mood === 'excited' || mood === 'overjoyed') {
        playSfx('happy', soundEnabled);
      } else if (mood === 'angry') {
        playSfx('angry', soundEnabled);
      } else if (mood === 'sleepy' || mood === 'sleeping') {
        playSfx('sleep', soundEnabled);
      }

      // Show helper messages (skip for angry/sleeping)
      if (mood !== 'angry' && mood !== 'sleeping') {
        const message = MOOD_MESSAGES[mood];
        if (message) {
          messageQueueRef.current.enqueue(message);
        }
      }
      
      prevMoodRef.current = mood;
    }
  }, [mood, soundEnabled]);

  // Inactivity nudge after 30 seconds
  useEffect(() => {
    if (mood === 'sleeping' || mood === 'angry' || listening || voiceMode) {
      return;
    }

    const inactivityTimer = setTimeout(() => {
      messageQueueRef.current.enqueue(ACTION_MESSAGES.inactivityNudge);
    }, 30000);

    return () => clearTimeout(inactivityTimer);
  }, [mood, listening, voiceMode]);

  // Voice mode toggle
  const toggleVoiceMode = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isVoiceInputSupported()) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    if (voiceMode) {
      // Stop listening
      stopVoiceInput();
      setVoiceMode(false);
      setListening(false);
    } else {
      // Start listening
      setVoiceMode(true);
      recordInteraction();
      updateMood('welcoming');
      
      try {
        await startVoiceInput({
          onTranscript: (text) => {
            console.log('Transcript received:', text);
            setVoiceMode(false);
            setListening(false);
            
            // Detect mood from transcript
            const shortPhrases = ['hmm', 'uhh', 'um', 'uh'];
            const isShortOrFiller = text.length < 10 || shortPhrases.some(p => text.toLowerCase().includes(p));
            
            if (isShortOrFiller) {
              updateMood('worried');
              decreaseEnergy(3);
            } else {
              const detectedMood = detectMoodFromMessage(text);
              updateMood(detectedMood);
              increaseEnergy(5);
            }
            
            // TODO: Send transcript to AI via onOpenChat or separate handler
            toast({
              title: "Heard you!",
              description: text,
            });
          },
          onListeningChange: (isListening) => {
            setListening(isListening);
          }
        });
      } catch (error) {
        console.error('Voice input error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to start voice input",
          variant: "destructive"
        });
        setVoiceMode(false);
        setListening(false);
      }
    }
  }, [voiceMode, recordInteraction, updateMood, increaseEnergy, decreaseEnergy, toast]);

  // Poke to wake handler with XP reward
  const handleClick = useCallback(async () => {
    if (voiceMode) return; // Don't handle click when in voice mode
    
    recordInteraction();
    playSfx('tap', soundEnabled);
    
    // Grant tap XP
    const leveledUp = await grantXp(XP_REWARDS.TAP_INTERACTION, userId || undefined);
    
    if (leveledUp) {
      updateMood('overjoyed');
      playSfx('sparkle', soundEnabled);
      toast({
        title: "Level Up! ✨",
        description: `Malunita reached level ${level + 1}!`,
      });
    }

    // Poke to wake logic
    if (mood === 'sleeping') {
      updateMood('surprised2');
    } else if (mood === 'sleepy') {
      updateMood('neutral');
    } else if (onOpenChat) {
      onOpenChat();
    }
  }, [mood, updateMood, recordInteraction, onOpenChat, voiceMode, soundEnabled, grantXp, userId, level, toast]);

  // Animation classes based on idle state
  const getAnimationClass = () => {
    switch (idleAnimation) {
      case 'bounce':
        return 'animate-[bounce_0.5s_ease-in-out]';
      case 'wink':
        return 'animate-[pulse_0.3s_ease-in-out]';
      case 'look':
        return 'animate-[swing_0.6s_ease-in-out]';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`fixed bottom-6 right-6 z-50 cursor-pointer select-none ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Helper bubble */}
      <HelperBubble 
        message={helperMessage} 
        onDismiss={() => setHelperMessage(null)}
      />

      {/* Container with glow effect */}
      <div className="relative">
        {/* Glow effect - enhanced when listening */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl animate-pulse",
          listening ? "bg-primary/40" : "bg-primary/20"
        )} />
        
        {/* Main bubble */}
        <div className={cn(
          "relative bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-2xl border-2",
          listening ? "border-primary/60" : "border-primary/30",
          getAnimationClass()
        )}>
          <CreatureSprite
            emotion={mood}
            size={90}
            animate={mood === 'neutral' || mood === 'happy'}
            listening={listening}
            typing={typing}
            onWakeUp={() => {
              updateMood('surprised2');
              increaseEnergy(5);
            }}
          />
          
          {/* Typing indicator */}
          {typing && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <TypingIndicator mood={mood} />
            </div>
          )}
        </div>

        {/* Mic button */}
        <motion.button
          onClick={toggleVoiceMode}
          className={cn(
            "absolute -bottom-2 -right-2 rounded-full p-2 shadow-lg",
            voiceMode 
              ? "bg-primary text-primary-foreground" 
              : "bg-background border-2 border-primary/30"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {voiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </motion.button>

        {/* Heart particles when loving */}
        <AnimatePresence>
          {showHearts && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    y: 0, 
                    x: 0,
                    scale: 0.5
                  }}
                  animate={{ 
                    opacity: 0, 
                    y: -60 - (i * 10), 
                    x: (Math.random() - 0.5) * 40,
                    scale: 1
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 2, 
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                >
                  <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Status indicator dot */}
        <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
      </div>
    </motion.div>
  );
};

export default AssistantBubble;

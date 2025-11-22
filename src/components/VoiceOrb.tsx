import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "./CategoryDialog";
import { Check, Sparkles } from "lucide-react";
import { PersonalityType } from "@/hooks/useCompanionIdentity";
import { useCompanionMotion } from "@/hooks/useCompanionMotion";
import { useCompanionEmotion } from "@/hooks/useCompanionEmotion";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { useVoiceReactions } from "@/hooks/useVoiceReactions";
import { useLoreMoments } from "@/hooks/useLoreMoments";
import { useCompanionCosmetics } from "@/hooks/useCompanionCosmetics";
import { CompanionHabitat } from "@/components/CompanionHabitat";
import { LoreMoment } from "@/components/LoreMoment";
import { useAudioSmoothing } from "@/hooks/useAudioSmoothing";

interface VoiceOrbProps {
  onVoiceInput?: (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
  isSaving?: boolean;
  showSuccess?: boolean;
  stopWordDetected?: boolean;
  personality?: PersonalityType;
  onTaskAdded?: () => void;
  taskStreak?: number;
  isFiestaMode?: boolean;
  companionName?: string;
  isSpeaking?: boolean;
}

type OrbMode = 'capture' | 'reflection' | 'planning' | 'quiet';

export const VoiceOrb = ({ 
  onVoiceInput, 
  onPlanningModeActivated, 
  onReflectionModeActivated, 
  onOrbReflectionTrigger, 
  isSaving = false, 
  showSuccess = false, 
  stopWordDetected = false,
  personality = 'zen',
  onTaskAdded,
  taskStreak = 0,
  isFiestaMode = false,
  companionName,
  isSpeaking = false,
}: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [smoothedAmplitude, setSmoothedAmplitude] = useState(0);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [pendingTask, setPendingTask] = useState<string>("");
  const [mode, setMode] = useState<OrbMode>('capture');
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [showReflectionTooltip, setShowReflectionTooltip] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasPlayedStopSoundRef = useRef(false);
  
  const { toast } = useToast();
  
  // Companion motion behavior
  const motion = useCompanionMotion(personality, isListening || isResponding);
  
  // Companion emotion engine
  const emotion = useCompanionEmotion(personality);
  
  // Companion growth & evolution
  const growth = useCompanionGrowth();
  
  // Hatching state management
  const [isHatching, setIsHatching] = useState(false);
  const [previousStage, setPreviousStage] = useState(growth.stage);
  
  // Voice reaction system
  const voiceReaction = useVoiceReactions(personality, companionName);
  
  // Lore moments system
  const loreMoments = useLoreMoments(growth.stage, growth.isEvolving);
  
  // Companion cosmetics
  const cosmetics = useCompanionCosmetics();
  
  // Audio smoothing for stable animations
  const audioSmoothing = useAudioSmoothing();
  
  // Detect hatching (evolution from stage 0 to 1)
  useEffect(() => {
    if (previousStage === 0 && growth.stage === 1 && growth.isEvolving) {
      setIsHatching(true);
      
      // Import and trigger confetti with personality-specific colors
      import('canvas-confetti').then((confetti) => {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          zIndex: 9999,
        };
        
        // Personality-specific colors
        const colors = personality === 'zen' 
          ? ['#60A5FA', '#93C5FD', '#67E8F9', '#A5F3FC'] // Blues and cyans
          : personality === 'spark'
          ? ['#FBBF24', '#F59E0B', '#FB923C', '#FDBA74'] // Golds and oranges
          : ['#A78BFA', '#C4B5FD', '#818CF8', '#A5B4FC']; // Purples and indigos

        function fire(particleRatio: number, opts: any) {
          confetti.default({
            ...defaults,
            ...opts,
            colors,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        // Personality-specific confetti patterns
        if (personality === 'zen') {
          // Gentle, flowing confetti
          fire(0.3, { spread: 40, startVelocity: 35, decay: 0.95 });
          fire(0.2, { spread: 60, startVelocity: 30, decay: 0.96 });
          fire(0.3, { spread: 80, startVelocity: 25, decay: 0.97 });
        } else if (personality === 'spark') {
          // Explosive, energetic confetti
          fire(0.25, { spread: 26, startVelocity: 65 });
          fire(0.2, { spread: 60, startVelocity: 55 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 45 });
        } else {
          // Mystical, spiraling confetti
          fire(0.25, { spread: 50, startVelocity: 40, gravity: 0.5 });
          fire(0.25, { spread: 70, startVelocity: 35, gravity: 0.6 });
          fire(0.3, { spread: 90, startVelocity: 30, gravity: 0.7, scalar: 1.2 });
        }
      });
      
      // Play celebratory sound with personality variation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Personality-specific melodies
      const melodies = {
        zen: [523.25, 587.33, 659.25, 783.99], // C5, D5, E5, G5 - calm progression
        spark: [659.25, 783.99, 987.77, 1174.66], // E5, G5, B5, D6 - energetic jump
        cosmo: [493.88, 587.33, 739.99, 987.77], // B4, D5, F#5, B5 - mystical interval
      };
      
      const notes = melodies[personality];
      const tempo = personality === 'spark' ? 0.12 : personality === 'zen' ? 0.18 : 0.15;
      
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * tempo);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * tempo);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * tempo + 0.3);
        
        oscillator.start(audioContext.currentTime + i * tempo);
        oscillator.stop(audioContext.currentTime + i * tempo + 0.3);
      });
      
      // Show celebratory toast with personality message
      const messages = {
        zen: '🌸 Your companion bloomed peacefully!',
        spark: '⚡ Your companion burst into life!',
        cosmo: '✨ Your companion shimmers into being!',
      };
      
      toast({
        title: messages[personality],
        description: 'A new journey begins together!',
        duration: 5000,
      });
      
      // Reset after animation
      setTimeout(() => {
        setIsHatching(false);
      }, 3000);
    }
    setPreviousStage(growth.stage);
  }, [growth.stage, growth.isEvolving, previousStage, personality, toast]);
  
  // Connect cosmetics unlock checker to growth system
  useEffect(() => {
    if (cosmetics.checkUnlocks && !growth.checkUnlocks) {
      // @ts-ignore - Adding checkUnlocks dynamically
      growth.checkUnlocks = cosmetics.checkUnlocks;
    }
  }, [cosmetics.checkUnlocks, growth]);
  
  // Get colors based on selected colorway or fallback to personality
  const getOrbColors = () => {
    // If a colorway is selected, use it
    if (cosmetics.selectedColorway && cosmetics.selectedColorway !== 'zen-default') {
      const colorwayKey = cosmetics.selectedColorway.replace(/-/g, '-');
      return {
        core: `var(--colorway-${colorwayKey}-core)`,
        glow: `var(--colorway-${colorwayKey}-glow)`,
        halo: `var(--colorway-${colorwayKey}-halo)`,
      };
    }
    
    // Fallback to personality colors
    switch (personality) {
      case 'zen':
        return {
          core: 'var(--orb-zen-core)',
          glow: 'var(--orb-zen-glow)',
          halo: 'var(--orb-zen-halo)',
        };
      case 'spark':
        return {
          core: 'var(--orb-spark-core)',
          glow: 'var(--orb-spark-glow)',
          halo: 'var(--orb-spark-halo)',
        };
      case 'cosmo':
        return {
          core: 'var(--orb-cosmo-core)',
          glow: 'var(--orb-cosmo-glow)',
          halo: 'var(--orb-cosmo-halo)',
        };
      default:
        return {
          core: 'var(--orb-core-idle)',
          glow: 'var(--orb-glow-idle)',
          halo: 'var(--orb-halo-idle)',
        };
    }
  };

  const colors = getOrbColors();

  // Trigger behaviors based on state changes
  useEffect(() => {
    if (isListening) {
      motion.triggerCurious();
      emotion.setEmotion('curious');
      voiceReaction.setListening();
    } else if (isSpeaking) {
      emotion.setEmotion('focused');
      voiceReaction.setSpeaking(true);
    } else if (isResponding || isSaving) {
      emotion.setEmotion('focused');
      voiceReaction.setThinking();
    } else {
      motion.resetToIdle();
      emotion.setEmotion('neutral');
      voiceReaction.resetToIdle();
    }
  }, [isListening, isResponding, isSaving, isSpeaking]);

  // Success wiggle
  useEffect(() => {
    if (showSuccess) {
      motion.triggerExcited();
      emotion.setEmotion('proud');
    }
  }, [showSuccess]);

  // Task streak sparkle
  useEffect(() => {
    if (taskStreak >= 5) {
      motion.triggerExcited();
      emotion.setEmotion('excited');
    } else if (taskStreak >= 3) {
      emotion.setEmotion('proud');
    }
  }, [taskStreak]);

  // Fiesta mode
  useEffect(() => {
    if (isFiestaMode) {
      motion.triggerFiesta();
    } else if (motion.motionState === 'fiesta') {
      motion.resetToIdle();
    }
  }, [isFiestaMode]);

  // Play confirmation sound when stop word is detected
  useEffect(() => {
    if (stopWordDetected && !hasPlayedStopSoundRef.current) {
      hasPlayedStopSoundRef.current = true;
      
      // Create a pleasant two-tone confirmation sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First tone (higher pitch)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.1);
      
      // Second tone (lower pitch, slightly delayed)
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.08);
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.08);
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.08);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      
      oscillator2.start(audioContext.currentTime + 0.08);
      oscillator2.stop(audioContext.currentTime + 0.25);
      
      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, 300);
    } else if (!stopWordDetected) {
      hasPlayedStopSoundRef.current = false;
    }
  }, [stopWordDetected]);

  // Determine mode based on time of day (only if auto mode is enabled)
  useEffect(() => {
    if (!autoModeEnabled) return;
    
    const checkTimeAndSetMode = () => {
      const hour = new Date().getHours();
      const newMode = (hour >= 21 || hour < 6) ? 'reflection' : 'capture';
      
      // Only trigger callbacks if mode actually changes
      if (newMode !== mode) {
        setMode(newMode);
      }
    };
    
    checkTimeAndSetMode();
    const interval = setInterval(checkTimeAndSetMode, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [autoModeEnabled, mode, toast]);

  const detectModeSwitch = (text: string): OrbMode | null => {
    const lowerText = text.toLowerCase();
    
    // Planning mode triggers
    if (lowerText.includes('planning mode') || 
        lowerText.includes('switch to planning') ||
        lowerText.includes('enter planning') ||
        lowerText.includes('focus mode')) {
      return 'planning';
    }
    
    // Reflection mode triggers
    if (lowerText.includes('reflection mode') || 
        lowerText.includes('switch to reflection') ||
        lowerText.includes('enter reflection')) {
      return 'reflection';
    }
    
    // Quiet mode triggers (maps to reflection)
    if (lowerText.includes('quiet mode') || 
        lowerText.includes('switch to quiet') ||
        lowerText.includes("i'm in quiet") ||
        lowerText.includes('enter quiet')) {
      return 'quiet';
    }
    
    // Capture mode triggers
    if (lowerText.includes('capture mode') || 
        lowerText.includes('switch to capture') ||
        lowerText.includes('normal mode') ||
        lowerText.includes('default mode')) {
      return 'capture';
    }
    
    return null;
  };

  const getModeDisplayName = (mode: OrbMode): string => {
    switch (mode) {
      case 'planning': return 'planning mode';
      case 'reflection': return 'reflection mode';
      case 'quiet': return 'quiet mode';
      default: return 'capture mode';
    }
  };

  const getModeDescription = (mode: OrbMode): string => {
    switch (mode) {
      case 'planning': return 'Focused on goals and priorities';
      case 'reflection': return 'A space for deeper thought';
      case 'quiet': return 'Listening mode for gentle input';
      default: return 'Ready to capture your tasks';
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level (0-1)
    const rawAverage = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;
    
    // Apply exponential smoothing to prevent jitter
    const smoothed = audioSmoothing.smoothAmplitude(rawAverage, 0.85);
    
    // Update smoothed amplitude for halo animation
    setSmoothedAmplitude(smoothed);
    
    // Pass smoothed value to voice reaction system
    voiceReaction.setListening(smoothed);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleMouseDown = () => {
    // Start long press timer (800ms for long press)
    const timer = setTimeout(() => {
      handleLongPress();
    }, 800);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    // Cancel long press if released early
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleLongPress = () => {
    // Show mode selector
    setShowModeSelector(true);
    setShowReflectionTooltip(false);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const handleModeSelect = (selectedMode: OrbMode) => {
    setMode(selectedMode);
    setShowModeSelector(false);
    
    // Trigger callbacks based on mode
    if (selectedMode === 'planning' && onPlanningModeActivated) {
      onPlanningModeActivated();
    } else if (selectedMode === 'reflection' && onReflectionModeActivated) {
      onReflectionModeActivated();
    }
    
    toast({
      title: `${getModeDisplayName(selectedMode)} mode`,
      description: getModeDescription(selectedMode),
    });
  };

  const handleMouseEnter = () => {
    // Show reflection tooltip if conditions are met
    const now = new Date();
    const hour = now.getHours();
    const isReflectionTime = mode === 'reflection' || mode === 'quiet' || hour >= 18;
    
    if (isReflectionTime && onOrbReflectionTrigger && !isListening && !isResponding) {
      setShowReflectionTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowReflectionTooltip(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = async () => {
    // Don't trigger recording if this was a long press
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      return;
    }
    
    if (isListening) {
      // Stop recording
      audioSmoothing.reset();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } else {
      // Start recording
      audioSmoothing.reset();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        // Set up audio analysis
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        // Start analyzing audio
        analyzeAudio();

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsListening(false);
          setIsResponding(true);

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
              setIsResponding(false);
              return;
            }

            try {
              // Get current user for usage tracking
              const { data: { user } } = await supabase.auth.getUser();
              
              console.log('Calling transcribe-audio function...');
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio }
              });

              console.log('Transcribe response:', { data, error });
              
              if (error) {
                console.error('Transcription error details:', error);
                throw error;
              }

              const transcribedText = data.text;
              
              // Check for companion name mention
              if (companionName && transcribedText.toLowerCase().includes(companionName.toLowerCase())) {
                voiceReaction.triggerNameMention();
              }
              
              // Check for mode switch command
              const detectedMode = detectModeSwitch(transcribedText);
              if (detectedMode) {
                setMode(detectedMode);
                setAutoModeEnabled(false); // Disable auto mode when user manually switches
                toast({
                  title: `${getModeDisplayName(detectedMode)} activated`,
                  description: getModeDescription(detectedMode),
                });
                
                // Trigger mode-specific actions
                if (detectedMode === 'planning') {
                  onPlanningModeActivated?.();
                } else if (detectedMode === 'reflection' || detectedMode === 'quiet') {
                  onReflectionModeActivated?.();
                }
                
                setIsResponding(false);
                return;
              }
              
              if (transcribedText) {
                // Add task immediately to inbox for instant feedback
                if (onVoiceInput) {
                  onVoiceInput(transcribedText, 'inbox');
                }
                
                // Award XP for voice capture
                await growth.addXp(1, 'Voice task captured');
                
                toast({
                  title: "Task captured",
                  description: transcribedText,
                });
                
                setIsResponding(false);
                
                // Categorize in background and update if confident
                supabase.functions.invoke('categorize-task', {
                  body: { 
                    text: transcribedText,
                    userId: user?.id
                  }
                }).then(({ data: categoryData, error: categoryError }) => {
                  if (!categoryError && categoryData?.confidence === 'high' && categoryData.category !== 'inbox') {
                    // Silently update category if AI is confident
                    console.log(`Auto-categorized as: ${categoryData.category}`);
                  }
                }).catch(err => {
                  console.error('Background categorization error:', err);
                });
              }
            } catch (error) {
              console.error('Transcription error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
              
              // Trigger misheard reaction
              voiceReaction.setMisheard();
              
              toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
              });
            } finally {
              setIsResponding(false);
            }
          };

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsListening(true);
        setIsResponding(false);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Error",
          description: "Failed to access microphone",
          variant: "destructive",
        });
      }
    }
  };

  const handleCategorySelect = (category: 'home' | 'work' | 'gym' | 'projects') => {
    if (onVoiceInput && pendingTask) {
      onVoiceInput(pendingTask, category);
      toast({
        title: "Task captured",
        description: `${pendingTask} (${category})`,
      });
    }
    setShowCategoryDialog(false);
    setPendingTask("");
  };

  const handleCategoryCancel = () => {
    setShowCategoryDialog(false);
    setPendingTask("");
    toast({
      title: "Task cancelled",
      variant: "destructive",
    });
  };

  // Orbital particles
  const OrbitalParticles = ({ active }: { active: boolean }) => (
    <>
      {/* Orbit line 1 */}
      <div className={`absolute inset-0 ${active ? 'animate-squiggle' : ''}`}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-orb-orbit opacity-20"
            style={{ transform: 'rotate(15deg)', transformOrigin: 'center' }}
          />
        </svg>
      </div>
      
      {/* Orbit line 2 */}
      <div className={`absolute inset-0 ${active ? 'animate-squiggle' : ''}`} style={{ animationDelay: '0.15s' }}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-orb-orbit opacity-15"
            style={{ transform: 'rotate(-25deg)', transformOrigin: 'center' }}
          />
        </svg>
      </div>
      
      {/* Small orbiting particles */}
      {!active && (
        <>
          <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-orb-orbit opacity-30 animate-orbit" />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-orb-orbit opacity-20 animate-orbit-reverse" />
        </>
      )}
    </>
  );

  return (
    <>
      <CategoryDialog
        open={showCategoryDialog}
        taskText={pendingTask}
        onSelectCategory={handleCategorySelect}
        onCancel={handleCategoryCancel}
      />
      <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
        <div className="flex flex-col items-center gap-6">
          {/* Response text area */}
          {isResponding && (
            <div className="mb-2 px-6 py-3 bg-card rounded-2xl shadow-lg border border-secondary animate-in fade-in duration-300">
              <p className="text-sm text-foreground max-w-xs text-center">
                Transcribing your task...
              </p>
            </div>
          )}

          {/* Voice Orb Container with Habitat */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Companion Habitat - Subtle ambient environment (behind everything) */}
            <div className="absolute -inset-20 sm:-inset-24 pointer-events-none z-0 overflow-hidden rounded-full opacity-60">
              <CompanionHabitat
                personality={personality}
                emotion={emotion.emotion}
                stage={growth.stage}
              />
            </div>
            
            {/* Lore Moments - Poetic worldbuilding text */}
            <LoreMoment 
              text={loreMoments.currentLore?.text || null}
              onDismiss={loreMoments.dismissLore}
            />
            
            {/* Reflection Tooltip */}
            {showReflectionTooltip && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg animate-in fade-in duration-200 whitespace-nowrap z-10">
                <p className="text-sm text-muted-foreground">🪞 Reflect on your week?</p>
              </div>
            )}
            
            {/* Main Orb with 3-Layer System + Motion + Evolution + Voice Reactions */}
            <div 
              className={`relative z-10 transition-all ${
                growth.stage === 0 && growth.progressToNextStage >= 0.9 ? 'animate-egg-shake' :
                growth.isEvolving ? 'animate-[evolution-bloom_3s_ease-in-out]' :
                voiceReaction.reactionState === 'listening' ? 'animate-[voice-lean-forward_0.5s_ease-out_forwards]' :
                voiceReaction.reactionState === 'thinking' ? 'animate-[voice-thinking-wobble_4s_ease-in-out_infinite]' :
                voiceReaction.reactionState === 'misheard' ? 'animate-[voice-lean-forward_0.5s_ease-out_forwards]' :
                motion.motionState === 'fiesta' ? 'animate-companion-fiesta' :
                motion.motionState === 'excited' ? 'animate-companion-wiggle' :
                motion.motionState === 'curious' ? 'animate-companion-curious' :
                motion.motionState === 'sleepy' ? 'animate-companion-sleepy' :
                motion.motionState === 'calm' ? '' :
                !isListening && !isResponding ? 'animate-companion-float' : ''
              }`}
              style={{
                '--tilt-angle': `${motion.tiltAngle}deg`,
                '--lean-angle': `${voiceReaction.config.leanAngle}deg`,
                '--halo-intensity': voiceReaction.config.haloIntensity,
                '--audio-level': voiceReaction.audioLevel,
                '--expansion': voiceReaction.config.expansionAmount,
                '--emotion-glow-intensity': emotion.config.glowIntensity * growth.stageConfig.glowIntensity,
                '--emotion-pulse-speed': `${emotion.config.pulseSpeed}ms`,
                '--emotion-color-shift': emotion.config.colorShift,
                '--emotion-motion-intensity': emotion.config.motionIntensity * growth.stageConfig.motionComplexity,
                transitionDuration: `${motion.config.transitionSpeed}ms`,
                transform: `scale(${growth.stageConfig.orbSize})`,
              } as React.CSSProperties}
            >
              
              {/* Evolution ripples */}
              {growth.isEvolving && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-[evolution-ripple_2s_ease-out]" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[evolution-ripple_2s_ease-out_0.5s]" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[evolution-ripple_2s_ease-out_1s]" />
                </div>
              )}
              
              {/* HATCHING SEQUENCE - Special dramatic effects when egg hatches */}
              {isHatching && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* ZEN PERSONALITY - Gentle Blooming */}
                  {personality === 'zen' && (
                    <>
                      {/* Soft fade-in glow */}
                      <div className="absolute -inset-20 rounded-full bg-gradient-radial from-blue-400/40 via-cyan-300/20 to-transparent animate-[zen-bloom-glow_2.5s_ease-out]" />
                      
                      {/* Petal-like expanding circles */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={`petal-${i}`}
                          className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-[zen-bloom-petal_2s_ease-out_forwards]"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                            transform: `rotate(${i * 45}deg)`,
                          }}
                        />
                      ))}
                      
                      {/* Gentle floating particles */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={`zen-particle-${i}`}
                          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/60 animate-[zen-bloom-float_3s_ease-out_forwards]"
                          style={{
                            left: '50%',
                            top: '50%',
                            '--zen-angle': `${(360 / 12) * i}deg`,
                            '--zen-distance': `${60 + Math.random() * 30}px`,
                            animationDelay: `${0.5 + i * 0.08}s`,
                          } as React.CSSProperties}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* SPARK PERSONALITY - Energetic Burst */}
                  {personality === 'spark' && (
                    <>
                      {/* Explosive flash */}
                      <div className="absolute inset-0 -inset-24 rounded-full bg-gradient-radial from-yellow-300 via-orange-400/50 to-transparent animate-[spark-burst-flash_0.8s_ease-out]" />
                      
                      {/* Energetic explosion ripples */}
                      <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-[spark-burst-ring_1s_ease-out]" />
                      <div className="absolute inset-0 rounded-full border-4 border-orange-500 animate-[spark-burst-ring_1s_ease-out_0.15s]" />
                      <div className="absolute inset-0 rounded-full border-3 border-amber-400 animate-[spark-burst-ring_1s_ease-out_0.3s]" />
                      
                      {/* Lightning-like particle burst */}
                      {Array.from({ length: 32 }).map((_, i) => {
                        const angle = (360 / 32) * i;
                        const distance = 90 + Math.random() * 50;
                        return (
                          <div
                            key={`spark-${i}`}
                            className="absolute w-2 h-2 rounded-full animate-[spark-burst-particle_0.9s_ease-out_forwards]"
                            style={{
                              left: '50%',
                              top: '50%',
                              background: `hsl(${35 + Math.random() * 25}, 100%, ${60 + Math.random() * 20}%)`,
                              boxShadow: `0 0 8px hsl(${35 + Math.random() * 25}, 100%, ${60 + Math.random() * 20}%)`,
                              '--spark-angle': `${angle}deg`,
                              '--spark-distance': `${distance}px`,
                              animationDelay: `${i * 0.02}s`,
                            } as React.CSSProperties}
                          />
                        );
                      })}
                      
                      {/* Energetic sparkles */}
                      {Array.from({ length: 20 }).map((_, i) => (
                        <Sparkles
                          key={`spark-sparkle-${i}`}
                          className="absolute w-5 h-5 text-yellow-400 animate-[spark-burst-sparkle_1.5s_ease-out_forwards]"
                          style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${10 + Math.random() * 50}%`,
                            '--sparkle-x': `${-60 + Math.random() * 120}px`,
                            '--sparkle-y': `${-80 - Math.random() * 80}px`,
                            '--sparkle-rotate': `${Math.random() * 1080}deg`,
                            animationDelay: `${i * 0.05}s`,
                          } as React.CSSProperties}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* COSMO PERSONALITY - Mystical Shimmer */}
                  {personality === 'cosmo' && (
                    <>
                      {/* Mystical expanding aura */}
                      <div className="absolute -inset-24 rounded-full bg-gradient-radial from-purple-500/30 via-indigo-500/20 to-transparent animate-[cosmo-shimmer-aura_3s_ease-out]" />
                      
                      {/* Spiral shimmer waves */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={`spiral-${i}`}
                          className="absolute inset-0 rounded-full border-2 border-purple-400/40 animate-[cosmo-shimmer-spiral_2.5s_ease-out_forwards]"
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            transform: `rotate(${i * 60}deg) scale(${1 + i * 0.1})`,
                          }}
                        />
                      ))}
                      
                      {/* Stardust particles */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const angle = (360 / 24) * i;
                        return (
                          <div
                            key={`cosmo-star-${i}`}
                            className="absolute w-1 h-1 rounded-full bg-purple-300 animate-[cosmo-shimmer-star_2.5s_ease-out_forwards]"
                            style={{
                              left: '50%',
                              top: '50%',
                              boxShadow: '0 0 6px hsl(270, 70%, 70%)',
                              '--cosmo-angle': `${angle}deg`,
                              '--cosmo-orbit': `${50 + (i % 3) * 15}px`,
                              animationDelay: `${0.4 + i * 0.06}s`,
                            } as React.CSSProperties}
                          />
                        );
                      })}
                      
                      {/* Mystical sparkle trails */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <Sparkles
                          key={`cosmo-trail-${i}`}
                          className="absolute w-4 h-4 text-purple-400 animate-[cosmo-shimmer-trail_2.5s_ease-out_forwards]"
                          style={{
                            left: `${30 + Math.random() * 40}%`,
                            top: `${20 + Math.random() * 40}%`,
                            '--trail-x': `${-40 + Math.random() * 80}px`,
                            '--trail-y': `${-60 - Math.random() * 60}px`,
                            '--trail-rotate': `${Math.random() * 360}deg`,
                            animationDelay: `${0.6 + i * 0.12}s`,
                          } as React.CSSProperties}
                        />
                      ))}
                      
                      {/* Cosmic shimmer overlay */}
                      <div className="absolute -inset-16 rounded-full animate-[cosmo-shimmer-pulse_2.5s_ease-out]" 
                        style={{
                          background: 'radial-gradient(circle, hsl(270, 60%, 50% / 0.3), hsl(250, 70%, 60% / 0.15), transparent 70%)',
                          filter: 'blur(20px)',
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              
              {/* Emotion & Stage indicators (dev only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-xs opacity-40 pointer-events-none text-center">
                  <div>{emotion.emotion} | {voiceReaction.reactionState}</div>
                  <div>Stage {growth.stage}: {growth.stageConfig.name}</div>
                  <div>{growth.xp} XP ({Math.round(growth.progressToNextStage * 100)}%)</div>
                  <div>Audio: {Math.round(voiceReaction.audioLevel * 100)}%</div>
                </div>
              )}
              
              {/* Name mention flash */}
              {voiceReaction.reactionState === 'nameMention' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-[voice-name-flash_1.5s_ease-out]" />
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-[voice-name-flash_1.5s_ease-out_0.2s]" />
                </div>
              )}
              
              {/* Task Streak Sparkles */}
              {taskStreak >= 3 && (
                <div className="absolute -inset-8 pointer-events-none">
                  <Sparkles className="absolute top-0 left-0 w-4 h-4 text-primary animate-companion-sparkle" />
                  <Sparkles className="absolute top-0 right-0 w-4 h-4 text-primary animate-companion-sparkle" style={{ animationDelay: '0.2s' }} />
                  <Sparkles className="absolute bottom-0 left-1/2 w-4 h-4 text-primary animate-companion-sparkle" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
              
              {/* Pulse Halo Listener - Smooth amplitude-responsive halo */}
              {isListening && (
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none transition-all duration-200 ease-out"
                  style={{
                    width: `${18 + (smoothedAmplitude * 8)}rem`,
                    height: `${18 + (smoothedAmplitude * 8)}rem`,
                    left: `${-5 - (smoothedAmplitude * 2)}rem`,
                    top: `${-5 - (smoothedAmplitude * 2)}rem`,
                    background: `radial-gradient(circle, hsl(${colors.halo} / ${0.12 + (smoothedAmplitude * 0.12)}) 0%, hsl(${colors.halo} / ${0.06 + (smoothedAmplitude * 0.06)}) 50%, transparent 70%)`,
                    filter: 'blur(24px)',
                    animation: smoothedAmplitude > 0.2 ? 'pulse-halo-listener 2s ease-in-out infinite' : 'pulse-halo-baseline 3s ease-in-out infinite',
                  } as React.CSSProperties}
                />
              )}
              
              {/* Layer 3: Outer Halo (ambient diffusion) - Stable background glow */}
              <div 
                className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
                  voiceReaction.reactionState === 'speaking' ? 'animate-[voice-halo-pulse_var(--voice-pulse-speed)_ease-in-out_infinite]' :
                  motion.motionState === 'calm' ? 'animate-companion-calm-glow' :
                  (isResponding || isSaving) ? 'animate-thinking-shimmer' : 
                  'animate-companion-breath'
                }`}
                style={{
                  width: `${20 * growth.stageConfig.haloRadius}rem`,
                  height: `${20 * growth.stageConfig.haloRadius}rem`,
                  left: `${-4 * growth.stageConfig.haloRadius}rem`,
                  top: `${-4 * growth.stageConfig.haloRadius}rem`,
                  '--voice-pulse-speed': `${voiceReaction.config.pulseSpeed}ms`,
                  background: (isResponding || isSaving)
                    ? `radial-gradient(circle, hsl(var(--orb-halo-thinking) / 0.25) 0%, hsl(var(--orb-halo-speaking) / 0.15) 40%, transparent 70%)`
                    : `radial-gradient(circle, hsl(${colors.halo} / 0.22) 0%, hsl(${colors.halo} / 0.08) 50%, transparent 70%)`,
                  filter: 'blur(20px)',
                  opacity: isListening ? 0.35 : `calc(0.5 + ${emotion.config.glowIntensity * growth.stageConfig.glowIntensity} * 0.25)`,
                } as React.CSSProperties}
              />
              
              {/* Layer 2: Middle Glow Ring (soft gradient) - Reacts to speaking */}
              <div 
                className={`absolute inset-0 w-24 h-24 -left-2 -top-2 rounded-full transition-all duration-700 ${
                  voiceReaction.reactionState === 'speaking' ? 'animate-[voice-speaking-heartbeat_var(--voice-pulse-speed)_ease-in-out_infinite]' :
                  isListening ? 'animate-listening-pulse' : 
                  (isResponding || isSaving) ? 'animate-thinking-shimmer' : 
                  ''
                } animate-[emotion-pulse_var(--emotion-pulse-speed)_ease-in-out_infinite]`}
                style={{
                  '--voice-pulse-speed': `${voiceReaction.config.pulseSpeed}ms`,
                  background: stopWordDetected
                    ? `radial-gradient(circle, hsl(var(--success) / 0.5) 0%, hsl(var(--success) / 0.2) 60%, transparent 100%)`
                    : isListening
                    ? `radial-gradient(circle, hsl(${colors.glow} / 0.7) 0%, hsl(${colors.glow} / 0.35) 60%, transparent 100%)`
                    : (isResponding || isSaving)
                    ? `radial-gradient(circle, hsl(var(--orb-glow-thinking) / 0.5) 0%, hsl(var(--orb-glow-speaking) / 0.25) 50%, transparent 100%)`
                    : `radial-gradient(circle, hsl(${colors.glow} / 0.45) 0%, hsl(${colors.glow} / 0.2) 60%, transparent 100%)`,
                  filter: 'blur(12px)',
                } as React.CSSProperties}
              />
              
              {/* Cosmic particles for higher stages */}
              {growth.stage >= 3 && (
                <div className="absolute -inset-16 pointer-events-none">
                  {Array.from({ length: growth.stageConfig.particleCount }).map((_, i) => {
                    const angle = (360 / growth.stageConfig.particleCount) * i;
                    const x = Math.cos((angle * Math.PI) / 180) * 60;
                    const y = Math.sin((angle * Math.PI) / 180) * 60;
                    return (
                      <div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-primary/40 animate-[evolution-particles_4s_ease-in-out_infinite]"
                        style={{
                          left: '50%',
                          top: '50%',
                          '--particle-x': `${x}px`,
                          '--particle-y': `${y}px`,
                          animationDelay: `${i * 0.3}s`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Thinking sparkles - rare tiny blinks */}
              {voiceReaction.reactionState === 'thinking' && (
                <div className="absolute -inset-8 pointer-events-none">
                  <div className="absolute top-2 left-2 w-1 h-1 rounded-full bg-primary/60 animate-[voice-sparkle-blink_5s_ease-in-out_infinite]" />
                  <div className="absolute top-4 right-6 w-1 h-1 rounded-full bg-primary/50 animate-[voice-sparkle-blink_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
                  <div className="absolute bottom-3 left-8 w-1 h-1 rounded-full bg-primary/40 animate-[voice-sparkle-blink_7s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
                </div>
              )}
              
              {/* Success ripple effect when stop word detected */}
              {stopWordDetected && (
                <>
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success animate-tap-ripple" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success animate-tap-ripple" style={{ animationDelay: '0.15s' }} />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-success/60 animate-tap-ripple" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              
              {/* Orbital lines and particles when NOT recording */}
              {!isListening && (
                <div className="absolute inset-0 w-32 h-32 -left-6 -top-6 opacity-30">
                  <OrbitalParticles active={false} />
                </div>
              )}
              
              {/* Layer 1: Inner Core (solid button) */}
              <button
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                className={`relative w-20 h-20 rounded-full transition-all duration-700 ease-in-out backdrop-blur-sm
                  ${voiceReaction.reactionState === 'speaking' 
                    ? 'animate-[voice-speaking-heartbeat_var(--voice-pulse-speed)_ease-in-out_infinite]'
                    : stopWordDetected
                    ? 'scale-105'
                    : isListening 
                    ? 'scale-105' 
                    : (isResponding || isSaving)
                    ? 'animate-speaking-vibrate'
                    : 'hover:scale-105 animate-companion-breath'
                  }`}
                style={{
                  '--voice-pulse-speed': `${voiceReaction.config.pulseSpeed}ms`,
                  '--expansion': voiceReaction.config.expansionAmount,
                  background: stopWordDetected
                    ? `linear-gradient(135deg, hsl(var(--success) / 0.95), hsl(var(--success) / 0.85))`
                    : voiceReaction.reactionState === 'speaking'
                    ? `linear-gradient(135deg, hsl(39 70% 75% / 0.95), hsl(39 75% 65% / 0.85))` // Warm golden for speaking
                    : isListening 
                    ? `linear-gradient(135deg, hsl(${colors.core} / 0.95), hsl(${colors.glow} / 0.85))`
                    : (isResponding || isSaving)
                    ? `linear-gradient(135deg, hsl(var(--orb-core-thinking) / 0.9), hsl(var(--orb-core-speaking) / 0.85))`
                    : `linear-gradient(135deg, hsl(${colors.core} / 0.92), hsl(${colors.glow} / 0.88))`,
                  boxShadow: stopWordDetected
                    ? '0 8px 24px hsl(var(--success) / 0.35), inset 0 1px 0 hsl(var(--success) / 0.5), inset 0 -1px 0 hsl(var(--success) / 0.3)'
                    : voiceReaction.reactionState === 'speaking'
                    ? '0 8px 28px hsl(39 75% 65% / 0.4), inset 0 1px 0 hsl(39 70% 75% / 0.6), inset 0 -1px 0 hsl(39 75% 65% / 0.5)'
                    : isListening 
                    ? `0 6px 20px hsl(${colors.glow} / 0.35), inset 0 1px 0 hsl(${colors.core} / 0.6), inset 0 -1px 0 hsl(${colors.glow} / 0.4)`
                    : (isResponding || isSaving)
                    ? '0 6px 18px hsl(var(--orb-glow-thinking) / 0.25), inset 0 1px 0 hsl(var(--orb-core-thinking) / 0.5), inset 0 -1px 0 hsl(var(--orb-glow-speaking) / 0.3)'
                    : `0 4px 16px hsl(${colors.glow} / 0.22), inset 0 1px 0 hsl(${colors.core} / 0.5), inset 0 -1px 0 hsl(${colors.glow} / 0.3)`,
                  border: '1px solid',
                  borderColor: stopWordDetected
                    ? 'hsl(var(--success) / 0.3)'
                    : voiceReaction.reactionState === 'speaking'
                    ? 'hsl(39 75% 65% / 0.4)'
                    : isListening
                    ? `hsl(${colors.glow} / 0.35)`
                    : (isResponding || isSaving)
                    ? 'hsl(var(--orb-glow-thinking) / 0.25)'
                    : `hsl(${colors.glow} / 0.3)`,
                } as React.CSSProperties}
              >
                {/* Blink overlay */}
                {motion.shouldBlink && !isListening && !isResponding && (
                  <div 
                    className="absolute inset-0 rounded-full bg-foreground/20 animate-companion-blink"
                  />
                )}
                
                {/* Egg cracks - Only show for stage 0 (Seed/Egg) */}
                {growth.stage === 0 && !isListening && !isResponding && (
                  <>
                    {/* First crack - appears at 20% progress (10 XP) */}
                    {growth.progressToNextStage >= 0.2 && (
                      <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-500">
                        <svg className="w-full h-full" viewBox="0 0 80 80">
                          <path
                            d="M 40 15 Q 42 25, 40 35"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-foreground/30"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {/* Second crack - appears at 40% progress (20 XP) */}
                    {growth.progressToNextStage >= 0.4 && (
                      <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-500">
                        <svg className="w-full h-full" viewBox="0 0 80 80">
                          <path
                            d="M 25 30 Q 30 38, 35 45"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-foreground/35"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {/* Third crack - appears at 60% progress (30 XP) */}
                    {growth.progressToNextStage >= 0.6 && (
                      <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-500">
                        <svg className="w-full h-full" viewBox="0 0 80 80">
                          <path
                            d="M 55 25 Q 52 35, 50 45"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-foreground/40"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {/* Fourth crack - appears at 80% progress (40 XP) */}
                    {growth.progressToNextStage >= 0.8 && (
                      <div className="absolute inset-0 pointer-events-none animate-in fade-in duration-500">
                        <svg className="w-full h-full" viewBox="0 0 80 80">
                          <path
                            d="M 35 50 Q 40 55, 42 62"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-foreground/45"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                    
                    {/* Glow effect inside cracks at high progress (90%+) */}
                    {growth.progressToNextStage >= 0.9 && (
                      <div className="absolute inset-0 pointer-events-none animate-pulse">
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, hsl(${colors.glow} / 0.15), transparent 70%)`,
                            animation: 'pulse 2s ease-in-out infinite'
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {/* Center indicator */}
                {isListening && !stopWordDetected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full animate-listening-pulse" 
                      style={{
                        background: `radial-gradient(circle, hsl(${colors.glow} / 0.9), hsl(${colors.core} / 0.7))`,
                        boxShadow: `0 0 12px hsl(${colors.glow} / 0.6), inset 0 0 6px hsl(${colors.glow} / 0.4)`
                      }}
                    />
                  </div>
                )}

                {/* Stop word detected indicator */}
                {stopWordDetected && isListening && (
                  <div className="absolute inset-0 flex items-center justify-center animate-in scale-in duration-200">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-companion-breath">
                        <Check className="w-6 h-6 text-primary" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Success checkmark */}
                {showSuccess && !isListening && !isResponding && !isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center animate-in scale-in duration-300">
                    <div className="relative">
                      <Check className="w-10 h-10 text-foreground" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Idle state - soft glow with subtle pulse */}
                {!isListening && !isResponding && !isSaving && !showSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full animate-companion-breath" 
                      style={{
                        background: `radial-gradient(circle, hsl(var(--foreground) / 0.5), hsl(var(--foreground) / 0.3))`,
                      }}
                    />
                  </div>
                )}

                {/* Processing spinner when responding or saving */}
                {(isResponding || isSaving) && (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin" 
                      style={{
                        borderColor: 'hsl(var(--orb-glow-thinking) / 0.3)',
                        borderTopColor: 'hsl(var(--orb-core-thinking) / 0.8)',
                      }}
                    />
                  </div>
                )}
              </button>
            </div>

            {/* malunita text beneath orb */}
            <div className="text-center space-y-1 relative z-10">
              <p className="text-xs sm:text-sm font-serif text-foreground tracking-wide lowercase">
                malunita
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-light">
                {stopWordDetected && isListening
                  ? 'stop word detected ✓'
                  : isListening 
                  ? 'listening...' 
                  : isSaving
                  ? 'saving...'
                  : showSuccess
                  ? 'task saved!'
                  : isResponding 
                  ? 'transcribing...' 
                  : getModeDisplayName(mode)}
              </p>
              
              {/* XP Progress Bar */}
              {growth.stage < 4 && (
                <div className="w-32 mx-auto mt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/60 transition-all duration-500 rounded-full"
                      style={{ width: `${growth.progressToNextStage * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {growth.stage === 0 
                      ? `Egg • ${growth.xp}/50 XP to hatch 🥚`
                      : `${growth.stageConfig.name} • ${growth.xp}/${growth.stageConfig.maxXp} XP`
                    }
                  </p>
                </div>
              )}
              
              {/* Max stage indicator */}
              {growth.stage === 4 && (
                <p className="text-[9px] text-primary mt-1">
                  ✨ {growth.stageConfig.name} • {growth.xp} XP
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mode Selector - Long Press */}
        {showModeSelector && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
              <h3 className="text-xl font-light mb-6 text-center">Select Mode</h3>
              <div className="space-y-3">
                {(['capture', 'planning', 'reflection', 'quiet'] as OrbMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeSelect(m)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all
                      ${mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}
                    `}
                  >
                    <div className="font-medium">{getModeDisplayName(m)}</div>
                    <div className="text-sm opacity-70 mt-1">{getModeDescription(m)}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowModeSelector(false)}
                className="w-full mt-4 p-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

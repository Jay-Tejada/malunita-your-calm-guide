import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "./CategoryDialog";
import { Check } from "lucide-react";
import { PersonalityType } from "@/hooks/useCompanionIdentity";

interface VoiceOrbProps {
  onVoiceInput?: (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
  isSaving?: boolean;
  showSuccess?: boolean;
  stopWordDetected?: boolean;
  personality?: PersonalityType;
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
  personality = 'zen'
}: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
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
  // Get personality-based colors
  const getPersonalityColors = () => {
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

  const colors = getPersonalityColors();

  const { toast } = useToast();

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

    // Split frequency data into 7 bands
    const bands = 7;
    const bandSize = Math.floor(dataArray.length / bands);
    const newLevels = [];

    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      const bandData = dataArray.slice(start, end);
      const average = bandData.reduce((sum, val) => sum + val, 0) / bandData.length;
      // Normalize to 0-1 range and add a minimum height
      newLevels.push(Math.max(0.2, Math.min(1, average / 128)));
    }

    setAudioLevels(newLevels);
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

          {/* Voice Orb Container */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Reflection Tooltip */}
            {showReflectionTooltip && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg animate-in fade-in duration-200 whitespace-nowrap z-10">
                <p className="text-sm text-muted-foreground">🪞 Reflect on your week?</p>
              </div>
            )}
            
            {/* Main Orb with 3-Layer System */}
            <div className={`relative ${!isListening && !isResponding ? 'animate-companion-float' : ''}`}>
              
              {/* Layer 3: Outer Halo (ambient diffusion) */}
              <div 
                className={`absolute inset-0 w-32 h-32 -left-6 -top-6 rounded-full blur-2xl transition-all duration-1000 ${
                  isListening ? 'animate-listening-pulse' : 
                  (isResponding || isSaving) ? 'animate-thinking-shimmer' : 
                  'animate-companion-breath'
                }`}
                style={{
                  background: isListening 
                    ? `radial-gradient(circle, hsl(${colors.halo} / 0.5) 0%, hsl(${colors.halo} / 0.2) 50%, transparent 70%)`
                    : (isResponding || isSaving)
                    ? `radial-gradient(circle, hsl(var(--orb-halo-thinking) / 0.35) 0%, hsl(var(--orb-halo-speaking) / 0.2) 40%, transparent 70%)`
                    : `radial-gradient(circle, hsl(${colors.halo} / 0.3) 0%, hsl(${colors.halo} / 0.1) 50%, transparent 70%)`,
                  filter: 'blur(24px)',
                }}
              />
              
              {/* Layer 2: Middle Glow Ring (soft gradient) */}
              <div 
                className={`absolute inset-0 w-24 h-24 -left-2 -top-2 rounded-full transition-all duration-700 ${
                  isListening ? 'animate-listening-pulse' : 
                  (isResponding || isSaving) ? 'animate-thinking-shimmer' : 
                  ''
                }`}
                style={{
                  background: stopWordDetected
                    ? `radial-gradient(circle, hsl(var(--success) / 0.5) 0%, hsl(var(--success) / 0.2) 60%, transparent 100%)`
                    : isListening
                    ? `radial-gradient(circle, hsl(${colors.glow} / 0.7) 0%, hsl(${colors.glow} / 0.35) 60%, transparent 100%)`
                    : (isResponding || isSaving)
                    ? `radial-gradient(circle, hsl(var(--orb-glow-thinking) / 0.5) 0%, hsl(var(--orb-glow-speaking) / 0.25) 50%, transparent 100%)`
                    : `radial-gradient(circle, hsl(${colors.glow} / 0.45) 0%, hsl(${colors.glow} / 0.2) 60%, transparent 100%)`,
                  filter: 'blur(12px)',
                }}
              />
              
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
                  ${stopWordDetected
                    ? 'scale-105'
                    : isListening 
                    ? 'scale-105' 
                    : (isResponding || isSaving)
                    ? 'animate-speaking-vibrate'
                    : 'hover:scale-105 animate-companion-breath'
                  }`}
                style={{
                  background: stopWordDetected
                    ? `linear-gradient(135deg, hsl(var(--success) / 0.95), hsl(var(--success) / 0.85))`
                    : isListening 
                    ? `linear-gradient(135deg, hsl(${colors.core} / 0.95), hsl(${colors.glow} / 0.85))`
                    : (isResponding || isSaving)
                    ? `linear-gradient(135deg, hsl(var(--orb-core-thinking) / 0.9), hsl(var(--orb-core-speaking) / 0.85))`
                    : `linear-gradient(135deg, hsl(${colors.core} / 0.92), hsl(${colors.glow} / 0.88))`,
                  boxShadow: stopWordDetected
                    ? '0 8px 24px hsl(var(--success) / 0.35), inset 0 1px 0 hsl(var(--success) / 0.5), inset 0 -1px 0 hsl(var(--success) / 0.3)'
                    : isListening 
                    ? `0 6px 20px hsl(${colors.glow} / 0.35), inset 0 1px 0 hsl(${colors.core} / 0.6), inset 0 -1px 0 hsl(${colors.glow} / 0.4)`
                    : (isResponding || isSaving)
                    ? '0 6px 18px hsl(var(--orb-glow-thinking) / 0.25), inset 0 1px 0 hsl(var(--orb-core-thinking) / 0.5), inset 0 -1px 0 hsl(var(--orb-glow-speaking) / 0.3)'
                    : `0 4px 16px hsl(${colors.glow} / 0.22), inset 0 1px 0 hsl(${colors.core} / 0.5), inset 0 -1px 0 hsl(${colors.glow} / 0.3)`,
                  border: '1px solid',
                  borderColor: stopWordDetected
                    ? 'hsl(var(--success) / 0.3)'
                    : isListening
                    ? `hsl(${colors.glow} / 0.35)`
                    : (isResponding || isSaving)
                    ? 'hsl(var(--orb-glow-thinking) / 0.25)'
                    : `hsl(${colors.glow} / 0.3)`,
                }}
              >
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
            <div className="text-center space-y-0.5">
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

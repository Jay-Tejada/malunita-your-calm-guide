import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "./CategoryDialog";

interface VoiceOrbProps {
  onVoiceInput?: (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => void;
  onPlanningModeActivated?: () => void;
  onReflectionModeActivated?: () => void;
  onOrbReflectionTrigger?: () => void;
}

type OrbMode = 'capture' | 'reflection' | 'planning' | 'quiet';

export const VoiceOrb = ({ onVoiceInput, onPlanningModeActivated, onReflectionModeActivated, onOrbReflectionTrigger }: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [pendingTask, setPendingTask] = useState<string>("");
  const [mode, setMode] = useState<OrbMode>('capture');
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [showReflectionTooltip, setShowReflectionTooltip] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Determine mode based on time of day (only if auto mode is enabled)
  useEffect(() => {
    if (!autoModeEnabled) return;
    
    const checkTimeAndSetMode = () => {
      const hour = new Date().getHours();
      const newMode = (hour >= 21 || hour < 6) ? 'reflection' : 'capture';
      
      // Only trigger callbacks if mode actually changes
      if (newMode !== mode) {
        setMode(newMode);
        
        if (newMode === 'reflection') {
          toast({
            title: "Reflection mode activated",
            description: "Evening time for deeper thought",
          });
        }
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
    // Check if reflection trigger is available
    const now = new Date();
    const hour = now.getHours();
    const isReflectionTime = mode === 'reflection' || mode === 'quiet' || hour >= 18;
    
    if (isReflectionTime && onOrbReflectionTrigger) {
      onOrbReflectionTrigger();
      setShowReflectionTooltip(false);
    }
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
              
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

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
                // Categorize the task using AI
                const { data: categoryData, error: categoryError } = await supabase.functions.invoke('categorize-task', {
                  body: { 
                    text: transcribedText,
                    userId: user?.id
                  }
                });

                if (categoryError) {
                  console.error('Categorization error:', categoryError);
                  // If categorization fails, add task without category
                  if (onVoiceInput) {
                    onVoiceInput(transcribedText);
                  }
                  toast({
                    title: "Task captured",
                    description: transcribedText,
                  });
                } else {
                  const { category, confidence } = categoryData;
                  
                  if (confidence === 'low') {
                    // Ask user to choose category
                    setPendingTask(transcribedText);
                    setShowCategoryDialog(true);
                  } else {
                    // Use AI suggested category
                    if (onVoiceInput) {
                      onVoiceInput(transcribedText, category);
                    }
                    toast({
                      title: "Task captured",
                      description: `${transcribedText} (${category})`,
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Transcription error:', error);
              toast({
                title: "Error",
                description: "Failed to transcribe audio",
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
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
            
            {/* Main Orb */}
            <div className={`relative ${!isListening && !isResponding ? 'animate-float' : ''}`}>
              {/* Outer glow ring - pulsing when active */}
              {isListening && (
                <div className="absolute inset-0 rounded-full animate-pulse-glow" 
                  style={{
                    boxShadow: '0 0 30px hsl(var(--orb-listening-glow) / 0.5), 0 0 60px hsl(var(--orb-listening-glow) / 0.25)'
                  }}
                />
              )}
              
              {/* Orbital lines and particles */}
              <div className="absolute inset-0 w-32 h-32 -left-6 -top-6">
                <OrbitalParticles active={isListening} />
              </div>
              
              <button
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                className={`relative w-20 h-20 rounded-full transition-all duration-700 ease-in-out
                  ${isListening 
                    ? (mode === 'reflection' || mode === 'quiet') 
                      ? 'bg-orb-reflection scale-110' 
                      : mode === 'planning'
                      ? 'bg-orb-planning scale-110'
                      : 'bg-orb-listening scale-110'
                    : isResponding
                    ? 'bg-orb-responding animate-breathing'
                    : (mode === 'reflection' || mode === 'quiet')
                    ? 'bg-orb-reflection hover:scale-105 hover:bg-orb-reflection-glow'
                    : mode === 'planning'
                    ? 'bg-orb-planning hover:scale-105 hover:bg-orb-planning-glow'
                    : 'bg-orb-idle hover:scale-105 hover:bg-orb-idle-glow'
                  }`}
                style={{
                  boxShadow: isListening 
                    ? (mode === 'reflection' || mode === 'quiet')
                      ? '0 8px 32px hsl(var(--orb-reflection-glow) / 0.4), inset 0 2px 8px hsl(var(--orb-reflection-glow) / 0.3)'
                      : mode === 'planning'
                      ? '0 8px 32px hsl(var(--orb-planning-glow) / 0.4), inset 0 2px 8px hsl(var(--orb-planning-glow) / 0.3)'
                      : '0 8px 32px hsl(var(--orb-listening-glow) / 0.4), inset 0 2px 8px hsl(var(--orb-listening-glow) / 0.3)'
                    : isResponding
                    ? '0 8px 24px hsl(var(--orb-responding-glow) / 0.3), inset 0 2px 8px hsl(var(--orb-responding-glow) / 0.2)'
                    : (mode === 'reflection' || mode === 'quiet')
                    ? '0 4px 16px hsl(var(--orb-reflection-glow) / 0.2), inset 0 1px 4px hsl(var(--orb-reflection-glow) / 0.3)'
                    : mode === 'planning'
                    ? '0 4px 16px hsl(var(--orb-planning-glow) / 0.2), inset 0 1px 4px hsl(var(--orb-planning-glow) / 0.3)'
                    : '0 4px 16px hsl(var(--orb-idle-glow) / 0.2), inset 0 1px 4px hsl(var(--orb-idle-glow) / 0.3)'
                }}
              >
                {/* Sound wave visualization when listening */}
                {isListening && (
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-4">
                    {audioLevels.map((level, i) => (
                      <div
                        key={i}
                        className="w-1 bg-foreground/70 rounded-full transition-all duration-100"
                        style={{
                          height: `${level * 50}%`,
                          opacity: 0.6 + (level * 0.4)
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Idle state - soft glow with subtle pulse */}
                {!isListening && !isResponding && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-foreground/40 animate-breathing" />
                  </div>
                )}

                {/* Processing spinner when responding */}
                {isResponding && (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground/70 rounded-full animate-spin" />
                  </div>
                )}
              </button>
            </div>

            {/* malunita text beneath orb */}
            <div className="text-center space-y-1">
              <p className="text-sm font-serif text-foreground tracking-wide lowercase">
                malunita
              </p>
              <p className="text-xs text-muted-foreground font-light">
                {isListening 
                  ? 'listening...' 
                  : isResponding 
                  ? 'transcribing...' 
                  : getModeDisplayName(mode)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

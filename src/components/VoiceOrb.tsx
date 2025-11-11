import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryDialog } from "./CategoryDialog";

interface VoiceOrbProps {
  onVoiceInput?: (text: string, category?: 'inbox' | 'home' | 'work' | 'gym' | 'projects') => void;
}

type OrbMode = 'capture' | 'reflection';

export const VoiceOrb = ({ onVoiceInput }: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [pendingTask, setPendingTask] = useState<string>("");
  const [mode, setMode] = useState<OrbMode>('capture');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Determine mode based on time of day
  useEffect(() => {
    const checkTimeAndSetMode = () => {
      const hour = new Date().getHours();
      if (hour >= 21 || hour < 6) { // After 9pm or before 6am
        setMode('reflection');
      } else {
        setMode('capture');
      }
    };
    
    checkTimeAndSetMode();
    const interval = setInterval(checkTimeAndSetMode, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

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

  const handleClick = async () => {
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
              if (transcribedText.toLowerCase().includes('enter reflection mode')) {
                setMode('reflection');
                toast({
                  title: "Reflection mode activated",
                  description: "Entering a space for deeper thought",
                });
                setIsResponding(false);
                return;
              }
              
              if (transcribedText.toLowerCase().includes('exit reflection mode')) {
                setMode('capture');
                toast({
                  title: "Capture mode activated",
                  description: "Ready to capture your tasks",
                });
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
                className={`relative w-20 h-20 rounded-full transition-all duration-700 ease-in-out
                  ${isListening 
                    ? mode === 'reflection' ? 'bg-orb-reflection scale-110' : 'bg-orb-listening scale-110'
                    : isResponding
                    ? 'bg-orb-responding animate-breathing'
                    : mode === 'reflection' ? 'bg-orb-reflection hover:scale-105 hover:bg-orb-reflection-glow' : 'bg-orb-idle hover:scale-105 hover:bg-orb-idle-glow'
                  }`}
                style={{
                  boxShadow: isListening 
                    ? mode === 'reflection'
                      ? '0 8px 32px hsl(var(--orb-reflection-glow) / 0.4), inset 0 2px 8px hsl(var(--orb-reflection-glow) / 0.3)'
                      : '0 8px 32px hsl(var(--orb-listening-glow) / 0.4), inset 0 2px 8px hsl(var(--orb-listening-glow) / 0.3)'
                    : isResponding
                    ? '0 8px 24px hsl(var(--orb-responding-glow) / 0.3), inset 0 2px 8px hsl(var(--orb-responding-glow) / 0.2)'
                    : mode === 'reflection'
                    ? '0 4px 16px hsl(var(--orb-reflection-glow) / 0.2), inset 0 1px 4px hsl(var(--orb-reflection-glow) / 0.3)'
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
                  : mode === 'reflection'
                  ? 'reflection mode'
                  : 'tap to speak'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

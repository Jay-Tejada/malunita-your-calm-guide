import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceOrbProps {
  onVoiceInput?: (text: string) => void;
}

export const VoiceOrb = ({ onVoiceInput }: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

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
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

              const transcribedText = data.text;
              
              if (transcribedText && onVoiceInput) {
                onVoiceInput(transcribedText);
                toast({
                  title: "Task captured",
                  description: transcribedText,
                });
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

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex flex-col items-center gap-3">
        {/* Response text area */}
        {isResponding && (
          <div className="mb-2 px-6 py-3 bg-card rounded-2xl shadow-lg border border-secondary animate-in fade-in duration-300">
            <p className="text-sm text-foreground max-w-xs text-center">
              Transcribing your task...
            </p>
          </div>
        )}

        {/* Voice Orb */}
        <div className="relative">
          {/* Pulsing ring when listening */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-orb-listening animate-ping opacity-75" />
          )}
          
          <button
            onClick={handleClick}
            className={`relative w-20 h-20 rounded-full transition-all duration-500 ease-in-out shadow-xl
              ${isListening 
                ? 'bg-background border-4 border-orb-listening scale-110 shadow-2xl' 
                : isResponding
                ? 'bg-orb-responding border-4 border-orb-listening animate-breathing'
                : 'bg-card border-2 border-secondary hover:scale-105 hover:border-accent'
              }`}
          >
            {/* Real-time waveform responding to audio levels */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="w-1 bg-orb-waveform rounded-full transition-all duration-75"
                    style={{
                      height: `${level * 60}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Microphone icon when not active */}
            {!isListening && !isResponding && (
              <div className="flex items-center justify-center w-full h-full">
                <Mic className="w-8 h-8 text-foreground" />
              </div>
            )}

            {/* Processing spinner when responding */}
            {isResponding && (
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* Status text */}
        <p className="text-xs text-muted-foreground font-medium">
          {isListening ? 'Listening...' : isResponding ? 'Transcribing...' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
};

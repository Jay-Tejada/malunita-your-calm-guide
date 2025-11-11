import { useState, useRef, useEffect } from "react";
import { X, Inbox as InboxIcon, Tag, Bell, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";

interface VoiceCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export const VoiceCaptureModal = ({ open, onClose }: VoiceCaptureModalProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(7).fill(0));
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { createTasks } = useTasks();
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bands = 7;
    const bandSize = Math.floor(dataArray.length / bands);
    const newLevels = [];

    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      const bandData = dataArray.slice(start, end);
      const average = bandData.reduce((sum, val) => sum + val, 0) / bandData.length;
      newLevels.push(Math.max(0.2, Math.min(1, average / 128)));
    }

    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      analyzeAudio();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
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
            setIsProcessing(false);
            return;
          }

          try {
            const { data: transcribeData, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            setTranscription(transcribeData.text);
          } catch (error: any) {
            console.error('Transcription error:', error);
            toast({
              title: "Error",
              description: "Failed to transcribe audio",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
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
  };

  const handleSaveToInbox = async () => {
    if (!transcription) return;

    try {
      await createTasks([{
        title: transcription,
        category: 'inbox',
        input_method: 'voice',
        completed: false,
      }]);

      toast({
        title: "Saved to Inbox",
        description: "Task added successfully",
      });

      onClose();
      setTranscription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive",
      });
    }
  };

  const handleDiscard = () => {
    setTranscription("");
    onClose();
  };

  useEffect(() => {
    if (open && !isListening && !transcription) {
      startRecording();
    }
    
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        stopRecording();
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl p-8 bg-card/95 backdrop-blur-xl border-border/50">
        <div className="flex flex-col items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </Button>

          <h3 className="text-lg font-light text-foreground">
            {isListening ? "Listening..." : transcription ? "What would you like to do?" : "Processing..."}
          </h3>

          {/* Waveform Animation */}
          {isListening && (
            <div className="flex items-end justify-center gap-1 h-24">
              {audioLevels.map((level, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary rounded-full transition-all duration-150"
                  style={{
                    height: `${level * 100}%`,
                    minHeight: '20%',
                  }}
                />
              ))}
            </div>
          )}

          {/* Transcription */}
          {transcription && (
            <div className="w-full p-4 bg-muted/30 rounded-2xl">
              <p className="text-sm text-foreground text-center">{transcription}</p>
            </div>
          )}

          {/* Action Buttons */}
          {transcription && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                onClick={handleSaveToInbox}
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 rounded-2xl"
              >
                <InboxIcon className="w-5 h-5" />
                <span className="text-xs">Save to Inbox</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 rounded-2xl"
                disabled
              >
                <Tag className="w-5 h-5" />
                <span className="text-xs">Tag</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 rounded-2xl"
                disabled
              >
                <Bell className="w-5 h-5" />
                <span className="text-xs">Remind</span>
              </Button>
              <Button
                onClick={handleDiscard}
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 rounded-2xl text-destructive hover:text-destructive"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-xs">Discard</span>
              </Button>
            </div>
          )}

          {/* Stop Recording Button */}
          {isListening && (
            <Button
              onClick={stopRecording}
              variant="outline"
              className="w-full rounded-full"
            >
              Stop Recording
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

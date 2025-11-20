import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VoiceCommandCenterProps {
  onClose?: () => void;
}

export function VoiceCommandCenter({ onClose }: VoiceCommandCenterProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [summary, setSummary] = useState('');
  const [progress, setProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setTranscribedText('');
      setSummary('');
      
      toast({
        title: "Recording started",
        description: "Speak your morning brain dump...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    setProgress(10);

    try {
      // Step 1: Convert audio to base64
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      setProgress(25);

      // Step 2: Transcribe audio
      toast({
        title: "Transcribing...",
        description: "Converting speech to text",
      });

      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcriptionError) throw transcriptionError;
      
      const transcribedText = transcriptionData?.text || '';
      setTranscribedText(transcribedText);
      setProgress(50);

      // Step 3: Process with Command Center
      toast({
        title: "Analyzing...",
        description: "Processing your daily plan",
      });

      const { data: commandData, error: commandError } = await supabase.functions.invoke('daily-command-center', {
        body: { text: transcribedText }
      });

      if (commandError) throw commandError;

      setProgress(75);

      // Step 4: Format summary for display and speech
      const summaryData = commandData?.summary;
      if (!summaryData) throw new Error('No summary received');

      const formattedSummary = formatSummaryForDisplay(summaryData);
      const speechText = formatSummaryForSpeech(summaryData);
      
      setSummary(formattedSummary);
      setProgress(85);

      // Step 5: Generate and play speech
      toast({
        title: "Generating speech...",
        description: "Preparing your daily brief",
      });

      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: speechText,
          voice: 'nova' // Warm, friendly voice
        }
      });

      if (ttsError) throw ttsError;

      setProgress(100);

      // Play audio
      const audioContent = ttsData?.audioContent;
      if (audioContent) {
        const audioBlob = base64ToBlob(audioContent, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        setIsSpeaking(true);
        await audioRef.current.play();

        toast({
          title: "Daily brief ready",
          description: "Playing your command center summary",
        });
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'Could not process recording',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const formatSummaryForDisplay = (summary: any): string => {
    let text = '🧭 Daily Command Center\nHere\'s your clarity for today.\n\n';

    text += '🔥 Priority Tasks\n';
    if (summary.priorityTasks?.length > 0) {
      text += summary.priorityTasks.map((t: string) => `• ${t}`).join('\n');
    } else {
      text += '• No items today';
    }
    text += '\n\n';

    text += '📅 Today\'s Schedule\n';
    if (summary.todaysSchedule?.length > 0) {
      text += summary.todaysSchedule.map((t: string) => `• ${t}`).join('\n');
    } else {
      text += '• No items today';
    }
    text += '\n\n';

    text += '🪶 Low Effort Wins\n';
    if (summary.lowEffortWins?.length > 0) {
      text += summary.lowEffortWins.map((t: string) => `• ${t}`).join('\n');
    } else {
      text += '• No items today';
    }
    text += '\n\n';

    text += '🎉 Tiny Task Fiesta\n';
    text += summary.tinyTaskCount > 0 
      ? `You have ${summary.tinyTaskCount} tiny tasks ready to clear.\n\n`
      : 'No tiny tasks detected.\n\n';

    if (summary.contextNotes?.length > 0) {
      text += '🧩 Context Notes\n';
      text += summary.contextNotes.map((n: string) => `• ${n}`).join('\n');
      text += '\n\n';
    }

    text += '💡 Insight of the Day\n';
    text += summary.insightOfTheDay || 'Ready to capture your day.';

    return text;
  };

  const formatSummaryForSpeech = (summary: any): string => {
    let text = 'Good morning. Here\'s your daily command center brief. ';

    if (summary.priorityTasks?.length > 0) {
      text += `Your priority tasks are: ${summary.priorityTasks.join(', ')}. `;
    }

    if (summary.todaysSchedule?.length > 0) {
      text += `On today's schedule: ${summary.todaysSchedule.join(', ')}. `;
    }

    if (summary.lowEffortWins?.length > 0) {
      text += `For quick wins, consider: ${summary.lowEffortWins.slice(0, 3).join(', ')}. `;
    }

    if (summary.tinyTaskCount > 0) {
      text += `You have ${summary.tinyTaskCount} tiny tasks ready for a fiesta session. `;
    }

    if (summary.insightOfTheDay) {
      text += summary.insightOfTheDay;
    }

    return text;
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Command Center
        </CardTitle>
        <CardDescription>
          Dictate your morning brain dump and receive an intelligent daily brief
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !isProcessing && !isSpeaking && (
            <Button
              size="lg"
              onClick={startRecording}
              className="h-20 w-20 rounded-full"
            >
              <Mic className="h-8 w-8" />
            </Button>
          )}

          {isRecording && (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="h-20 w-20 rounded-full animate-pulse"
            >
              <MicOff className="h-8 w-8" />
            </Button>
          )}

          {isSpeaking && (
            <Button
              size="lg"
              variant="secondary"
              onClick={stopSpeaking}
              className="h-20 w-20 rounded-full"
            >
              <Volume2 className="h-8 w-8 animate-pulse" />
            </Button>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Progress value={progress} className="w-48" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center text-sm text-muted-foreground">
          {isRecording && "🎤 Recording... Press stop when done"}
          {isProcessing && "⚙️ Processing your brain dump..."}
          {isSpeaking && "🔊 Playing your daily brief"}
          {!isRecording && !isProcessing && !isSpeaking && "Press the mic to start"}
        </div>

        {/* Transcribed Text */}
        {transcribedText && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">What you said:</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              "{transcribedText}"
            </p>
          </div>
        )}

        {/* Summary Display */}
        {summary && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Your Daily Brief:</h3>
            <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md font-sans">
              {summary}
            </pre>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
            disabled={isRecording || isProcessing}
          >
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

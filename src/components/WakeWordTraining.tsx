import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, CheckCircle, XCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export const WakeWordTraining = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState<{ text: string; matched: boolean }[]>([]);
  const [progress, setProgress] = useState(0);
  const maxSamples = 5;

  const checkMatch = (transcript: string, target: string): boolean => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const normalizedTarget = target.toLowerCase().trim();
    
    // Exact match
    if (normalizedTranscript.includes(normalizedTarget)) return true;
    
    // Word-by-word match (allows for slight variations)
    const transcriptWords = normalizedTranscript.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    
    // Check if all target words appear in order
    let targetIndex = 0;
    for (const word of transcriptWords) {
      if (word === targetWords[targetIndex]) {
        targetIndex++;
        if (targetIndex === targetWords.length) return true;
      }
    }
    
    return false;
  };

  const startSample = async () => {
    if (!profile?.custom_wake_word) {
      toast({
        title: "No wake word set",
        description: "Please set a custom wake word first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRecording(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Not supported",
          description: "Speech recognition is not supported in this browser",
          variant: "destructive",
        });
        setIsRecording(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const matched = checkMatch(transcript, profile.custom_wake_word!);
        
        setSamples(prev => [...prev, { text: transcript, matched }]);
        setProgress(((samples.length + 1) / maxSamples) * 100);
        
        toast({
          title: matched ? "Match found!" : "No match",
          description: matched 
            ? `"${transcript}" matches your wake word` 
            : `"${transcript}" doesn't match "${profile.custom_wake_word}"`,
          variant: matched ? "default" : "destructive",
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        toast({
          title: "Recognition error",
          description: event.error,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsRecording(false);
      toast({
        title: "Error",
        description: "Failed to start voice recognition",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setSamples([]);
    setProgress(0);
  };

  const successRate = samples.length > 0 
    ? (samples.filter(s => s.matched).length / samples.length) * 100 
    : 0;

  return (
    <div className="mt-4 p-4 bg-background rounded-lg border border-border">
      <h4 className="text-sm font-medium mb-3">Test Your Wake Word</h4>
      <p className="text-xs text-muted-foreground mb-4">
        Record {maxSamples} samples to test recognition accuracy
      </p>

      <Progress value={progress} className="mb-4" />

      <div className="flex gap-2 mb-4">
        <Button
          onClick={startSample}
          disabled={isRecording || samples.length >= maxSamples}
          size="sm"
          className="flex-1"
        >
          <Mic className="w-4 h-4 mr-2" />
          {isRecording ? 'Listening...' : 'Record Sample'}
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          Reset
        </Button>
      </div>

      {samples.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Success Rate: {successRate.toFixed(0)}%
          </div>
          {samples.map((sample, i) => (
            <div key={i} className="flex items-start gap-2 text-xs p-2 bg-secondary/30 rounded">
              {sample.matched ? (
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{sample.text}</span>
            </div>
          ))}
        </div>
      )}

      {samples.length >= maxSamples && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-xs">
            {successRate >= 80 ? (
              <span className="text-success">
                ✓ Great! Your wake word is working well.
              </span>
            ) : successRate >= 50 ? (
              <span className="text-warning">
                ⚠ Consider using a clearer phrase or speaking more distinctly.
              </span>
            ) : (
              <span className="text-destructive">
                ✗ Try a different wake word phrase for better recognition.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
import { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer } from 'vaul';
import { Mic, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/types/speech.d.ts';

interface VoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTranscriptSubmit?: (text: string) => void;
}

export function VoiceSheet({
  open,
  onOpenChange,
  onTranscriptSubmit,
}: VoiceSheetProps) {
  const [localTranscript, setLocalTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [fallbackText, setFallbackText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Clear on close
  useEffect(() => {
    if (!open) {
      setLocalTranscript('');
      setFallbackText('');
      setIsRecording(false);
      setIsProcessing(false);
      // Stop any active recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    }
  }, [open]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setIsProcessing(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Show interim results while recording
        setLocalTranscript((finalTranscript + interimTranscript).trim());
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setIsProcessing(false);
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setIsProcessing(true);
      recognitionRef.current.stop();
    }
  }, []);

  const handleVoiceButton = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSave = () => {
    const textToSave = isSupported ? localTranscript.trim() : fallbackText.trim();
    if (textToSave && onTranscriptSubmit) {
      onTranscriptSubmit(textToSave);
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    setLocalTranscript('');
    setFallbackText('');
  };

  // Fallback UI for unsupported browsers
  const FallbackContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <button 
          onClick={() => onOpenChange(false)}
          className="p-2 -ml-2 text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs text-foreground/40 uppercase tracking-widest font-mono">
          Add thought
        </span>
        <div className="w-9" />
      </div>

      {/* Text input fallback */}
      <div className="flex-1 flex flex-col px-4 py-6">
        <p className="text-xs text-foreground/40 mb-4 font-mono">
          Voice not supported — type instead
        </p>
        <textarea
          autoFocus
          value={fallbackText}
          onChange={(e) => setFallbackText(e.target.value)}
          placeholder="What's on your mind?"
          className="flex-1 bg-transparent font-mono text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none text-lg leading-relaxed"
        />
      </div>

      {/* Bottom actions */}
      {fallbackText.trim() && (
        <div className="px-4 py-4 border-t border-foreground/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="flex-1 py-3 text-sm text-foreground/50 hover:text-foreground/70 font-mono transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/70 font-mono transition-colors"
            >
              <Send className="w-4 h-4" />
              Add to Inbox
            </button>
          </div>
        </div>
      )}

      {/* Bottom safe area */}
      <div className="h-safe" />
    </>
  );

  // Voice capture UI for supported browsers
  const VoiceContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <button 
          onClick={() => onOpenChange(false)}
          className="p-2 -ml-2 text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs text-foreground/40 uppercase tracking-widest font-mono">
          Speak your thought
        </span>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Transcript display */}
        {localTranscript ? (
          <div className="w-full max-w-sm mb-8 animate-fade-in">
            <p className="font-mono text-lg text-foreground/70 text-center leading-relaxed">
              "{localTranscript}"
            </p>
          </div>
        ) : (
          <p className="text-sm text-foreground/40 mb-8 font-mono">
            {isProcessing ? 'Processing...' : isRecording ? 'Listening...' : 'Tap to speak'}
          </p>
        )}

        {/* Mic button - styled like the orb with calm amber tones */}
        <button
          onClick={handleVoiceButton}
          disabled={isProcessing}
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
            "focus:outline-none active:scale-95",
            isRecording 
              ? 'bg-gradient-to-br from-amber-200 to-amber-300 scale-110 shadow-lg shadow-amber-200/30' 
              : 'bg-gradient-to-br from-amber-100/80 to-amber-200/80 hover:from-amber-100 hover:to-amber-200',
            isProcessing && "opacity-60 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-amber-700/50 animate-spin" />
          ) : (
            <Mic className={cn(
              "w-8 h-8 transition-colors",
              isRecording ? 'text-amber-700/70' : 'text-amber-700/40'
            )} />
          )}
        </button>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mt-6 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs text-foreground/40 font-mono">Recording</span>
          </div>
        )}

        {/* Waveform visualization */}
        {isRecording && (
          <div className="flex items-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400/60 rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Hint */}
        {!isRecording && !localTranscript && !isProcessing && (
          <p className="text-xs text-foreground/30 mt-6 font-mono">
            Tap to start, tap again to stop
          </p>
        )}
      </div>

      {/* Bottom actions */}
      {localTranscript && !isRecording && (
        <div className="px-4 py-4 border-t border-foreground/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClear}
              className="flex-1 py-3 text-sm text-foreground/50 hover:text-foreground/70 font-mono transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/70 font-mono transition-colors"
            >
              <Send className="w-4 h-4" />
              Add to Inbox
            </button>
          </div>
        </div>
      )}

      {/* Bottom safe area */}
      <div className="h-safe" />
    </>
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-bg-overlay backdrop-blur-[3px] z-[100]" />
        <Drawer.Content className="bg-background flex flex-col h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-[100] rounded-t-[24px]">
          {isSupported ? <VoiceContent /> : <FallbackContent />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

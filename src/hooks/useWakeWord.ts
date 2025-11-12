import { useEffect, useRef, useState } from 'react';
import { useProfile } from './useProfile';

interface UseWakeWordProps {
  onWakeWordDetected: () => void;
  enabled?: boolean;
}

export const useWakeWord = ({ onWakeWordDetected, enabled = true }: UseWakeWordProps) => {
  const { profile } = useProfile();
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const stopListening = () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    };

    // Only start if wake word is enabled in profile and feature is enabled
    if (!enabled || !profile?.wake_word_enabled) {
      stopListening();
      return;
    }

    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const startListening = () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          console.log('Wake word listener started');
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript.toLowerCase().trim();
          setLastHeard(transcript);

          // Check for wake word match
          const wakeWord = (profile?.custom_wake_word || 'hey malunita').toLowerCase();
          const words = transcript.split(' ');
          const recentWords = words.slice(-3).join(' '); // Check last 3 words

          if (recentWords.includes(wakeWord) || transcript.includes(wakeWord)) {
            console.log('Wake word detected:', wakeWord);
            onWakeWordDetected();
            
            // Brief pause after detection to avoid immediate re-trigger
            recognition.stop();
            setTimeout(() => {
              if (profile?.wake_word_enabled) {
                startListening();
              }
            }, 2000);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Wake word recognition error:', event.error);
          
          // Don't restart on aborted errors (user stopped it)
          if (event.error === 'aborted') {
            return;
          }
          
          // Restart after errors (except not-allowed)
          if (event.error !== 'not-allowed') {
            restartTimeoutRef.current = setTimeout(() => {
              if (profile?.wake_word_enabled && enabled) {
                startListening();
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          console.log('Wake word listener ended');
          setIsListening(false);
          
          // Auto-restart if still enabled
          if (profile?.wake_word_enabled && enabled) {
            restartTimeoutRef.current = setTimeout(() => {
              startListening();
            }, 500);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Error starting wake word recognition:', error);
      }
    };

    startListening();

    return () => {
      stopListening();
    };
  }, [profile?.wake_word_enabled, profile?.custom_wake_word, enabled, onWakeWordDetected]);

  return {
    isListening,
    lastHeard: lastHeard.slice(-50), // Show last 50 chars
  };
};

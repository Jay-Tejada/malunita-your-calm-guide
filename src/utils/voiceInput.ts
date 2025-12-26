/// <reference path="../types/wakelock.d.ts" />
// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// Use type assertion instead of global augmentation to avoid conflicts
type SpeechRecognitionConstructor = new () => SpeechRecognition;

export interface VoiceInputOptions {
  onTranscript: (text: string) => void;
  onListeningChange: (isListening: boolean) => void;
  silenceTimeout?: number;
}

let recognition: SpeechRecognition | null = null;
let silenceTimer: NodeJS.Timeout | null = null;
let wakeLockSentinel: WakeLockSentinel | null = null;

// Wake lock helper functions
async function requestWakeLock(): Promise<boolean> {
  if (!('wakeLock' in navigator)) {
    console.log('Wake Lock API not supported');
    return false;
  }
  
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    console.log('Wake lock acquired for voice input');
    return true;
  } catch (err) {
    console.error('Wake lock request failed:', err);
    return false;
  }
}

async function releaseWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('Wake lock released');
    } catch (err) {
      console.error('Wake lock release failed:', err);
    }
  }
}

export const startVoiceInput = async (options: VoiceInputOptions) => {
  const { onTranscript, onListeningChange, silenceTimeout = 10000 } = options;

  // Check if speech recognition is supported
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor;
  
  if (!SpeechRecognition) {
    throw new Error('Speech recognition is not supported in this browser');
  }

  // Stop existing recognition if any
  if (recognition) {
    recognition.stop();
  }

  // Request wake lock to prevent screen timeout during recording
  await requestWakeLock();

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onstart = () => {
    console.log('Voice recognition started');
    onListeningChange(true);
    
    // Set auto-stop timer
    silenceTimer = setTimeout(() => {
      console.log('Auto-stopping after silence timeout');
      stopVoiceInput();
    }, silenceTimeout);
  };

  recognition.onresult = (event) => {
    // Reset silence timer on any speech
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        console.log('Auto-stopping after silence timeout');
        stopVoiceInput();
      }, silenceTimeout);
    }

    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    console.log('Interim:', interimTranscript);
    console.log('Final so far:', finalTranscript);
  };

  recognition.onend = async () => {
    console.log('Voice recognition ended');
    onListeningChange(false);
    
    // Release wake lock when recognition ends
    await releaseWakeLock();
    
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }

    // Send final transcript
    if (finalTranscript.trim()) {
      onTranscript(finalTranscript.trim());
    }
    
    finalTranscript = '';
    recognition = null;
  };

  recognition.onerror = async (event) => {
    console.error('Speech recognition error:', event.error);
    onListeningChange(false);
    
    // Release wake lock on error
    await releaseWakeLock();
    
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    
    recognition = null;
  };

  recognition.start();
};

export const stopVoiceInput = async () => {
  if (recognition) {
    recognition.stop();
  }
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  await releaseWakeLock();
};

export const isVoiceInputSupported = () => {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};

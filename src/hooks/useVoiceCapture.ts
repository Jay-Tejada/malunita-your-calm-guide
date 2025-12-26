// src/hooks/useVoiceCapture.ts

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWakeLock } from "./useWakeLock";

interface UseVoiceCaptureOptions {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
}

export function useVoiceCapture({ onTranscript, onError }: UseVoiceCaptureOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { requestWakeLock, releaseWakeLock, wakeLockFailed } = useWakeLock();

  const startRecording = useCallback(async () => {
    try {
      // Request wake lock to prevent screen timeout
      await requestWakeLock();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Release wake lock when recording stops
        await releaseWakeLock();
        
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const base64 = await blobToBase64(audioBlob);

          const { data, error } = await supabase.functions.invoke("transcribe-audio", {
            body: { audio: base64 },
          });

          if (error) throw error;
          if (data?.text) onTranscript(data.text);
        } catch (err) {
          onError?.(err as Error);
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      await releaseWakeLock();
      onError?.(err as Error);
    }
  }, [onTranscript, onError, requestWakeLock, releaseWakeLock]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    await releaseWakeLock();
  }, [releaseWakeLock]);

  return { isRecording, isProcessing, startRecording, stopRecording, wakeLockFailed };
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

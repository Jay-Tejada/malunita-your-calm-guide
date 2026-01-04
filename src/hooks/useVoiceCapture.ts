// src/hooks/useVoiceCapture.ts

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWakeLock } from "./useWakeLock";
import { toast } from "sonner";

const MAX_RECORDING_DURATION = 90000; // 90 seconds max
const MAX_AUDIO_SIZE_MB = 25;

interface UseVoiceCaptureOptions {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
}

export function useVoiceCapture({ onTranscript, onError }: UseVoiceCaptureOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingElapsed, setProcessingElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { requestWakeLock, releaseWakeLock, wakeLockFailed } = useWakeLock();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Request wake lock to prevent screen timeout
      await requestWakeLock();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Release wake lock when recording stops
        await releaseWakeLock();
        
        // Clear auto-stop timer
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // Start processing state IMMEDIATELY for perceptual latency masking
        setIsProcessing(true);
        setProcessingElapsed(0);
        
        // Start elapsed time counter
        const startTime = Date.now();
        processingTimerRef.current = setInterval(() => {
          setProcessingElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          
          // Validate size before upload
          const sizeMB = audioBlob.size / (1024 * 1024);
          if (sizeMB > MAX_AUDIO_SIZE_MB) {
            toast.error(`Recording too large (${sizeMB.toFixed(1)}MB). Max is ${MAX_AUDIO_SIZE_MB}MB.`);
            throw new Error('Audio file too large');
          }
          
          const base64 = await blobToBase64(audioBlob);

          const { data, error } = await supabase.functions.invoke("transcribe-audio", {
            body: { audio: base64 },
          });

          if (error) throw error;
          if (data?.text) onTranscript(data.text);
        } catch (err) {
          onError?.(err as Error);
        } finally {
          // Clear elapsed timer
          if (processingTimerRef.current) {
            clearInterval(processingTimerRef.current);
            processingTimerRef.current = null;
          }
          setIsProcessing(false);
          setProcessingElapsed(0);
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after max duration
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          toast.info("Recording auto-stopped at 90 seconds");
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, MAX_RECORDING_DURATION);
      
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
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    await releaseWakeLock();
  }, [releaseWakeLock]);

  return { 
    isRecording, 
    isProcessing, 
    processingElapsed,
    startRecording, 
    stopRecording, 
    wakeLockFailed 
  };
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

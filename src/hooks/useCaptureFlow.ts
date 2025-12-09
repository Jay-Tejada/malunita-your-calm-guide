// src/hooks/useCaptureFlow.ts

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";

export function useCaptureFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { createTasks } = useTasks();

  const openCapture = useCallback(() => setIsOpen(true), []);
  
  const closeCapture = useCallback(() => {
    setIsOpen(false);
    setIsRecording(false);
    // Stop any ongoing recording
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to use voice capture.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(true);
  }, []);

  const processRecording = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // Transcribe via edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const text = data?.text?.trim();
      if (text) {
        await createTasks([{
          title: text,
          category: 'inbox',
          input_method: 'voice',
        }]);
        
        toast({
          description: "Added to inbox",
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Error",
        description: "Failed to process voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const submitText = useCallback(async (text: string) => {
    await createTasks([{
      title: text,
      category: 'inbox',
      input_method: 'text',
    }]);
    
    toast({
      description: "Added to inbox",
    });
  }, [createTasks, toast]);

  return {
    isOpen,
    isRecording,
    isProcessing,
    openCapture,
    closeCapture,
    startRecording,
    stopRecording,
    submitText,
  };
}

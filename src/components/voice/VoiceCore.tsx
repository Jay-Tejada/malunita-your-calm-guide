import { useRef, useEffect, useState } from "react";
import { useAudioSmoothing } from "@/hooks/useAudioSmoothing";

export interface VoiceCoreProps {
  isListening: boolean;
  isResponding: boolean;
  onAmplitudeChange: (amplitude: number) => void;
  onRecordingStart: () => void;
  onRecordingStop: (audioBlob: Blob) => void;
  onError: (error: string) => void;
}

export const useVoiceCore = ({
  isListening,
  isResponding,
  onAmplitudeChange,
  onRecordingStart,
  onRecordingStop,
  onError,
}: VoiceCoreProps) => {
  const [smoothedAmplitude, setSmoothedAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioSmoothing = useAudioSmoothing();

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average audio level (0-1)
    const rawAverage = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;
    
    // Apply exponential smoothing to prevent jitter
    const smoothed = audioSmoothing.smoothAmplitude(rawAverage, 0.85);
    
    // Update smoothed amplitude for halo animation
    setSmoothedAmplitude(smoothed);
    onAmplitudeChange(smoothed);

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

  const startRecording = async () => {
    audioSmoothing.reset();
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingStop(audioBlob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      onRecordingStart();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onError("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    audioSmoothing.reset();
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

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    smoothedAmplitude,
    toggleRecording,
    stopRecording,
  };
};

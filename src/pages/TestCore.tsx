import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { Mic, Square } from "lucide-react";

const TestCore = () => {
  const [transcription, setTranscription] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { createTasks } = useTasks();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const startRecording = async () => {
    try {
      addLog("Starting recording...");
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
        addLog("Recording stopped, processing...");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            addLog("ERROR: Failed to convert audio to base64");
            return;
          }

          try {
            addLog("Sending to transcribe-audio function...");
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            const text = data.text;
            setTranscription(text);
            addLog(`SUCCESS: Transcription - "${text}"`);
          } catch (error) {
            addLog(`ERROR: Transcription failed - ${error}`);
          }
        };

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      addLog("Recording started");
    } catch (error) {
      addLog(`ERROR: Failed to start recording - ${error}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      addLog("Stopping recording...");
    }
  };

  const handleTaskCreation = async () => {
    if (!transcription) {
      addLog("ERROR: No transcription available");
      return;
    }

    try {
      addLog("Creating task from transcription...");
      await createTasks([{
        title: transcription,
        input_method: "voice"
      }]);
      addLog("SUCCESS: Task created");
    } catch (error) {
      addLog(`ERROR: Task creation failed - ${error}`);
    }
  };

  const handleTTSTest = async () => {
    const testText = transcription || "This is a test of text to speech";
    
    try {
      addLog(`Testing TTS with text: "${testText}"`);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: testText }
      });

      if (error) throw error;

      addLog("TTS response received, converting to audio...");
      
      // Convert base64 to audio blob
      const audioData = atob(data.audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      addLog("Playing audio...");
      const audio = new Audio(audioUrl);
      audio.play();
      
      audio.onended = () => {
        addLog("SUCCESS: Audio playback completed");
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        addLog("ERROR: Audio playback failed");
      };
      
    } catch (error) {
      addLog(`ERROR: TTS test failed - ${error}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Core Voice Test Page</h1>
      
      <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h2>Voice Input</h2>
        <Button 
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          {isRecording ? (
            <>
              <Square size={16} />
              Stop Recording
            </>
          ) : (
            <>
              <Mic size={16} />
              Start Recording
            </>
          )}
        </Button>
      </div>

      <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h2>Transcription Output</h2>
        <p style={{ minHeight: "40px", background: "#f5f5f5", padding: "10px" }}>
          {transcription || "(waiting for transcription...)"}
        </p>
      </div>

      <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h2>Actions</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button onClick={handleTaskCreation} disabled={!transcription}>
            Create Task
          </Button>
          <Button onClick={handleTTSTest}>
            Test TTS
          </Button>
        </div>
      </div>

      <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
        <h2>Console Log</h2>
        <div style={{ 
          background: "#000", 
          color: "#0f0", 
          padding: "10px", 
          fontFamily: "monospace",
          fontSize: "12px",
          maxHeight: "300px",
          overflow: "auto"
        }}>
          {logs.length === 0 ? "No logs yet..." : logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestCore;

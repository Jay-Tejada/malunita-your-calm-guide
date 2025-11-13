import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Volume2 } from 'lucide-react';

interface ExtractedTask {
  title: string;
  suggested_category: string;
  suggested_timeframe: string;
  reminder_time?: string | null;
  confidence: number;
  goal_aligned?: boolean;
  alignment_reason?: string;
}

interface ConversationalTaskFlowProps {
  tasks: ExtractedTask[];
  originalText: string;
  onComplete: (confirmedTasks: Array<{
    title: string;
    category: string;
    is_focus: boolean;
    reminder_time?: string | null;
  }>) => void;
  onCancel: () => void;
  audioEnabled: boolean;
}

export const ConversationalTaskFlow: React.FC<ConversationalTaskFlowProps> = ({
  tasks,
  originalText,
  onComplete,
  onCancel,
  audioEnabled
}) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [confirmedTasks, setConfirmedTasks] = useState<Array<{
    title: string;
    category: string;
    is_focus: boolean;
    reminder_time?: string | null;
  }>>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [flowState, setFlowState] = useState<'summary' | 'asking_category' | 'complete'>('summary');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Generate summary and start flow
  useEffect(() => {
    startConversationalFlow();
  }, []);

  const playTTS = async (text: string): Promise<void> => {
    if (!audioEnabled) return;
    
    setIsSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'nova' }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const audio = new Audio(URL.createObjectURL(blob));
        
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          audio.play();
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const startConversationalFlow = async () => {
    // Read summary of extracted tasks
    const summary = generateTaskSummary();
    setCurrentQuestion(summary);
    await playTTS(summary);
    
    // Wait a moment, then start asking about categories
    setTimeout(() => {
      askAboutNextTask();
    }, 1000);
  };

  const generateTaskSummary = (): string => {
    if (tasks.length === 1) {
      return `I heard you say: "${tasks[0].title}". Let me help you organize this.`;
    }
    
    const taskList = tasks.map((t, i) => `${i + 1}. ${t.title}`).join(', ');
    return `I extracted ${tasks.length} tasks from what you said: ${taskList}. Let me help you organize these.`;
  };

  const askAboutNextTask = async () => {
    if (currentTaskIndex >= tasks.length) {
      completeFlow();
      return;
    }

    setFlowState('asking_category');
    const task = tasks[currentTaskIndex];
    const suggestedCat = task.suggested_category;
    
    // If confidence is high and we have learning data, auto-confirm
    if (task.confidence > 0.85) {
      const question = `"${task.title}" - I think this is for ${suggestedCat}. Is that right?`;
      setCurrentQuestion(question);
      await playTTS(question);
      startListeningForResponse();
    } else {
      const question = `"${task.title}" - Which category should this go in? Work, home, projects, gym, or inbox?`;
      setCurrentQuestion(question);
      await playTTS(question);
      startListeningForResponse();
    }
  };

  const startListeningForResponse = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceResponse(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsListening(true);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsListening(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const processVoiceResponse = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result?.toString().split(',')[1];
          resolve(result || '');
        };
      });

      // Transcribe
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcribeError) throw transcribeError;

      const response = transcribeData.text.toLowerCase().trim();
      await handleCategoryResponse(response);
    } catch (error) {
      console.error('Error processing voice response:', error);
      // Retry asking
      setTimeout(() => askAboutNextTask(), 1000);
    }
  };

  const handleCategoryResponse = async (response: string) => {
    const task = tasks[currentTaskIndex];
    let category = task.suggested_category;

    // Parse response for category or confirmation
    if (response.includes('yes') || response.includes('yeah') || response.includes('correct') || response.includes('right')) {
      category = task.suggested_category;
    } else if (response.includes('no') || response.includes('nope')) {
      // Ask again with options
      const question = `Okay, should it be work, home, projects, gym, or inbox?`;
      setCurrentQuestion(question);
      await playTTS(question);
      startListeningForResponse();
      return;
    } else if (response.includes('work')) {
      category = 'work';
    } else if (response.includes('home') || response.includes('personal')) {
      category = 'home';
    } else if (response.includes('project')) {
      category = 'projects';
    } else if (response.includes('gym') || response.includes('workout') || response.includes('fitness')) {
      category = 'gym';
    } else if (response.includes('inbox')) {
      category = 'inbox';
    }

    // Confirm and move to next
    const confirmation = `Got it, adding to ${category}.`;
    await playTTS(confirmation);

    setConfirmedTasks(prev => [...prev, {
      title: task.title,
      category,
      is_focus: task.suggested_timeframe === 'today',
      reminder_time: task.reminder_time
    }]);

    setCurrentTaskIndex(prev => prev + 1);
    setTimeout(() => askAboutNextTask(), 800);
  };

  const completeFlow = async () => {
    setFlowState('complete');
    const finalMessage = `Perfect! I've organized ${confirmedTasks.length} task${confirmedTasks.length > 1 ? 's' : ''} for you.`;
    setCurrentQuestion(finalMessage);
    await playTTS(finalMessage);
    
    // Track feedback for learning
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const feedbackPromises = tasks.map((originalTask, index) => {
        const confirmedTask = confirmedTasks[index];
        if (!confirmedTask) return Promise.resolve();
        
        const wasCorrected = originalTask.suggested_category !== confirmedTask.category;
        
        return supabase.from('task_learning_feedback').insert({
          user_id: user.id,
          original_text: originalText,
          task_title: confirmedTask.title,
          suggested_category: originalTask.suggested_category,
          actual_category: confirmedTask.category,
          suggested_timeframe: originalTask.suggested_timeframe,
          actual_timeframe: confirmedTask.is_focus ? 'today' : 'later',
          was_corrected: wasCorrected
        });
      });
      
      await Promise.all(feedbackPromises);
    }
    
    setTimeout(() => {
      onComplete(confirmedTasks);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <Card className="max-w-lg w-full p-8 space-y-6">
        <div className="flex items-center justify-center mb-6">
          {isSpeaking && (
            <div className="flex items-center gap-2 text-primary">
              <Volume2 className="w-6 h-6 animate-pulse" />
              <span className="text-sm font-light">Malunita is speaking...</span>
            </div>
          )}
          {isListening && (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-light">Listening for your response...</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-center text-lg font-light leading-relaxed">
            {currentQuestion}
          </p>
          
          {flowState === 'asking_category' && (
            <div className="text-center text-sm text-muted-foreground">
              Task {currentTaskIndex + 1} of {tasks.length}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {confirmedTasks.map((task, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/30">
              <span className="text-foreground/80">{task.title}</span>
              <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
            </div>
          ))}
        </div>

        {flowState !== 'complete' && (
          <button
            onClick={onCancel}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </Card>
    </div>
  );
};
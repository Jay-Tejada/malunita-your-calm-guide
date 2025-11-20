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
  const [flowState, setFlowState] = useState<'summary' | 'asking_category' | 'asking_reminder' | 'asking_reminder_time' | 'complete'>('summary');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Generate summary and start flow
  useEffect(() => {
    startConversationalFlow();
  }, []);

  const playTTS = async (text: string): Promise<void> => {
    console.log('playTTS called with audioEnabled:', audioEnabled, 'text:', text);
    if (!audioEnabled) {
      console.log('Audio disabled, skipping TTS');
      return;
    }
    
    setIsSpeaking(true);
    try {
      console.log('Invoking text-to-speech function...');
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'nova' }
      });

      if (error) {
        console.error('TTS function error:', error);
        throw error;
      }

      console.log('TTS response received:', data);

      if (data?.audioContent) {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const audio = new Audio(URL.createObjectURL(blob));
        
        console.log('Playing audio...');
        await new Promise((resolve, reject) => {
          audio.onended = () => {
            console.log('Audio playback ended');
            resolve(null);
          };
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            reject(e);
          };
          audio.play().catch(e => {
            console.error('Audio play() failed:', e);
            reject(e);
          });
        });
      } else {
        console.warn('No audioContent in TTS response');
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const startConversationalFlow = async () => {
    console.log('Starting conversational flow with', tasks.length, 'tasks');
    // Read summary of extracted tasks
    const summary = generateTaskSummary();
    console.log('Generated summary:', summary);
    setCurrentQuestion(summary);
    await playTTS(summary);
    
    console.log('Summary TTS complete, waiting before asking about tasks...');
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

    // Confirm category
    const confirmation = `Got it, adding to ${category}.`;
    await playTTS(confirmation);

    // Ask about reminder
    setFlowState('asking_reminder');
    const reminderQuestion = `Would you like a reminder for this task?`;
    setCurrentQuestion(reminderQuestion);
    await playTTS(reminderQuestion);
    
    // Store current task info temporarily
    setConfirmedTasks(prev => [...prev, {
      title: task.title,
      category,
      is_focus: task.suggested_timeframe === 'today',
      reminder_time: null // Will be filled in if user wants reminder
    }]);
    
    startListeningForResponse();
  };

  const handleReminderResponse = async (response: string) => {
    const currentTask = confirmedTasks[confirmedTasks.length - 1];
    
    if (response.includes('yes') || response.includes('yeah') || response.includes('sure')) {
      // Ask for time
      setFlowState('asking_reminder_time');
      const timeQuestion = `What time should I remind you? For example, say "10 AM" or "3 PM tomorrow".`;
      setCurrentQuestion(timeQuestion);
      await playTTS(timeQuestion);
      startListeningForResponse();
    } else if (response.includes('no') || response.includes('nope') || response.includes('skip')) {
      // No reminder, move to next task
      setCurrentTaskIndex(prev => prev + 1);
      setTimeout(() => askAboutNextTask(), 800);
    } else {
      // Didn't understand, ask again
      const clarifyQuestion = `Sorry, I didn't catch that. Do you want a reminder? Say yes or no.`;
      setCurrentQuestion(clarifyQuestion);
      await playTTS(clarifyQuestion);
      startListeningForResponse();
    }
  };

  const handleReminderTimeResponse = async (response: string) => {
    try {
      // Parse time from response using AI
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a time parser. Extract a specific datetime from the user's input and return it in ISO 8601 format. 
              If they say "10 AM" assume today at 10 AM. If they say "tomorrow at 3 PM" use tomorrow at 3 PM.
              Current time is ${new Date().toISOString()}.
              Return ONLY the ISO datetime string, nothing else.`
            },
            {
              role: 'user',
              content: response
            }
          ]
        }
      });

      if (error) throw error;

      const reminderTime = data?.message?.trim();
      
      // Update the last confirmed task with reminder time
      setConfirmedTasks(prev => {
        const updated = [...prev];
        updated[updated.length - 1].reminder_time = reminderTime;
        return updated;
      });

      const confirmation = `Perfect! I'll remind you then.`;
      await playTTS(confirmation);

      // Move to next task
      setCurrentTaskIndex(prev => prev + 1);
      setTimeout(() => askAboutNextTask(), 800);
    } catch (error) {
      console.error('Error parsing reminder time:', error);
      const retryQuestion = `Sorry, I didn't understand that time. Can you say it again? For example, "10 AM" or "3 PM tomorrow".`;
      setCurrentQuestion(retryQuestion);
      await playTTS(retryQuestion);
      startListeningForResponse();
    }
  };

  // Update processVoiceResponse to route to the right handler
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
      
      // Route to appropriate handler based on flow state
      if (flowState === 'asking_category') {
        await handleCategoryResponse(response);
      } else if (flowState === 'asking_reminder') {
        await handleReminderResponse(response);
      } else if (flowState === 'asking_reminder_time') {
        await handleReminderTimeResponse(response);
      }
    } catch (error) {
      console.error('Error processing voice response:', error);
      // Retry asking
      setTimeout(() => {
        if (flowState === 'asking_category') {
          askAboutNextTask();
        } else if (flowState === 'asking_reminder' || flowState === 'asking_reminder_time') {
          startListeningForResponse();
        }
      }, 1000);
    }
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
          {!isSpeaking && !isListening && (
            <div className="text-sm text-muted-foreground">
              Organizing your tasks...
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
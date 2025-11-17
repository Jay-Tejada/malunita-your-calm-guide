import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, ArrowRight, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks, Task } from "@/hooks/useTasks";
import { findTinyTasks } from "@/lib/tinyTaskDetector";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";

interface Step {
  id: string;
  prompt: string;
  field: string;
  multiline?: boolean;
  placeholder?: string;
}

const MORNING_STEPS: Step[] = [
  {
    id: 'top_focus',
    prompt: 'What is the one thing that would make today a successful day?',
    field: 'top_focus',
    placeholder: 'E.g., Ship the new feature, finish the proposal...',
  },
  {
    id: 'priorities',
    prompt: 'Tell me two other important priorities for today.',
    field: 'priority_two',
    multiline: true,
    placeholder: 'Priority 2...\n\nPriority 3...',
  },
  {
    id: 'deep_work',
    prompt: 'What focused work blocks or meetings do you have today?',
    field: 'deep_work_blocks',
    multiline: true,
    placeholder: 'E.g., 2-4pm: Work on UI\n10am: Team standup',
  },
  {
    id: 'idea_dump',
    prompt: "Let's clear your mind. Tell me everything that's floating around.",
    field: 'idea_dump_raw',
    multiline: true,
    placeholder: 'Brain dump everything...',
  },
];

const EVENING_STEPS: Step[] = [
  {
    id: 'wins',
    prompt: 'What went well today?',
    field: 'reflection_wins',
    multiline: true,
    placeholder: 'Celebrate your wins...',
  },
  {
    id: 'improve',
    prompt: 'What can improve?',
    field: 'reflection_improve',
    multiline: true,
    placeholder: 'What would you do differently?',
  },
  {
    id: 'gratitude',
    prompt: 'What are you grateful for?',
    field: 'reflection_gratitude',
    multiline: true,
    placeholder: "Today I'm grateful for...",
  },
  {
    id: 'tomorrow',
    prompt: "What's one thing you want to start with tomorrow?",
    field: 'tomorrow_focus',
    placeholder: 'Tomorrow I will...',
  },
];

interface DailySessionStepsProps {
  sessionId: string;
  isEvening?: boolean;
  onComplete: () => void;
  onUpdateSession: (updates: any) => Promise<void>;
}

export const DailySessionSteps = ({ 
  sessionId, 
  isEvening = false, 
  onComplete,
  onUpdateSession 
}: DailySessionStepsProps) => {
  const steps = isEvening ? EVENING_STEPS : MORNING_STEPS;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFiestaDialog, setShowFiestaDialog] = useState(false);
  const [pendingFiestaTaskIds, setPendingFiestaTaskIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { createTasks } = useTasks();
  const { createSession } = useFiestaSessions();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleVoiceStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      toast({
        title: "Microphone error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const handleVoiceStop = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data.text) {
          setResponses(prev => ({
            ...prev,
            [currentStep.field]: data.text
          }));
        }
      };
    } catch (error: any) {
      toast({
        title: "Transcription failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    const response = responses[currentStep.field];
    
    if (!response?.trim()) {
      toast({
        title: "Response required",
        description: "Please provide a response before continuing",
        variant: "destructive",
      });
      return;
    }

    // Save current step
    const updates: any = {};
    
    if (currentStep.id === 'priorities') {
      // Parse into priority_two and priority_three
      const lines = response.split('\n').filter(l => l.trim());
      updates.priority_two = lines[0]?.trim() || '';
      updates.priority_three = lines[1]?.trim() || '';
    } else if (currentStep.id === 'deep_work') {
      // Parse time blocks
      const blocks = parseTimeBlocks(response);
      updates.deep_work_blocks = blocks;
    } else if (currentStep.id === 'idea_dump') {
      updates.idea_dump_raw = response;
      // Process idea dump into tasks
      await processIdeaDump(response);
    } else {
      updates[currentStep.field] = response;
    }

    await onUpdateSession(updates);

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const parseTimeBlocks = (text: string): Array<{ start: string; end: string; description: string }> => {
    const blocks: Array<{ start: string; end: string; description: string }> = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      // Match patterns like "2-4pm: Description" or "10am-12pm Description"
      const match = line.match(/(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?(?:am|pm)?)\s*:?\s*(.+)/i);
      if (match) {
        blocks.push({
          start: match[1],
          end: match[2],
          description: match[3].trim()
        });
      }
    }
    
    return blocks;
  };

  const processIdeaDump = async (text: string) => {
    try {
      // Use existing extract-tasks function
      const { data, error } = await supabase.functions.invoke('extract-tasks', {
        body: { text, userId: (await supabase.auth.getUser()).data.user?.id }
      });

      if (error) throw error;

      if (data.tasks && data.tasks.length > 0) {
        // Create tasks with daily_session_id
        const tasksToCreate = data.tasks.map((t: any) => ({
          title: t.title,
          category: t.suggested_category || 'inbox',
          context: t.confirmation_prompt,
          daily_session_id: sessionId,
          input_method: 'voice' as const,
        }));

        const createdTasks = await createTasks(tasksToCreate);

        // Update session with processed tasks
        await onUpdateSession({
          idea_dump_processed: data.tasks
        });

        // Check if many of the created tasks are tiny tasks
        const taskObjects = tasksToCreate.map((t, i) => ({
          ...t,
          id: createdTasks?.[i]?.id || `temp-${i}`,
          user_id: '',
          completed: false,
          has_reminder: false,
          reminder_time: undefined,
          has_person_name: false,
          is_time_based: false,
          keywords: undefined,
          is_focus: false,
          focus_date: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          goal_aligned: null,
          alignment_reason: null,
        })) as Task[];

        const tinyTasks = findTinyTasks(taskObjects);
        
        if (tinyTasks.length >= 3) {
          // Show dialog to ask if user wants to bundle into Fiesta
          setPendingFiestaTaskIds(tinyTasks.map(t => t.id));
          setShowFiestaDialog(true);
        } else {
          toast({
            title: "Tasks created",
            description: `${data.tasks.length} tasks extracted from your brain dump`,
          });
        }
      }
    } catch (error: any) {
      console.error('Idea dump processing error:', error);
    }
  };

  const handleSkip = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleConfirmFiesta = async () => {
    try {
      // Create a fiesta session with the tiny tasks
      await createSession({
        tasks_included: pendingFiestaTaskIds,
        duration_minutes: 45, // Default duration
      });

      setShowFiestaDialog(false);
      
      toast({
        title: "Fiesta Ready!",
        description: "Your tiny tasks are bundled and ready. Check your home screen to start.",
      });
    } catch (error) {
      console.error('Failed to create fiesta session:', error);
      toast({
        title: "Error",
        description: "Failed to create Fiesta session",
        variant: "destructive",
      });
    }
  };

  const handleDeclineFiesta = () => {
    setShowFiestaDialog(false);
    toast({
      title: "Tasks created",
      description: `${pendingFiestaTaskIds.length} tasks extracted from your brain dump`,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index <= currentStepIndex 
                ? 'w-8 bg-primary' 
                : 'w-4 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Main prompt card */}
      <Card className="p-8 bg-card border-border/40 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-light text-foreground">
            {currentStep.prompt}
          </p>
        </div>

        {/* Voice orb or mic button */}
        <div className="flex justify-center">
          {isListening || isProcessing ? (
            <div className="relative flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${isProcessing ? 'bg-primary/20' : 'bg-primary/40'} flex items-center justify-center ${!isProcessing && 'animate-pulse'}`}>
                <Mic className="w-6 h-6 text-primary" />
              </div>
              {isListening && (
                <Button
                  onClick={handleVoiceStop}
                  variant="ghost"
                  size="sm"
                >
                  Stop Recording
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleVoiceStart}
              variant="outline"
              size="icon"
              className="w-16 h-16 rounded-full"
            >
              <Mic className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Text input */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Or type your response
          </label>
          {currentStep.multiline ? (
            <Textarea
              value={responses[currentStep.field] || ''}
              onChange={(e) => setResponses(prev => ({
                ...prev,
                [currentStep.field]: e.target.value
              }))}
              placeholder={currentStep.placeholder}
              rows={4}
              className="resize-none"
            />
          ) : (
            <Textarea
              value={responses[currentStep.field] || ''}
              onChange={(e) => setResponses(prev => ({
                ...prev,
                [currentStep.field]: e.target.value
              }))}
              placeholder={currentStep.placeholder}
              rows={2}
              className="resize-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            onClick={handleSkip}
            variant="ghost"
            size="sm"
          >
            Skip
          </Button>

          <Button
            onClick={handleNext}
            disabled={isProcessing}
            className="gap-2"
          >
            {isLastStep ? 'Complete' : 'Next'}
            {isLastStep ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </Card>

      {/* Fiesta Confirmation Dialog */}
      <AlertDialog open={showFiestaDialog} onOpenChange={setShowFiestaDialog}>
        <AlertDialogContent className="font-mono">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <AlertDialogTitle>Tiny Task Fiesta?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              These look like perfect tiny tasks. Want me to bundle them into a Tiny Task Fiesta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeclineFiesta}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFiesta} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Bundle into Fiesta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

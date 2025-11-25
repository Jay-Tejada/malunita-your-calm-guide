import { useState, useEffect } from "react";
import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";
import { OneThingPrompt } from "@/components/home/OneThingPrompt";
import { QuickWins } from "@/components/home/QuickWins";
import { TasksByIntelligence } from "@/components/home/TasksByIntelligence";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useTimeBlocker } from "@/hooks/useTimeBlocker";
import { TimeBlockList } from "@/components/TimeBlockList";

interface HomeCanvasProps {
  children?: React.ReactNode;
  onOneThingClick?: () => void;
  taskCreatedTrigger?: number;
}

export function HomeCanvas({ children, onOneThingClick, taskCreatedTrigger }: HomeCanvasProps) {
  const { showPrompt } = useDailyPriorityPrompt();
  const { data, loading, error, refetch } = useDailyIntelligence();
  const { triggerCompanionPing } = useCompanionEvents();
  const { blocks, isLoading: isLoadingBlocks, generateTimeBlocks } = useTimeBlocker();
  const [showOneThingPrompt, setShowOneThingPrompt] = useState(true);
  const [showTimeBlocks, setShowTimeBlocks] = useState(false);

  // Refetch when taskCreatedTrigger changes
  useEffect(() => {
    if (taskCreatedTrigger && taskCreatedTrigger > 0) {
      refetch();
    }
  }, [taskCreatedTrigger, refetch]);

  // Check localStorage on mount to see if dismissed today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('malunita_one_thing_dismissed');
    
    if (dismissedDate === today) {
      setShowOneThingPrompt(false);
    } else {
      // Clear old dismissal if it's a new day
      localStorage.removeItem('malunita_one_thing_dismissed');
      setShowOneThingPrompt(true);
    }
  }, []);

  // Trigger companion ping when daily intelligence loads successfully
  useEffect(() => {
    if (data && !loading && !error) {
      triggerCompanionPing();
    }
  }, [data, loading, error, triggerCompanionPing]);

  const shouldShowPrompt = showPrompt && showOneThingPrompt;

  const handlePromptClick = () => {
    // Open the task creation dialog
    if (onOneThingClick) {
      onOneThingClick();
    }
    
    // Hide prompt for current session and store in localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('malunita_one_thing_dismissed', today);
    setShowOneThingPrompt(false);
  };

  const handleTaskCreated = () => {
    // Trigger refetch when QuickWins creates a task
    refetch();
  };

  const handleGenerateTimeBlocks = async () => {
    await generateTimeBlocks();
    setShowTimeBlocks(true);
  };

  return (
    <div className="min-h-screen w-full relative">
      <div className="pt-6">
        <MindstreamPanel />
      </div>
      
      {/* One Thing Prompt - positioned above the orb */}
      <div className="flex flex-col items-center justify-center mt-5 md:mt-8">
        {/* Only show ONE of these: loading skeleton, error message, or prompt */}
        {loading ? (
          <div 
            style={{
              height: '16px',
              width: '280px',
              maxWidth: '90%',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '8px',
              margin: '20px auto',
            }}
          />
        ) : error ? (
          <div 
            className="text-center font-mono"
            style={{
              fontSize: '11px',
              opacity: 0.5,
              margin: '20px auto',
              maxWidth: '90%',
            }}
          >
            AI is still waking up. Try again in a few seconds.
          </div>
        ) : shouldShowPrompt ? (
          <div style={{ margin: '20px auto', maxWidth: '90%', width: '100%' }}>
            <OneThingPrompt
              questionText={
                data?.primary_focus || 
                "What is the ONE task that would make today a success?"
              }
              onClick={handlePromptClick}
              subtle={!data?.primary_focus}
            />
          </div>
        ) : null}
        
        {/* Quick Wins */}
        {data?.quick_wins && Array.isArray(data.quick_wins) && data.quick_wins.length > 0 && (
          <QuickWins data={data.quick_wins} onTaskCreated={handleTaskCreated} />
        )}
        
        {/* Time Blocker Button */}
        {!loading && !error && (
          <div className="mt-4 w-full max-w-md px-4">
            <Button
              onClick={handleGenerateTimeBlocks}
              disabled={isLoadingBlocks}
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
            >
              <Clock className="w-4 h-4" />
              🧭 Build a simple day plan
            </Button>
          </div>
        )}

        {/* Time Blocks List */}
        {showTimeBlocks && blocks.length > 0 && (
          <div className="mt-6 w-full max-w-md px-4">
            <TimeBlockList 
              blocks={blocks}
              onTaskClick={(taskId) => {
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                taskElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            />
          </div>
        )}
        
        {/* Orb */}
        {children}
      </div>
      
      {/* Organized Task Lists */}
      <div className="mt-12">
        <TasksByIntelligence />
      </div>
    </div>
  );
}



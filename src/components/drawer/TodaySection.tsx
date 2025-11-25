import { useState, useEffect } from "react";
import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";
import { OneThingPrompt } from "@/components/home/OneThingPrompt";
import { QuickWins } from "@/components/home/QuickWins";
import { TasksByIntelligence } from "@/components/home/TasksByIntelligence";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useTimeBlocker } from "@/hooks/useTimeBlocker";
import { TimeBlockPanel } from "@/components/timeblocking/TimeBlockPanel";

interface TodaySectionProps {
  onOneThingClick?: () => void;
}

export function TodaySection({ onOneThingClick }: TodaySectionProps) {
  const { data, loading, error, refetch } = useDailyIntelligence();
  const { blocks, isLoading: isLoadingBlocks, generateTimeBlocks } = useTimeBlocker();
  const [showOneThingPrompt, setShowOneThingPrompt] = useState(true);
  const [showTimeBlocks, setShowTimeBlocks] = useState(false);

  // Check localStorage on mount to see if dismissed today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('malunita_one_thing_dismissed');
    
    if (dismissedDate === today) {
      setShowOneThingPrompt(false);
    } else {
      localStorage.removeItem('malunita_one_thing_dismissed');
      setShowOneThingPrompt(true);
    }
  }, []);

  const shouldShowPrompt = showOneThingPrompt;

  const handlePromptClick = () => {
    if (onOneThingClick) {
      onOneThingClick();
    }
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('malunita_one_thing_dismissed', today);
    setShowOneThingPrompt(false);
  };

  const handleTaskCreated = () => {
    refetch();
  };

  const handleGenerateTimeBlocks = async () => {
    await generateTimeBlocks();
    setShowTimeBlocks(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Mindstream Panel */}
      <div className="px-1">
        <MindstreamPanel />
      </div>

      {/* One Thing Prompt */}
      {loading ? (
        <div 
          style={{
            height: '16px',
            width: '280px',
            maxWidth: '90%',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            margin: '0 auto',
          }}
        />
      ) : error ? (
        <div 
          className="text-center font-mono text-xs opacity-50 px-4"
        >
          AI is still waking up. Try again in a few seconds.
        </div>
      ) : shouldShowPrompt ? (
        <div className="px-4">
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
        <div className="px-4">
          <QuickWins data={data.quick_wins} onTaskCreated={handleTaskCreated} />
        </div>
      )}

      {/* Time Blocker Button */}
      {!loading && !error && (
        <div className="px-4">
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

      {/* Time Blocks Panel */}
      {showTimeBlocks && blocks.length > 0 && (
        <div className="px-4">
          <TimeBlockPanel 
            blocks={blocks}
            onTaskClick={(taskId) => {
              const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
              taskElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        </div>
      )}

      {/* Tasks organized by intelligence */}
      <div className="px-4">
        <TasksByIntelligence />
      </div>
    </div>
  );
}

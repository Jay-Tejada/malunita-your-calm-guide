import { useState, useEffect } from "react";
import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";
import { OneThingPrompt } from "@/components/home/OneThingPrompt";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useDailyMindstream } from "@/hooks/useDailyMindstream";

interface HomeCanvasProps {
  children?: React.ReactNode;
  onOneThingClick?: () => void;
}

export function HomeCanvas({ children, onOneThingClick }: HomeCanvasProps) {
  const { showPrompt } = useDailyPriorityPrompt();
  const { headline } = useDailyMindstream();
  const [showOneThingPrompt, setShowOneThingPrompt] = useState(true);

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

  return (
    <div className="min-h-screen w-full relative">
      <div className="pt-6">
        <MindstreamPanel />
      </div>
      
      {/* One Thing Prompt - positioned above the orb */}
      <div className="flex flex-col items-center justify-center" style={{ marginTop: '32px' }}>
        {shouldShowPrompt && (
          <div className="mb-4 w-full">
            <OneThingPrompt
              questionText={headline || "What is the ONE task that would make today a success?"}
              onClick={handlePromptClick}
              subtle={!headline}
            />
          </div>
        )}
        
        {/* Orb and other content */}
        {children}
      </div>
    </div>
  );
}



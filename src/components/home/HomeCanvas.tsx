import { useState, useEffect } from "react";
import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";
import { OneThingPrompt } from "@/components/home/OneThingPrompt";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";

interface HomeCanvasProps {
  children?: React.ReactNode;
  onOneThingClick?: () => void;
}

export function HomeCanvas({ children, onOneThingClick }: HomeCanvasProps) {
  const { showPrompt } = useDailyPriorityPrompt();
  const { data, loading, error } = useDailyIntelligence();
  const { triggerCompanionPing } = useCompanionEvents();
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

  return (
    <div className="min-h-screen w-full relative">
      <div className="pt-6">
        <MindstreamPanel />
      </div>
      
      {/* One Thing Prompt - positioned above the orb */}
      <div className="flex flex-col items-center justify-center" style={{ marginTop: '32px' }}>
        {shouldShowPrompt && !loading && (
          <div className="mb-4 w-full">
            <OneThingPrompt
              questionText={
                data?.primary_focus || 
                data?.headline || 
                "What is the ONE task that would make today a success?"
              }
              onClick={handlePromptClick}
              subtle={!data?.primary_focus && !data?.headline}
            />
          </div>
        )}
        
        {/* Orb and other content */}
        {children}
      </div>
    </div>
  );
}



import { useState } from "react";
import { MindstreamPanel } from "@/components/intelligence/MindstreamPanel";
import { OneThingPrompt } from "@/components/home/OneThingPrompt";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";

interface HomeCanvasProps {
  children?: React.ReactNode;
  onOneThingClick?: () => void;
}

export function HomeCanvas({ children, onOneThingClick }: HomeCanvasProps) {
  const { showPrompt } = useDailyPriorityPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  const shouldShowPrompt = showPrompt && !isDismissed;

  const handlePromptClick = () => {
    if (onOneThingClick) {
      onOneThingClick();
    }
    setIsDismissed(true);
  };

  return (
    <div className="min-h-screen w-full relative">
      <div className="pt-6">
        <MindstreamPanel />
      </div>
      
      {/* One Thing Prompt - positioned above the orb */}
      <div className="flex flex-col items-center justify-center" style={{ marginTop: '32px' }}>
        {shouldShowPrompt && (
          <div className="mb-8">
            <OneThingPrompt
              questionText="What is the ONE task that would make today a success?"
              onClick={handlePromptClick}
            />
          </div>
        )}
        
        {/* Orb and other content */}
        {children}
      </div>
    </div>
  );
}



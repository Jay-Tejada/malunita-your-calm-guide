import React, { memo } from "react";
import { PlanningModePanel } from "../planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";

interface OneThingFocus {
  id: string;
  title: string;
  reason: string;
  relief_score: number;
}

interface HomeCanvasProps {
  children?: React.ReactNode;
  oneThingFocus?: OneThingFocus;
  quickWins?: Array<{ id: string; title: string }>;
  followUps?: string[];
  yesterdayDone?: string[];
  carryOverSuggestions?: string[];
  isLoading?: boolean;
  planningMode?: boolean;
  planningText?: string;
  onClosePlanning?: () => void;
}

export const HomeCanvas = memo(function HomeCanvas({
  children, 
  oneThingFocus, 
  planningMode = false,
  planningText = "",
  onClosePlanning,
}: HomeCanvasProps) {
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4">
      {/* Planning Mode Panel - appears above everything with backdrop */}
      {planningMode && onClosePlanning && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <PlanningModePanel 
            initialText={planningText}
            loading={loading}
            error={error}
            result={result}
            onRun={() => runPlanningBreakdown(planningText)}
            onClose={onClosePlanning} 
          />
        </div>
      )}
      
      {/* Clean minimal home - only orb and optional ONE thing */}
      <div className="flex flex-col items-center justify-center gap-6 w-full">
        {/* Optional ONE Thing at top - single line only */}
        {oneThingFocus && (
          <div className="text-center max-w-md mb-4">
            <p className="text-sm text-primary/80 font-medium">
              Today's Focus: {oneThingFocus.title}
            </p>
          </div>
        )}
        
        {/* Orb (includes text and Think With Me button) */}
        {children}
      </div>
    </div>
  );
});



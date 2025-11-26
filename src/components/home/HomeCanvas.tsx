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
    <div 
      className="h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4"
    >
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
      
      {/* Clean minimal home - structured vertical layout */}
      <div className="flex flex-col items-center justify-center w-full">
        {/* Today's Focus text - only if exists */}
        {oneThingFocus && (
          <div 
            className="text-center mb-10"
            style={{ 
              maxWidth: '70vw',
              fontSize: '16px',
              fontWeight: 400,
              color: 'rgba(0, 0, 0, 0.55)',
            }}
          >
            Today's Focus: {oneThingFocus.title}
          </div>
        )}
        
        {/* Orb and content */}
        {children}
      </div>
    </div>
  );
});



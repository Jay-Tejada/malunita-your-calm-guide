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
      
      {/* Clean minimal home - ONLY ONE element above orb */}
      <div className="flex flex-col items-center justify-center gap-8 w-full">
        {/* Show ONLY Today's Focus if it exists, otherwise show nothing here */}
        {oneThingFocus && (
          <div className="text-center max-w-[80%] mb-2">
            <p 
              className="text-sm font-medium"
              style={{ color: '#808080' }}
            >
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



import React, { memo } from "react";
import { TodaysBriefing } from "./TodaysBriefing";
import { OneThingPromptBubble } from "../OneThingPromptBubble";
import { PlanningModePanel } from "../planning/PlanningModePanel";

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
  onSetFocus?: () => void;
  planningMode?: boolean;
  planningText?: string;
  onClosePlanning?: () => void;
}

export const HomeCanvas = memo(function HomeCanvas({
  children, 
  oneThingFocus, 
  quickWins = [], 
  followUps = [],
  yesterdayDone,
  carryOverSuggestions = [],
  isLoading,
  onSetFocus,
  planningMode = false,
  planningText = "",
  onClosePlanning,
}: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4">
      {/* Planning Mode Panel - appears above everything with backdrop */}
      {planningMode && onClosePlanning && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <PlanningModePanel 
            initialText={planningText}
            onClose={onClosePlanning} 
          />
        </div>
      )}
      {/* Clean minimal home - briefing above, orb below */}
      <div className="flex flex-col items-center justify-center gap-8 w-full">
        {/* ONE Thing Prompt - dismissible bubble at top */}
        {onSetFocus && (
          <OneThingPromptBubble
            hasOneThing={!!oneThingFocus}
            onSetFocus={onSetFocus}
          />
        )}
        
        {/* Today's Briefing - collapsed by default, above orb */}
        <TodaysBriefing
          oneThingFocus={oneThingFocus}
          quickWins={quickWins}
          followUps={followUps}
          yesterdayDone={yesterdayDone}
          carryOverSuggestions={carryOverSuggestions}
          isLoading={isLoading}
        />
        
        {/* Orb section */}
        <div className="flex flex-col items-center justify-center gap-8">
          <p className="font-mono text-sm text-muted-foreground">
            What's on your mind?
          </p>
          
          {/* Orb */}
          {children}
        </div>
      </div>
    </div>
  );
});



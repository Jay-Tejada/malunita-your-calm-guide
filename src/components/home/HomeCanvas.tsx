import React, { memo } from "react";
import { TodaysBriefing } from "./TodaysBriefing";
import { OneThingPromptBubble } from "../OneThingPromptBubble";

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
}: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4">
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



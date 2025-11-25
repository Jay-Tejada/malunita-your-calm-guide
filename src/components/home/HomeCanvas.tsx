import { TodaysBriefing } from "./TodaysBriefing";

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
  isLoading?: boolean;
}

export function HomeCanvas({ 
  children, 
  oneThingFocus, 
  quickWins = [], 
  followUps = [],
  yesterdayDone,
  isLoading 
}: HomeCanvasProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center px-4">
      {/* Clean minimal home - briefing above, orb below */}
      <div className="flex flex-col items-center justify-center gap-16 w-full">
        {/* Today's Briefing - collapsed by default, above orb */}
        <TodaysBriefing
          oneThingFocus={oneThingFocus}
          quickWins={quickWins}
          followUps={followUps}
          yesterdayDone={yesterdayDone}
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
}



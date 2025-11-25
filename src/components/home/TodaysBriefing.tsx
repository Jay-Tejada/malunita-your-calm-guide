import { useState } from "react";
import { ChevronDown, Target, Zap, Bell, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OneThingFocus {
  id: string;
  title: string;
  reason: string;
  relief_score: number;
}

interface TodaysBriefingProps {
  oneThingFocus?: OneThingFocus;
  quickWins: Array<{ id: string; title: string }>;
  followUps: string[];
  yesterdayDone?: string[];
  carryOverSuggestions?: string[];
  isLoading?: boolean;
}

export function TodaysBriefing({ 
  oneThingFocus, 
  quickWins, 
  followUps,
  yesterdayDone,
  carryOverSuggestions = [],
  isLoading 
}: TodaysBriefingProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return null;
  }

  const hasContent = oneThingFocus || quickWins.length > 0 || followUps.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg",
          "border border-border/40 bg-background/50 backdrop-blur-sm",
          "hover:bg-accent/5 hover:border-border/60 transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground/90">
            Today's Briefing
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {oneThingFocus && <Target className="w-3 h-3" />}
              {quickWins.length > 0 && <Zap className="w-3 h-3" />}
              {followUps.length > 0 && <Bell className="w-3 h-3" />}
            </div>
          )}
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} 
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-4 py-4 rounded-lg border border-border/40 bg-background/50 backdrop-blur-sm space-y-4">
              
              {/* Yesterday's Progress */}
              {yesterdayDone && yesterdayDone.length > 0 && (
                <div className="pb-4 border-b border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    ✅ Yesterday, you completed {yesterdayDone.length} task{yesterdayDone.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* ONE Thing Focus */}
              {oneThingFocus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Your ONE Thing Today
                    </h3>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm text-foreground/90 font-medium">
                      {oneThingFocus.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {oneThingFocus.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Wins */}
              {quickWins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Quick Wins ({quickWins.length})
                    </h3>
                  </div>
                  <ul className="pl-6 space-y-1">
                    {quickWins.slice(0, 3).map((win) => (
                      <li key={win.id} className="text-xs text-muted-foreground">
                        • {win.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-ups */}
              {followUps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Follow-ups ({followUps.length})
                    </h3>
                  </div>
                  <ul className="pl-6 space-y-1">
                    {followUps.slice(0, 3).map((task, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Carry-over Suggestions */}
              {carryOverSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Carry Over ({carryOverSuggestions.length})
                    </h3>
                  </div>
                  <ul className="pl-6 space-y-1">
                    {carryOverSuggestions.slice(0, 3).map((task, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

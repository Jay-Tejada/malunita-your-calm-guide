import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { useCompanionExpression } from "@/hooks/useCompanionExpression";
import { CompanionExpression } from "./CompanionExpression";
import { ThinkWithMe } from "@/components/ThinkWithMe";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

export function CompanionSidebar() {
  const isMobile = useIsMobile();
  const { currentExpression, autoEmotionTick } = useCompanionExpression();

  // Auto-tick emotions every 10-18 seconds
  useEffect(() => {
    const getRandomInterval = () => {
      return Math.random() * (18000 - 10000) + 10000; // 10-18 seconds
    };

    const scheduleNextTick = () => {
      const interval = getRandomInterval();
      return setTimeout(() => {
        autoEmotionTick();
        scheduleNextTick();
      }, interval);
    };

    const timeoutId = scheduleNextTick();

    return () => clearTimeout(timeoutId);
  }, [autoEmotionTick]);

  // Hidden on mobile
  if (isMobile) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 will-change-contents">
        <div className="w-full max-w-[200px]">
          <CompanionExpression expression={currentExpression} />
        </div>
        
        {/* Think With Me Button */}
        <div className="w-full">
          <ThinkWithMe
            trigger={
              <Button variant="outline" className="gap-2 w-full">
                <Brain className="w-4 h-4" />
                <span>Think With Me</span>
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}

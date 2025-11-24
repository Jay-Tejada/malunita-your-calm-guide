import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { useCompanionExpression } from "@/hooks/useCompanionExpression";
import { CompanionExpression } from "./CompanionExpression";

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
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <CompanionExpression expression={currentExpression} />
      </div>
    </div>
  );
}

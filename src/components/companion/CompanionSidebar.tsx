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
    <aside 
      className="h-full bg-sidebar-bg border-l border-border flex flex-col"
      style={{ padding: "24px" }}
    >
      <div id="companion-visual-slot" className="flex justify-center items-center mb-6">
        <CompanionExpression expression={currentExpression} />
      </div>
      
      <div className="text-muted-foreground">
        Companion Sidebar
      </div>
    </aside>
  );
}

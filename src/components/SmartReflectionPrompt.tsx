import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface SmartReflectionPromptProps {
  onReflect: () => void;
}

export const SmartReflectionPrompt = ({ onReflect }: SmartReflectionPromptProps) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkShouldShow = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Show after 6PM (18:00)
      const isEveningTime = hour >= 18;
      
      // Check if we've shown this today
      const lastShown = localStorage.getItem('last_reflection_prompt');
      const today = now.toISOString().split('T')[0];
      const hasShownToday = lastShown === today;
      
      // Check if user has disabled this feature
      const isDisabled = localStorage.getItem('disable_smart_reflection_prompt') === 'true';
      
      if (isEveningTime && !hasShownToday && !isDisabled) {
        setShouldShow(true);
        // Mark as shown for today
        localStorage.setItem('last_reflection_prompt', today);
        
        // Show with a small delay for smoother entrance
        setTimeout(() => setIsVisible(true), 500);
        
        // Auto-hide after 30 seconds
        setTimeout(() => handleDismiss(), 30000);
      }
    };

    checkShouldShow();
    
    // Check every minute in case time passes to 6PM
    const interval = setInterval(checkShouldShow, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleReflect = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldShow(false);
      onReflect();
    }, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setShouldShow(false), 300);
  };

  if (!shouldShow) return null;

  return (
    <div 
      className={`fixed top-20 right-4 z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full pl-4 pr-2 py-2 shadow-lg flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Reflect on week?</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <span className="text-lg leading-none">×</span>
          </Button>
          <Button
            size="sm"
            onClick={handleReflect}
            className="rounded-full h-7 px-3 text-xs"
          >
            Begin
          </Button>
        </div>
      </div>
    </div>
  );
};
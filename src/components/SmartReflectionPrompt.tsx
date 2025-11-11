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
      className={`fixed bottom-36 sm:bottom-32 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 max-w-[90vw] sm:max-w-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full px-3 sm:px-6 py-2 sm:py-3 shadow-lg flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <p className="text-[11px] sm:text-sm text-muted-foreground text-center sm:text-left">
          Would you like to reflect on your week?
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs sm:text-sm"
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={handleReflect}
            className="gap-1.5 rounded-full h-8 px-4 text-xs sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Begin Review
          </Button>
        </div>
      </div>
    </div>
  );
};
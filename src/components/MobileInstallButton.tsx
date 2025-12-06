import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const MobileInstallButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { canInstall, isInstalled, install } = usePWAInstall();

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled || window.matchMedia('(display-mode: standalone)').matches) {
      setShowButton(false);
      return;
    }

    // Check if mobile or tablet device
    const isMobileOrTablet = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
      (window.innerWidth <= 1024 && 'ontouchstart' in window);
    
    setShowButton(isMobileOrTablet);
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (canInstall) {
      const success = await install();
      if (success) {
        setShowButton(false);
      }
    } else {
      // Fallback for Android browsers without prompt
      setShowIOSGuide(true);
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 gap-2 bg-background/80 backdrop-blur-sm border-border/50"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
      >
        <Download className="w-4 h-4" />
        Install
      </Button>

      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="bg-card border-t border-border rounded-t-2xl p-6 w-full max-w-md animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Install Malunita</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isIOS ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">1</span>
                  </div>
                  <p>Tap the <Share className="inline w-4 h-4 text-primary" /> share button below</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">2</span>
                  </div>
                  <p>Scroll down and tap "Add to Home Screen"</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">3</span>
                  </div>
                  <p>Tap "Add" to install</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">1</span>
                  </div>
                  <p>Tap the menu (⋮) in your browser</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">2</span>
                  </div>
                  <p>Select "Add to Home screen" or "Install app"</p>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mt-6" 
              onClick={() => setShowIOSGuide(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

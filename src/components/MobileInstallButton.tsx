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
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Install Malunita</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isIOS ? (
              <div className="space-y-4 text-foreground">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <p className="pt-1">Tap the <Share className="inline w-5 h-5 text-primary mx-1" /> Share button in Safari's toolbar</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <p className="pt-1">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <p className="pt-1">Tap <strong>"Add"</strong> in the top right</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-foreground">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <p className="pt-1">Tap the <strong>⋮ menu</strong> in your browser</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <p className="pt-1">Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
                </div>
              </div>
            )}

            <Button 
              variant="default" 
              className="w-full mt-8" 
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

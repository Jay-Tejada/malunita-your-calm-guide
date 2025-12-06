import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const MobileInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if mobile or tablet device
    const isMobileOrTablet = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
      (window.innerWidth <= 1024 && 'ontouchstart' in window);
    
    if (!isMobileOrTablet) {
      return;
    }

    // Always show the button on mobile/tablet (not just when prompt is available)
    setShowButton(true);

    // Listen for the beforeinstallprompt event (Android/Chrome only)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS or if prompt not available, show install instructions
      navigate('/install');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowButton(false);
      setDeferredPrompt(null);
    }
  };

  if (!showButton) {
    return null;
  }

  return (
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
  );
};

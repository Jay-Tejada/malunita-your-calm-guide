import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const MobileInstallButton = () => {
  const [showButton, setShowButton] = useState(false);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      setShowButton(false);
      return;
    }

    // Check if mobile or tablet device
    const isMobileOrTablet = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
      (window.innerWidth <= 1024 && 'ontouchstart' in window);
    
    setShowButton(isMobileOrTablet);
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) {
        setShowButton(false);
      }
    } else {
      // For iOS or if prompt not available, show install instructions
      navigate('/install');
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

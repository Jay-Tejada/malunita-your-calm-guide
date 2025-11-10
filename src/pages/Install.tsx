import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, MoreVertical, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
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
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl mb-6">
            <Smartphone className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-light tracking-tight text-foreground mb-3">
            Install Malunita
          </h1>
          <p className="text-muted-foreground text-lg">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-card border border-secondary rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-light mb-2 text-foreground">App Installed!</h2>
            <p className="text-muted-foreground mb-6">
              Malunita is ready to use. You can find it on your home screen.
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Open App
            </Button>
          </div>
        ) : (
          <>
            {/* Android Instructions */}
            <div className="bg-card border border-secondary rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-2">Android</h3>
                  {deferredPrompt ? (
                    <Button onClick={handleInstallClick} className="mb-4">
                      <Download className="w-4 h-4 mr-2" />
                      Install Now
                    </Button>
                  ) : (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>1. Tap the <MoreVertical className="inline w-4 h-4" /> menu icon in your browser</p>
                      <p>2. Select "Add to Home screen" or "Install app"</p>
                      <p>3. Tap "Add" or "Install" to confirm</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* iOS Instructions */}
            <div className="bg-card border border-secondary rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Share className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-2">iPhone</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>1. Tap the <Share className="inline w-4 h-4" /> share icon in Safari</p>
                    <p>2. Scroll down and tap "Add to Home Screen"</p>
                    <p>3. Tap "Add" to install</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Skip for now
              </Button>
            </div>
          </>
        )}

        {/* Benefits */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1">No App Store</h4>
            <p className="text-sm text-muted-foreground">Install directly from your browser</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1">Works Offline</h4>
            <p className="text-sm text-muted-foreground">Access your tasks anytime</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1">Fast & Light</h4>
            <p className="text-sm text-muted-foreground">Loads instantly like a native app</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Install;

import { useState, useEffect, useCallback } from 'react';

// Global storage for the deferred prompt - persists across component mounts
let globalDeferredPrompt: any = null;

// Capture the event as early as possible - this runs once when the module loads
if (typeof window !== 'undefined') {
  const capturePrompt = (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    console.log('[PWA] beforeinstallprompt captured!');
    // Dispatch custom event so components can react
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  };
  
  window.addEventListener('beforeinstallprompt', capturePrompt);
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if we already have a prompt
    if (globalDeferredPrompt) {
      setCanInstall(true);
    }

    // Listen for prompt ready event
    const onPromptReady = () => {
      console.log('[PWA] Hook received prompt-ready event');
      setCanInstall(true);
    };

    // Listen for new prompts
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setCanInstall(true);
      console.log('[PWA] Hook captured beforeinstallprompt');
    };

    // Listen for successful install
    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      globalDeferredPrompt = null;
      console.log('[PWA] App installed');
    };

    window.addEventListener('pwa-prompt-ready', onPromptReady);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!globalDeferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        globalDeferredPrompt = null;
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Install error:', err);
      return false;
    }
  }, []);

  return { canInstall, isInstalled, install };
}

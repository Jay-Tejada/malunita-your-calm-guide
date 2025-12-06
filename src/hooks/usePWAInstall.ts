import { useState, useEffect, useCallback } from 'react';

// Global storage for the deferred prompt - persists across component mounts
let globalDeferredPrompt: any = null;
let promptCaptured = false;

// Capture the event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    promptCaptured = true;
    console.log('[PWA] Install prompt captured globally');
  });
  
  // Log PWA debug info
  console.log('[PWA] Standalone mode:', window.matchMedia('(display-mode: standalone)').matches);
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

    // Listen for new prompts
    const handler = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setCanInstall(true);
      console.log('[PWA] Install prompt captured in hook');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      globalDeferredPrompt = null;
      console.log('[PWA] App installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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

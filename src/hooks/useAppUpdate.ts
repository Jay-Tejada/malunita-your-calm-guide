import { useState, useEffect, useCallback } from 'react';

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Get the existing service worker registration from vite-plugin-pwa
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        console.log('[PWA Update] Service worker ready');
        
        // Check if there's already a waiting worker
        if (reg.waiting) {
          console.log('[PWA Update] Update already waiting');
          setUpdateAvailable(true);
        }

        // Listen for new service worker
        reg.addEventListener('updatefound', () => {
          console.log('[PWA Update] Update found');
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA Update] New version installed and waiting');
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Reload when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PWA Update] Controller changed, reloading...');
          window.location.reload();
        }
      });
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!registration || isChecking) return false;
    
    setIsChecking(true);
    console.log('[PWA Update] Manually checking for updates...');
    
    try {
      await registration.update();
      console.log('[PWA Update] Update check complete');
      
      // Small delay to allow updatefound event to fire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if there's a waiting worker after the update check
      if (registration.waiting) {
        setUpdateAvailable(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA Update] Update check failed:', err);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [registration, isChecking]);

  const applyUpdate = useCallback(() => {
    console.log('[PWA Update] Applying update...');
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No waiting worker, just reload to get latest
      window.location.reload();
    }
  }, [registration]);

  return { 
    updateAvailable, 
    applyUpdate, 
    checkForUpdates, 
    isChecking 
  };
}

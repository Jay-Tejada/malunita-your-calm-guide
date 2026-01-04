import { useState, useEffect, useCallback } from 'react';

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        console.log('[PWA Update] Service worker ready');
        
        // Check if there's already a waiting or installing worker
        if (reg.waiting) {
          console.log('[PWA Update] Update already waiting');
          setUpdateAvailable(true);
        }
        if (reg.installing) {
          console.log('[PWA Update] Update already installing');
          setUpdateAvailable(true);
        }

        // Listen for new service worker
        reg.addEventListener('updatefound', () => {
          console.log('[PWA Update] Update found');
          setUpdateAvailable(true);
          
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA Update] Worker state:', newWorker.state);
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
      // Trigger the update check
      await registration.update();
      console.log('[PWA Update] Update check triggered');
      
      // Check multiple times with increasing delays to catch fast state transitions
      // With skipWaiting: true, updates can transition quickly from installing -> activated
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check all possible states
        if (registration.waiting || registration.installing) {
          console.log('[PWA Update] Update detected during check');
          setUpdateAvailable(true);
          return true;
        }
        
        // Also check if a new active worker exists that's different from the controller
        if (registration.active && navigator.serviceWorker.controller) {
          // Compare script URLs or timestamps if available
          const activeState = registration.active.state;
          console.log('[PWA Update] Active worker state:', activeState);
        }
      }
      
      // No update found
      console.log('[PWA Update] No updates found');
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
      // No waiting worker (skipWaiting already applied), just reload to get latest
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

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
        
        // Only surface an "update available" UI when the new worker is actually waiting.
        // With workbox.skipWaiting=true, updates activate immediately and the app will reload on controllerchange.
        if (reg.waiting) {
          console.log('[PWA Update] Update already waiting');
          setUpdateAvailable(true);
        } else {
          setUpdateAvailable(false);
        }

        // Listen for new service worker
        reg.addEventListener('updatefound', () => {
          console.log('[PWA Update] Update found');

          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA Update] Worker state:', newWorker.state);

              // Only show the banner if the update is waiting to be applied.
              if (newWorker.state === 'installed' && reg.waiting) {
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
          // Ensure any update UI disappears before we reload.
          setUpdateAvailable(false);
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
      console.log('[PWA Update] Update check triggered');

      // Only treat an update as "available" when it's waiting.
      // If skipWaiting is enabled, the app will refresh via controllerchange instead.
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));

        if (registration.waiting) {
          console.log('[PWA Update] Update is waiting');
          setUpdateAvailable(true);
          return true;
        }
      }

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
    // Hide the banner immediately; the app will refresh momentarily.
    setUpdateAvailable(false);

    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No waiting worker (skipWaiting likely enabled), just reload to get latest
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

import { useState, useEffect, useCallback } from 'react';

const APP_VERSION = '1.0.0';

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    checkVersion();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);

        // Check for updates every 30 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 30000);

        // Listen for new service worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        return () => clearInterval(interval);
      }).catch((err) => {
        console.log('Service worker registration failed:', err);
      });

      // Reload when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const checkVersion = async () => {
    try {
      const res = await fetch('/version.json?t=' + Date.now());
      const data = await res.json();

      if (data.version !== APP_VERSION) {
        if (data.forceUpdate) {
          window.location.reload();
        } else {
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      console.log('Version check failed, offline?');
    }
  };

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    } else {
      window.location.reload();
    }
  }, [registration]);

  return { updateAvailable, applyUpdate };
}

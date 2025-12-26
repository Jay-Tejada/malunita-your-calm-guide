import { useState, useCallback, useRef, useEffect } from 'react';

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<void>;
  wakeLockFailed: boolean;
}

export function useWakeLock(): UseWakeLockReturn {
  const [isActive, setIsActive] = useState(false);
  const [wakeLockFailed, setWakeLockFailed] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Wake Lock API not supported');
      setWakeLockFailed(true);
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      setWakeLockFailed(false);
      
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
      
      console.log('Wake lock acquired');
      return true;
    } catch (err) {
      console.error('Wake lock request failed:', err);
      setWakeLockFailed(true);
      return false;
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log('Wake lock released');
      } catch (err) {
        console.error('Wake lock release failed:', err);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Re-acquire wake lock when page becomes visible again (if it was active)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, requestWakeLock]);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock,
    wakeLockFailed,
  };
}

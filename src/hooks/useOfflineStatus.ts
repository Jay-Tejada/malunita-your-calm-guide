import { useState, useEffect } from 'react';
import { offlineQueue } from '@/lib/offline/OfflineQueue';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(offlineQueue.isOnline());
  const [queueLength, setQueueLength] = useState(offlineQueue.getQueueLength());

  useEffect(() => {
    const unsubscribe = offlineQueue.onStatusChange((online) => {
      setIsOnline(online);
      setQueueLength(offlineQueue.getQueueLength());
    });

    // Update queue length periodically
    const interval = setInterval(() => {
      setQueueLength(offlineQueue.getQueueLength());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isOnline, queueLength };
};

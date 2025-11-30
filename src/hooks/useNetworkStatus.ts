import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      toast({
        title: "Back online! 🌐",
        description: "Syncing your changes...",
        duration: 3000,
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      toast({
        title: "You're offline 📴",
        description: "Changes will sync when reconnected",
        duration: 5000,
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  return { isOnline, showOfflineBanner };
}

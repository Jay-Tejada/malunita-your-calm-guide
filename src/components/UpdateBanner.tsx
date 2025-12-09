import { useEffect, useRef } from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useToast } from '@/hooks/use-toast';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (updateAvailable && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "New version available",
        description: "Tap to update to the latest version",
        action: (
          <button
            onClick={applyUpdate}
            className="px-3 py-1.5 rounded text-xs font-medium bg-primary text-primary-foreground"
          >
            Update
          </button>
        ),
      });
    }
  }, [updateAvailable, applyUpdate, toast]);

  if (!updateAvailable) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 p-3 z-50 flex items-center justify-between bg-primary text-primary-foreground"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)'
      }}
    >
      <span className="text-sm font-medium">Update available</span>
      <button
        onClick={applyUpdate}
        className="px-3 py-1 rounded text-sm font-medium bg-background text-foreground"
      >
        Refresh
      </button>
    </div>
  );
}

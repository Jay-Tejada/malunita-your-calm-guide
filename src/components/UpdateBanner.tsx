import { useAppUpdate } from '@/hooks/useAppUpdate';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useAppUpdate();

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

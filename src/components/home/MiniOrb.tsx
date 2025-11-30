import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniOrbProps {
  onClick: () => void;
  label: string;
  position: 'left' | 'right';
}

/**
 * Simple companion silhouette SVG - ghost/blob shape
 */
const CompanionIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M12 3C8.5 3 6 5.5 6 9c0 2.2.8 4 2 5.5l-.8 4 1.8-1.2c.8.4 1.8.7 3 .7s2.2-.3 3-.7l1.8 1.2-.8-4c1.2-1.5 2-3.3 2-5.5 0-3.5-2.5-6-6-6z" />
  </svg>
);

/**
 * MiniOrb - Simple icons for drawer toggles
 * Left: hamburger menu, Right: companion silhouette
 */
export const MiniOrb = ({ onClick, label, position }: MiniOrbProps) => {
  const positionClasses = {
    left: 'fixed top-6 left-6',
    right: 'fixed top-6 right-6',
  };

  const isCompanion = position === 'right';

  return (
    <button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        'z-50 transition-opacity duration-300',
        'text-foreground/20 hover:text-foreground/40'
      )}
      aria-label={label}
    >
      {isCompanion ? (
        <CompanionIcon className="w-5 h-5" />
      ) : (
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      )}
    </button>
  );
};

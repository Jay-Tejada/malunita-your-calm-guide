import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniOrbProps {
  onClick: () => void;
  label: string;
  position: 'left' | 'right';
}

/**
 * MiniOrb - Simple hamburger menu icon for drawer toggles
 */
export const MiniOrb = ({ onClick, label, position }: MiniOrbProps) => {
  const positionClasses = {
    left: 'fixed top-6 left-6',
    right: 'fixed top-6 right-6',
  };

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
      <Menu className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );
};

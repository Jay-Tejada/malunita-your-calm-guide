import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MiniOrbProps {
  onClick: () => void;
  label: string;
  position: 'left' | 'right';
}

/**
 * MiniOrb - Small pearl orb for corner navigation
 * Matches the main orb's visual language with subtle breathing
 */
export const MiniOrb = ({ onClick, label, position }: MiniOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    left: 'fixed top-6 left-6',
    right: 'fixed top-6 right-6',
  };

  return (
    <div className={cn(positionClasses[position], 'z-50 flex flex-col items-center gap-2')}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'w-8 h-8 rounded-full transition-transform duration-300',
          'hover:scale-110 active:scale-95',
          'animate-breathing'
        )}
        style={{
          background: 'radial-gradient(circle at 30% 30%, #fffbf0, #e8c88a)',
          boxShadow: '0 4px 12px rgba(200, 170, 120, 0.2)',
          animationDuration: '8s',
        }}
      />
      
      {isHovered && (
        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest absolute top-12 animate-fade-in">
          {label}
        </span>
      )}
    </div>
  );
};

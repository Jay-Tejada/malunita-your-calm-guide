import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TodaySectionProps {
  label: string;
  icon?: string;
  children: ReactNode;
  variant?: 'default' | 'card' | 'focus';
  className?: string;
}

export function TodaySection({ 
  label, 
  icon, 
  children, 
  variant = 'default',
  className 
}: TodaySectionProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-[10px] uppercase tracking-widest text-accent font-medium">
          {label}
        </span>
      </div>
      
      {/* Section content */}
      {variant === 'card' ? (
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          {children}
        </div>
      ) : variant === 'focus' ? (
        <div className="focus-task-container">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

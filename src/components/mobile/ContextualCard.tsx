import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContextualCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onTap?: () => void;
  priority?: 'normal' | 'urgent' | 'calm';
}

/**
 * ContextualCard - Minimal, intelligent card that shows what matters right now
 */
export const ContextualCard = ({ 
  title, 
  subtitle, 
  icon,
  onTap,
  priority = 'normal'
}: ContextualCardProps) => {
  const priorityStyles = {
    urgent: 'border-destructive/30',
    normal: 'border-border',
    calm: 'border-success/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onTap}
      className={cn(
        "contextual-card",
        "relative w-full max-w-[500px] rounded-3xl",
        "border-2 p-8",
        "min-h-[200px]",
        "flex flex-col items-center justify-center text-center",
        "cursor-pointer transition-all",
        priorityStyles[priority],
        onTap && "active:scale-[0.98]"
      )}
      style={{
        background: 'white',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
      }}
      whileHover={{ 
        scale: onTap ? 1.02 : 1,
        y: onTap ? -4 : 0,
        boxShadow: onTap ? '0 8px 32px rgba(0, 0, 0, 0.12)' : '0 4px 24px rgba(0, 0, 0, 0.08)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Breathing animation overlay */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-3">
        {icon && (
          <div className="text-5xl mb-2">
            {icon}
          </div>
        )}
        
        <h2 className="text-2xl font-semibold text-foreground leading-tight">
          {title}
        </h2>
        
        {subtitle && (
          <p className="text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
        
        {onTap && (
          <motion.p 
            className="text-sm text-muted-foreground/50 mt-2"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Tap to continue
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

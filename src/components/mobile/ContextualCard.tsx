import { motion } from 'framer-motion';

interface ContextualCardProps {
  title: string;
  subtitle?: string | null;
  onTap?: () => void;
}

/**
 * ContextualCard - Minimal floating text that shows what matters right now
 */
export const ContextualCard = ({ 
  title, 
  subtitle, 
  onTap,
}: ContextualCardProps) => {
  return (
    <div
      onClick={onTap}
      className="flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
    >
      <motion.h2 
        className="text-2xl font-light text-foreground/80 leading-tight"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {title}
      </motion.h2>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground/60">
          {subtitle}
        </p>
      )}
    </div>
  );
};

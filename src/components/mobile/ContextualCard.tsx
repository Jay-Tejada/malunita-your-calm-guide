import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Inbox, AlertCircle, Target, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';

interface ContextualCardProps {
  title: string;
  subtitle: string;
  icon?: 'inbox' | 'alert' | 'target' | 'check' | 'journal' | 'sparkles';
  onClick?: () => void;
  className?: string;
}

const iconMap = {
  inbox: Inbox,
  alert: AlertCircle,
  target: Target,
  check: CheckCircle2,
  journal: BookOpen,
  sparkles: Sparkles,
};

/**
 * ContextualCard - Intelligent card that shows what matters right now
 * 
 * Shows different content based on:
 * - Time of day
 * - Pending tasks
 * - User patterns
 * - System state
 */
export const ContextualCard = ({ 
  title, 
  subtitle, 
  icon = 'sparkles',
  onClick,
  className 
}: ContextualCardProps) => {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative min-h-[140px] w-full rounded-3xl",
        "bg-gradient-to-br from-card via-card-strong to-card",
        "border border-border/50",
        "shadow-lg shadow-primary/5",
        "p-6",
        "cursor-pointer active:scale-[0.98] transition-transform",
        onClick && "hover:shadow-xl hover:shadow-primary/10",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Breathing animation background */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative flex flex-col gap-3">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground leading-tight">
            {title}
          </h3>
          <p className="text-sm text-foreground/60 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

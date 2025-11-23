import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonalEvent } from '@/hooks/useSeasonalEvent';
import { Sparkles, Zap, Heart } from 'lucide-react';

export const SeasonalBoostIndicator = () => {
  const { currentSeason, getSeasonalMultiplier } = useSeasonalEvent();
  
  if (!currentSeason) return null;
  
  const joyBoost = getSeasonalMultiplier('joy');
  const xpBoost = getSeasonalMultiplier('xp');
  const hasBoost = joyBoost > 1 || xpBoost > 1;
  
  if (!hasBoost) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span>{currentSeason.name} Active</span>
            {xpBoost > 1 && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3" />
                +{Math.round((xpBoost - 1) * 100)}% XP
              </span>
            )}
            {joyBoost > 1 && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                <Heart className="w-3 h-3" />
                +{Math.round((joyBoost - 1) * 100)}% Joy
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Cloud, Star, Lightbulb, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useCustomCategories, CustomCategory } from '@/hooks/useCustomCategories';
import { CreatureSprite } from '@/components/CreatureSprite';
import { HelperBubble } from '@/components/HelperBubble';
import { cn } from '@/lib/utils';

interface DreamModeProps {
  onClose: () => void;
  onMorningRitual?: () => void;
}

interface DreamSymbol {
  id: string;
  type: 'planet' | 'cloud' | 'star' | 'lightbulb';
  x: number;
  y: number;
  category?: string;
  color?: string;
}

export const DreamMode = ({ onClose, onMorningRitual }: DreamModeProps) => {
  const { tasks } = useTasks();
  const { categories: customCategoryList } = useCustomCategories();
  const [symbols, setSymbols] = useState<DreamSymbol[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);
  const [showMorningRitualPrompt, setShowMorningRitualPrompt] = useState(false);

  // Generate dream symbols based on tasks
  useEffect(() => {
    if (!tasks) return;

    const newSymbols: DreamSymbol[] = [];
    
    // Count categories (planets)
    const categoryColors = {
      inbox: '#8B5CF6',
      home: '#10B981',
      work: '#3B82F6',
      gym: '#F59E0B',
      projects: '#EC4899',
    };

    const categories = ['inbox', 'home', 'work', 'gym', 'projects'];
    const activeTasks = tasks.filter(t => !t.completed);
    
    categories.forEach((category, idx) => {
      const categoryTasks = activeTasks.filter(t => t.category === category);
      if (categoryTasks.length > 0) {
        newSymbols.push({
          id: `planet-${category}`,
          type: 'planet',
          x: 15 + (idx * 18),
          y: 20 + Math.random() * 20,
          category,
          color: categoryColors[category as keyof typeof categoryColors],
        });
      }
    });

    // Custom categories as planets
    customCategoryList?.forEach((cat, idx) => {
      const catTasks = activeTasks.filter(t => t.custom_category_id === cat.id);
      if (catTasks.length > 0) {
        newSymbols.push({
          id: `planet-${cat.id}`,
          type: 'planet',
          x: 20 + (idx * 20),
          y: 50 + Math.random() * 15,
          category: cat.name,
          color: cat.color || '#A78BFA',
        });
      }
    });

    // Overdue tasks (clouds)
    const now = new Date();
    const overdueTasks = activeTasks.filter(t => 
      t.reminder_time && new Date(t.reminder_time) < now
    );
    
    overdueTasks.slice(0, 5).forEach((_, idx) => {
      newSymbols.push({
        id: `cloud-${idx}`,
        type: 'cloud',
        x: 30 + (idx * 15),
        y: 65 + Math.random() * 10,
      });
    });

    // Completed tasks today (stars)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const completedToday = tasks.filter(t => 
      t.completed && 
      t.completed_at && 
      new Date(t.completed_at) >= todayStart
    );

    completedToday.slice(0, 8).forEach((_, idx) => {
      newSymbols.push({
        id: `star-${idx}`,
        type: 'star',
        x: 10 + (idx * 11),
        y: 10 + Math.random() * 30,
      });
    });

    // Ideas (inbox tasks without categories - lightbulbs)
    const ideas = activeTasks.filter(t => !t.category && t.category !== 'inbox');
    ideas.slice(0, 3).forEach((_, idx) => {
      newSymbols.push({
        id: `lightbulb-${idx}`,
        type: 'lightbulb',
        x: 70 + (idx * 10),
        y: 40 + Math.random() * 20,
      });
    });

    setSymbols(newSymbols);
  }, [tasks, customCategoryList]);

  // Generate dream interpretation
  const getDreamInterpretation = () => {
    if (!tasks) return '';

    const activeTasks = tasks.filter(t => !t.completed);
    const planets = symbols.filter(s => s.type === 'planet').length;
    const clouds = symbols.filter(s => s.type === 'cloud').length;
    const stars = symbols.filter(s => s.type === 'star').length;
    const lightbulbs = symbols.filter(s => s.type === 'lightbulb').length;

    let interpretation = 'I dreamt about your tasks... \n\n';

    if (planets > 5) {
      interpretation += '🌍 Many planets appeared — you have a broad upcoming day with tasks across many areas.\n\n';
    } else if (planets > 0) {
      interpretation += `🌍 ${planets} planet${planets > 1 ? 's' : ''} orbited — you have tasks in ${planets} categor${planets > 1 ? 'ies' : 'y'}.\n\n`;
    }

    if (clouds > 3) {
      interpretation += '☁️ Dark clouds gathered — you have several overdue tasks that need attention.\n\n';
    } else if (clouds > 0) {
      interpretation += `☁️ ${clouds} cloud${clouds > 1 ? 's' : ''} drifted by — some tasks need catching up.\n\n`;
    }

    if (stars > 5) {
      interpretation += '⭐ A constellation of stars shone bright — you completed many tasks today! Great work!\n\n';
    } else if (stars > 0) {
      interpretation += `⭐ ${stars} star${stars > 1 ? 's' : ''} twinkled — you made good progress today.\n\n`;
    }

    if (lightbulbs > 0) {
      interpretation += `💡 ${lightbulbs} lightbulb${lightbulbs > 1 ? 's' : ''} flickered — new ideas are waiting to be organized.\n\n`;
    }

    if (activeTasks.length === 0) {
      interpretation += '✨ The dream sky was clear and peaceful — you have no pending tasks!';
    }

    return interpretation;
  };

  // Check if it's morning (6am-10am) for morning ritual prompt
  useEffect(() => {
    const checkMorningRitual = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 10) {
        setShowMorningRitualPrompt(true);
      }
    };

    checkMorningRitual();
  }, []);

  const handleMalunitaTap = () => {
    setShowSummary(true);
    setHelperMessage(getDreamInterpretation());
  };

  const handleClose = () => {
    if (showMorningRitualPrompt && onMorningRitual) {
      // Offer morning ritual
      const shouldStartRitual = window.confirm(
        'Good morning! Would you like to start your Morning Ritual to plan your day?'
      );
      if (shouldStartRitual) {
        onMorningRitual();
      }
    }
    onClose();
  };

  const renderSymbol = (symbol: DreamSymbol) => {
    const commonClasses = "absolute";

    switch (symbol.type) {
      case 'planet':
        return (
          <motion.div
            key={symbol.id}
            className={commonClasses}
            style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div
              className="w-8 h-8 rounded-full shadow-lg"
              style={{ backgroundColor: symbol.color }}
            />
            {symbol.category && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
                {symbol.category}
              </div>
            )}
          </motion.div>
        );

      case 'cloud':
        return (
          <motion.div
            key={symbol.id}
            className={commonClasses}
            style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Cloud className="w-10 h-10 text-gray-400/40" />
          </motion.div>
        );

      case 'star':
        return (
          <motion.div
            key={symbol.id}
            className={commonClasses}
            style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Star className="w-4 h-4 text-yellow-300/60 fill-yellow-300/60" />
          </motion.div>
        );

      case 'lightbulb':
        return (
          <motion.div
            key={symbol.id}
            className={commonClasses}
            style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Lightbulb className="w-6 h-6 text-amber-400/50" />
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 overflow-hidden"
    >
      {/* Starfield background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`star-bg-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Dream symbols */}
      <div className="absolute inset-0">
        {symbols.map(renderSymbol)}
      </div>

      {/* Floating Malunita */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        onClick={handleMalunitaTap}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <CreatureSprite emotion="sleepy" size={120} />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        </div>
      </motion.div>

      {/* Helper bubble */}
      {helperMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32">
          <HelperBubble
            message={helperMessage}
            onDismiss={() => {
              setHelperMessage(null);
              setShowSummary(false);
            }}
          />
        </div>
      )}

      {/* Moon icon */}
      <div className="absolute top-8 left-8">
        <Moon className="w-12 h-12 text-slate-300/40" />
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 -translate-x-1/2"
      >
        <h1 className="text-3xl font-bold text-white/80 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Dream Mode
        </h1>
      </motion.div>

      {/* Legend */}
      <Card className="absolute bottom-8 left-8 p-4 bg-slate-900/60 backdrop-blur-md border-slate-700">
        <h3 className="text-sm font-semibold text-white/90 mb-2">Dream Symbols</h3>
        <div className="space-y-1.5 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span>Planets = Task Categories</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            <span>Clouds = Overdue Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span>Stars = Completed Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span>Lightbulbs = New Ideas</span>
          </div>
        </div>
        <p className="text-xs text-white/50 mt-3 italic">
          Tap Malunita to hear the dream summary
        </p>
      </Card>

      {/* Close button */}
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-8 right-8 text-white/80 hover:text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>
    </motion.div>
  );
};

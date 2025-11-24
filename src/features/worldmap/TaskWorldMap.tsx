import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { useMoodStore } from '@/state/moodMachine';
import { useLevelSystem } from '@/state/levelSystem';
import { CompanionVisual } from '@/components/CompanionVisual';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskWorldMapProps {
  onClose: () => void;
  onPlanetClick: (category: string) => void;
  currentCategory?: string | null;
}

interface Planet {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  icon: string;
  type: 'planet' | 'moon' | 'asteroid' | 'orb';
}

const defaultPlanets: Planet[] = [
  { id: 'inbox', label: 'Inbox', x: 15, y: 50, color: '#9CA3AF', icon: '🌑', type: 'asteroid' },
  { id: 'home', label: 'Home', x: 30, y: 30, color: '#10B981', icon: '🌍', type: 'planet' },
  { id: 'work', label: 'Work', x: 50, y: 20, color: '#3B82F6', icon: '🛸', type: 'planet' },
  { id: 'projects', label: 'Projects', x: 70, y: 40, color: '#8B5CF6', icon: '💎', type: 'orb' },
  { id: 'gym', label: 'Gym', x: 85, y: 60, color: '#F59E0B', icon: '🌙', type: 'moon' },
];

const nebulaSizes = [
  { width: 120, height: 80, blur: 40, opacity: 0.15 },
  { width: 100, height: 100, blur: 50, opacity: 0.12 },
  { width: 90, height: 70, blur: 35, opacity: 0.18 },
];

export const TaskWorldMap = ({ onClose, onPlanetClick, currentCategory }: TaskWorldMapProps) => {
  const { tasks } = useTasks();
  const { categories: customCategories } = useCustomCategories();
  const { mood } = useMoodStore();
  const { level } = useLevelSystem();
  
  const [companionPosition, setCompanionPosition] = useState({ x: 50, y: 50 });
  const [isFlying, setIsFlying] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Generate planets including custom categories
  const allPlanets: Planet[] = [
    ...defaultPlanets,
    ...(customCategories?.map((cat, index) => ({
      id: `custom-${cat.id}`,
      label: cat.name,
      x: 20 + (index * 15) % 60,
      y: 65 + (index % 2) * 10,
      color: cat.color || '#6B7280',
      icon: '⭐',
      type: 'orb' as const,
    })) || []),
  ];

  // Calculate overdue tasks per category
  const getOverdueTasks = (categoryId: string) => {
    const catName = categoryId.replace('custom-', '');
    return tasks?.filter(task => {
      if (task.completed) return false;
      const matchesCategory = categoryId.startsWith('custom-')
        ? task.custom_category_id === catName
        : task.category === categoryId;
      return matchesCategory && task.has_reminder && new Date(task.reminder_time!) < new Date();
    }).length || 0;
  };

  // Get completed tasks count for sparkle effect
  const getCompletedToday = (categoryId: string) => {
    const catName = categoryId.replace('custom-', '');
    const today = new Date().toISOString().split('T')[0];
    return tasks?.filter(task => {
      const matchesCategory = categoryId.startsWith('custom-')
        ? task.custom_category_id === catName
        : task.category === categoryId;
      return matchesCategory && task.completed && task.completed_at?.startsWith(today);
    }).length || 0;
  };

  // Move Malunita to planet
  const flyToPlanet = (planet: Planet) => {
    setIsFlying(true);
    setCompanionPosition({ x: planet.x, y: planet.y });
    
    setTimeout(() => {
      setIsFlying(false);
      onPlanetClick(planet.id);
    }, getMoodBasedDuration());
  };

  // Mood affects flying speed
  const getMoodBasedDuration = () => {
    switch (mood) {
      case 'excited':
      case 'happy':
        return 600;
      case 'angry':
        return 400;
      case 'sleepy':
      case 'sleeping':
        return 1200;
      default:
        return 800;
    }
  };

  // Get flight animation variant
  const getFlightAnimation = () => {
    switch (mood) {
      case 'excited':
        return {
          y: [0, -15, -10, -5, 0],
          rotate: [0, 5, -5, 0],
        };
      case 'angry':
        return {
          y: [0, -8, 0, -8, 0],
          rotate: [0, -3, 3, -3, 0],
        };
      case 'sleepy':
      case 'sleeping':
        return {
          y: [0, 5, 0],
          rotate: [0, 2, -2, 0],
        };
      default:
        return {
          y: [0, -10, 0],
          rotate: [0, 3, -3, 0],
        };
    }
  };

  // Determine unlocked nebula
  const unlockedNebula = level >= 15 ? 'golden-ring' : level >= 10 ? 'crystal' : level >= 5 ? 'stardust' : null;

  // Add sparkle effect
  const addSparkle = (planet: Planet) => {
    const newSparkle = { id: `${planet.id}-${Date.now()}`, x: planet.x, y: planet.y };
    setSparkles(prev => [...prev, newSparkle]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 1500);
  };

  // Show sparkles for recently completed tasks
  useEffect(() => {
    allPlanets.forEach(planet => {
      if (getCompletedToday(planet.id) > 0) {
        addSparkle(planet);
      }
    });
  }, [tasks]);

  // Set initial Malunita position based on current category
  useEffect(() => {
    if (currentCategory) {
      const planet = allPlanets.find(p => p.id === currentCategory);
      if (planet) {
        setCompanionPosition({ x: planet.x, y: planet.y });
      }
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, hsl(var(--background)), hsl(var(--muted)))',
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Nebula background based on level */}
      {unlockedNebula && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {unlockedNebula === 'stardust' && nebulaSizes.map((size, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent)',
                width: size.width,
                height: size.height,
                filter: `blur(${size.blur}px)`,
                opacity: size.opacity,
                left: `${20 + i * 30}%`,
                top: `${10 + i * 25}%`,
              }}
              animate={{
                x: [0, 20, 0],
                y: [0, -15, 0],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
          
          {unlockedNebula === 'crystal' && (
            <>
              <motion.div
                className="absolute w-full h-full"
                style={{
                  background: 'radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.15), transparent 60%)',
                  filter: 'blur(60px)',
                }}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-primary/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                    }}
                  />
                ))}
              </div>
            </>
          )}
          
          {unlockedNebula === 'golden-ring' && (
            <>
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.12), transparent 70%)',
                  filter: 'blur(80px)',
                }}
              />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.15)"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                />
              </svg>
            </>
          )}
        </div>
      )}

      {/* Level badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-border/50">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-medium">Level {level}</span>
          {unlockedNebula && (
            <span className="text-xs text-muted-foreground">
              {unlockedNebula === 'stardust' && '✨ Stardust Field'}
              {unlockedNebula === 'crystal' && '💎 Crystal Nebula'}
              {unlockedNebula === 'golden-ring' && '⭐ Golden Ring Zone'}
            </span>
          )}
        </div>
      </div>

      {/* Planets */}
      <div className="relative w-full h-full">
        {allPlanets.map((planet) => {
          const overdueCount = getOverdueTasks(planet.id);
          const completedToday = getCompletedToday(planet.id);
          const isActive = currentCategory === planet.id;

          return (
            <motion.div
              key={planet.id}
              className="absolute cursor-pointer"
              style={{
                left: `${planet.x}%`,
                top: `${planet.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => flyToPlanet(planet)}
            >
              {/* Overdue clouds */}
              {overdueCount > 0 && (
                <motion.div
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-2xl opacity-60">☁️</div>
                  <div className="absolute -top-1 right-0 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {overdueCount}
                  </div>
                </motion.div>
              )}

              {/* Planet */}
              <motion.div
                className={cn(
                  "relative flex items-center justify-center rounded-full border-2",
                  isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{
                  width: planet.type === 'planet' ? 80 : planet.type === 'moon' ? 60 : 50,
                  height: planet.type === 'planet' ? 80 : planet.type === 'moon' ? 60 : 50,
                  backgroundColor: planet.color,
                  borderColor: `${planet.color}40`,
                  boxShadow: `0 0 20px ${planet.color}60`,
                }}
                animate={{
                  y: [0, -5, 0],
                  rotate: planet.type === 'orb' ? [0, 360] : [0, 0],
                }}
                transition={{
                  duration: planet.type === 'orb' ? 20 : 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <span className="text-3xl">{planet.icon}</span>
                
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-full opacity-30"
                  style={{
                    background: `radial-gradient(circle, ${planet.color}, transparent)`,
                    filter: 'blur(10px)',
                  }}
                />
              </motion.div>

              {/* Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="text-xs font-medium text-foreground/80 text-center px-2 py-1 bg-card/60 backdrop-blur-sm rounded-full">
                  {planet.label}
                </div>
              </div>

              {/* Completion sparkles */}
              {completedToday > 0 && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-success fill-success" />
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Malunita */}
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${companionPosition.x}%`,
            top: `${companionPosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={
            isFlying
              ? {
                  ...getFlightAnimation(),
                  transition: {
                    duration: getMoodBasedDuration() / 1000,
                    ease: mood === 'angry' ? 'linear' : 'easeInOut',
                  },
                }
              : {
                  y: [0, -8, 0],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
          }
        >
          {/* CompanionVisual - COMMENTED OUT - now lives in CompanionSidebar */}
          {/* <CompanionVisual
            emotion={mood === 'sleeping' || mood === 'sleepy' ? 'sleepy' : mood === 'happy' || mood === 'excited' ? 'excited' : 'neutral'}
            motion={isFlying ? 'excited' : 'idle'}
            size="lg"
          /> */}
          
          {/* Trail effect when flying */}
          {isFlying && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Sparkle animations */}
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [1, 0.5, 0],
                y: [0, -30],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              <Sparkles className="w-6 h-6 text-success fill-success" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Stars background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-foreground/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

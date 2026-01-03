import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FastingTimer from '@/components/gym/FastingTimer';
import WorkoutLog from '@/components/gym/WorkoutLog';
import RecentWorkouts from '@/components/gym/RecentWorkouts';
import WeeklyReflection from '@/components/gym/WeeklyReflection';

const Gym = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 text-foreground/30 hover:text-foreground/50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Gym</span>
        <div className="w-9" />
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Fasting Timer */}
        <FastingTimer />
        
        {/* Today's Log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">
              Today's Log
            </p>
            <p className="text-xs text-foreground/30">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          
          <WorkoutLog />
        </div>
        
        {/* Recent Workouts */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">
            Recent
          </p>
          <RecentWorkouts />
        </div>
        
        {/* Weekly Reflection */}
        <WeeklyReflection />
      </div>
    </div>
  );
};

export default Gym;

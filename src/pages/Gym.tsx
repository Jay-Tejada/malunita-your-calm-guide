import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FastingTimer from '@/components/gym/FastingTimer';
import WorkoutLog from '@/components/gym/WorkoutLog';
import RecentWorkouts from '@/components/gym/RecentWorkouts';
import AddSetModal from '@/components/gym/AddSetModal';

const Gym = () => {
  const navigate = useNavigate();
  const [showAddSet, setShowAddSet] = useState(false);

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
          
          {/* Add set button */}
          <button
            onClick={() => setShowAddSet(true)}
            className="w-full mt-3 py-2 text-sm text-foreground/40 hover:text-foreground/60 border border-dashed border-foreground/10 rounded-lg hover:border-foreground/20 transition-colors"
          >
            + Add set
          </button>
        </div>
        
        {/* Notes */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
            Notes
          </p>
          <textarea
            placeholder="How did it feel?"
            className="w-full bg-transparent border border-foreground/10 rounded-lg p-3 text-sm font-mono text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-foreground/20"
            rows={2}
          />
        </div>
        
        {/* Recent Workouts */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">
            Recent
          </p>
          <RecentWorkouts />
        </div>
      </div>

      {/* Add Set Modal */}
      <AddSetModal 
        isOpen={showAddSet} 
        onClose={() => setShowAddSet(false)} 
      />
    </div>
  );
};

export default Gym;

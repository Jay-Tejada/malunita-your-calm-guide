import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { GymTaskList } from "@/components/tasks/GymTaskList";
import { ShowCompletedToggle } from "@/components/shared/ShowCompletedToggle";
import { MobileTaskCapture } from "@/components/shared/MobileTaskCapture";
import { DesktopTaskCapture } from "@/components/shared/DesktopTaskCapture";
import FastingTimer from "@/components/gym/FastingTimer";
import { supabase } from "@/integrations/supabase/client";

const Gym = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);

  // Get gym tasks for completed count
  const gymTasks = tasks?.filter(t => t.category === 'gym') || [];
  const completedCount = gymTasks.filter(t => t.completed).length;

  const handleCapture = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: text,
      category: 'gym'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Gym</span>
        <div className="w-5" />
      </div>

      <div className="px-4 pt-4 pb-24 md:pb-0">
        {/* Fasting Timer */}
        <FastingTimer />
        
        {/* Desktop capture input */}
        <DesktopTaskCapture
          placeholder="Add a fitness task..." 
          onCapture={handleCapture} 
        />

        <GymTaskList showCompleted={showCompleted} />
        <ShowCompletedToggle
          count={completedCount}
          isVisible={showCompleted}
          onToggle={() => setShowCompleted(!showCompleted)}
        />
      </div>
      
      {/* Mobile capture input */}
      <MobileTaskCapture 
        placeholder="Add a fitness task..." 
        onCapture={handleCapture} 
      />
    </div>
  );
};

export default Gym;

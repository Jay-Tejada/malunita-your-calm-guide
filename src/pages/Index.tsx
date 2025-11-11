import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { TaskList } from "@/components/TaskList";
import { TodaysFocus } from "@/components/TodaysFocus";
import { ProfileSettings } from "@/components/ProfileSettings";
import { RunwayReview } from "@/components/RunwayReview";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { SmartReflectionPrompt } from "@/components/SmartReflectionPrompt";
import { useAdmin } from "@/hooks/useAdmin";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { AppSidebar } from "@/components/AppSidebar";

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Globe2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomSidebarTrigger = ({ hasUrgentTasks }: { hasUrgentTasks: boolean }) => {
  const { toggleSidebar } = useSidebar();
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Determine time-based glow colors to match the orb's time-based modes
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      let newTimeOfDay: 'morning' | 'day' | 'evening' | 'night';
      
      if (hour >= 6 && hour < 12) {
        newTimeOfDay = 'morning'; // Golden glow
      } else if (hour >= 12 && hour < 18) {
        newTimeOfDay = 'day'; // Neutral
      } else if (hour >= 18 && hour < 21) {
        newTimeOfDay = 'evening'; // Transitioning to indigo
      } else {
        newTimeOfDay = 'night'; // Indigo glow (reflection mode)
      }
      
      // Trigger transition pulse if time period changed
      if (newTimeOfDay !== timeOfDay) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 3000); // Match transition duration
      }
      
      setTimeOfDay(newTimeOfDay);
    };
    
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [timeOfDay]);
  
  // Time-based glow colors matching the orb
  const getGlowClass = () => {
    if (hasUrgentTasks) return 'animate-alert-pulse';
    
    switch (timeOfDay) {
      case 'morning':
        return 'drop-shadow-[0_0_6px_hsl(39_75%_70%/0.5)] group-hover:drop-shadow-[0_0_10px_hsl(39_75%_70%/0.7)]'; // Golden
      case 'evening':
      case 'night':
        return 'drop-shadow-[0_0_6px_hsl(250_45%_70%/0.5)] group-hover:drop-shadow-[0_0_10px_hsl(250_45%_70%/0.7)]'; // Indigo
      default:
        return 'group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]'; // Default
    }
  };
  
  // Time-based rotation speed - slower for reflection/evening
  const getRotationClass = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'animate-float-spin-morning'; // 6s - energetic morning
      case 'day':
        return 'animate-float-spin-day'; // 8s - normal pace
      case 'evening':
        return 'animate-float-spin-evening'; // 10s - slowing down
      case 'night':
        return 'animate-float-spin-night'; // 14s - slow reflection
      default:
        return 'animate-float-spin';
    }
  };
  
  // Time-based icon color - matches the glow theme
  const getIconColor = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'hsl(var(--planet-morning))'; // Golden
      case 'evening':
        return 'hsl(var(--planet-evening))'; // Indigo transition
      case 'night':
        return 'hsl(var(--planet-night))'; // Indigo
      default:
        return 'hsl(var(--planet-day))'; // Charcoal
    }
  };
  
  // Time-based orbital ring animation speed
  const getOrbitalClass = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'animate-planet-orbit-morning'; // 4s - fast energetic
      case 'day':
        return 'animate-planet-orbit-day'; // 6s - normal
      case 'evening':
        return 'animate-planet-orbit-evening'; // 8s - slowing
      case 'night':
        return 'animate-planet-orbit-night'; // 10s - slow reflection
      default:
        return 'animate-planet-orbit-day';
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hover:bg-muted/50 p-2 group transition-all duration-300 relative h-auto w-auto"
    >
      <div className="relative">
        {/* Orbital Ring */}
        <div className={`absolute inset-0 -m-2 ${getOrbitalClass()}`}>
          <svg className="w-9 h-9" viewBox="0 0 36 36">
            <ellipse
              cx="18"
              cy="18"
              rx="16"
              ry="14"
              fill="none"
              stroke={getIconColor()}
              strokeWidth="0.8"
              className="transition-all duration-700"
              style={{ 
                opacity: 0.4,
                transform: 'rotate(25deg)',
                transformOrigin: 'center'
              }}
            />
          </svg>
        </div>
        
        {/* Planet Icon */}
        <Globe2 
          color={getIconColor()}
          className={`w-5 h-5 transition-all duration-700 group-hover:scale-110 relative z-10 ${getRotationClass()} ${getGlowClass()} ${isTransitioning ? 'animate-transition-pulse' : ''}`} 
        />
      </div>
      
      {hasUrgentTasks && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
      )}
    </Button>
  );
};

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showRunwayReview, setShowRunwayReview] = useState(false);
  const [showTasksSheet, setShowTasksSheet] = useState(false);
  const [showTodaysFocus, setShowTodaysFocus] = useState(false);
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  
  // Runway Review trigger settings (can be managed via settings in future)
  const enableOrbReflectionTrigger = true;
  const enableReflectButton = true;
  const enableSmartPrompt = true;
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { tasks, updateTask } = useTasks();
  const { profile } = useProfile();
  
  const { toast } = useToast();

  // Check for urgent tasks (time-sensitive or with reminders that are incomplete)
  const hasUrgentTasks = tasks?.some(task => 
    !task.completed && (task.has_reminder || task.is_time_based)
  ) ?? false;

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut for creating new task (Q key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle Q if not typing in an input
      if (e.key.toLowerCase() === 'q' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        malunitaVoiceRef.current?.startRecording();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSaveNote = async (text: string, response: string) => {
    // This is now handled in MalunitaVoice component
    // Keeping for backwards compatibility but not actively used
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  const handlePlanningMode = async () => {
    // Show Today's Focus and trigger suggestion
    setShowTodaysFocus(true);
    
    const pendingTasks = tasks?.filter(task => !task.completed && !task.is_focus) || [];
    
    if (pendingTasks.length === 0) {
      toast({
        title: "No tasks to prioritize",
        description: "Add some tasks first, then I can help you focus.",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('suggest-focus', {
        body: { 
          tasks: pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            context: t.context,
            category: t.category,
            has_reminder: t.has_reminder,
            is_time_based: t.is_time_based
          })),
          userProfile: profile
        }
      });

      if (error) throw error;

      const { suggestions, message } = data;
      
      // Apply suggestions to tasks
      const today = new Date().toISOString().split('T')[0];
      for (const suggestion of suggestions) {
        const task = pendingTasks[suggestion.taskIndex];
        if (task) {
          await updateTask({
            id: task.id,
            updates: {
              is_focus: true,
              focus_date: today,
              context: suggestion.reason
            }
          });
        }
      }

      toast({
        title: "Today's Focus updated",
        description: message || `${suggestions.length} task${suggestions.length > 1 ? 's' : ''} selected for focus`,
      });
    } catch (error: any) {
      console.error('Error suggesting focus:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    }
  };

  const handleReflectionMode = () => {
    // Launch Runway Review
    setShowRunwayReview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background py-8">
        <ProfileSettings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <AppSidebar 
          onSettingsClick={() => setShowSettings(true)}
          onAllTasksClick={() => setShowTasksSheet(true)}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Install Banner */}
          <InstallPromptBanner />
          
          {/* Minimal Header - Just trigger */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-3 flex items-center">
              <CustomSidebarTrigger hasUrgentTasks={hasUrgentTasks} />
            </div>
          </header>

          {/* Orb-Centered Minimalist Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16">
            {/* Voice Orb - Center Stage */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-foreground/60 font-mono lowercase tracking-wide">what's on your mind?</p>
              
              <MalunitaVoice 
                ref={malunitaVoiceRef} 
                onSaveNote={handleSaveNote}
                onPlanningModeActivated={handlePlanningMode}
                onReflectionModeActivated={handleReflectionMode}
                onOrbReflectionTrigger={enableOrbReflectionTrigger ? () => setShowRunwayReview(true) : undefined}
                onTasksCreated={() => setShowTodaysFocus(true)}
              />
              
              <p className="text-xs text-foreground/40 font-mono lowercase tracking-wider">malunita — capture mode</p>
            </div>
          </div>

          {/* Smart Reflection Prompt */}
          {enableSmartPrompt && !showRunwayReview && (
            <SmartReflectionPrompt onReflect={() => setShowRunwayReview(true)} />
          )}
        </main>

        {/* Task Sheet - Slide in from right */}
        <Sheet open={showTasksSheet} onOpenChange={setShowTasksSheet}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background">
            <SheetHeader>
              <SheetTitle className="font-mono lowercase">all tasks</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <TaskList />
            </div>
          </SheetContent>
        </Sheet>

        {/* Today's Focus - Slide in from bottom when triggered */}
        {showTodaysFocus && (
          <Sheet open={showTodaysFocus} onOpenChange={setShowTodaysFocus}>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-background">
              <SheetHeader>
                <SheetTitle className="font-mono lowercase">today's focus</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TodaysFocus onReflectClick={enableReflectButton ? () => setShowRunwayReview(true) : undefined} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Runway Review Modal */}
        {showRunwayReview && <RunwayReview onClose={() => setShowRunwayReview(false)} />}
      </div>
    </SidebarProvider>
  );
};

export default Index;

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { TaskList } from "@/components/TaskList";
import { TodaysFocus } from "@/components/TodaysFocus";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { ProfileSettings } from "@/components/ProfileSettings";
import { RunwayReview } from "@/components/RunwayReview";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { SmartReflectionPrompt } from "@/components/SmartReflectionPrompt";
import { TaskStream } from "@/components/TaskStream";
import { useAdmin } from "@/hooks/useAdmin";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { useWakeWord } from "@/hooks/useWakeWord";
import { AppSidebar } from "@/components/AppSidebar";

import { WakeWordIndicator } from "@/components/WakeWordIndicator";

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Globe2, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomSidebarTrigger = ({ hasUrgentTasks }: { hasUrgentTasks: boolean }) => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="hover:bg-muted/50 p-2 group transition-all duration-300 relative h-auto w-auto"
    >
      <Globe2 
        className={`w-5 h-5 text-primary animate-float-spin transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] group-hover:scale-110 ${hasUrgentTasks ? 'animate-alert-pulse' : ''}`} 
      />
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTodaysFocus, setShowTodaysFocus] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(0);
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  
  // Runway Review trigger settings (can be managed via settings in future)
  const enableOrbReflectionTrigger = true;
  const enableReflectButton = true;
  const enableSmartPrompt = true;
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { tasks, updateTask } = useTasks();
  const { profile } = useProfile();
  const { categories: customCategories } = useCustomCategories();
  
  const { toast } = useToast();

  // Wake word detection - triggers voice input hands-free
  const { isListening: isWakeWordListening } = useWakeWord({
    onWakeWordDetected: () => {
      console.log('Wake word detected - activating voice input');
      
      // Trigger visual ripple animation
      setWakeWordDetected(Date.now());
      
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]); // Short-pause-short pattern
      }
      
      // Play notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant two-tone chime
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Activate voice input
      malunitaVoiceRef.current?.startRecording();
      
      toast({
        title: "Voice activated",
        description: "Listening...",
        duration: 1500,
      });
    },
    enabled: !!user && !showSettings && !showRunwayReview,
  });

  // Build complete category list for navigation
  const allCategories = [
    'inbox',
    'projects', 
    'work',
    'home',
    'gym',
    ...(customCategories?.map(c => `custom-${c.id}`) || []),
    'all'
  ];

  const currentCategoryIndex = activeCategory ? allCategories.indexOf(activeCategory) : -1;
  const hasPrevCategory = currentCategoryIndex > 0;
  const hasNextCategory = currentCategoryIndex >= 0 && currentCategoryIndex < allCategories.length - 1;

  const handleCategoryNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrevCategory) {
      setActiveCategory(allCategories[currentCategoryIndex - 1]);
    } else if (direction === 'next' && hasNextCategory) {
      setActiveCategory(allCategories[currentCategoryIndex + 1]);
    }
  };

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
      if (e.key && e.key.toLowerCase() === 'q' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
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
          onCategoryClick={(category) => {
            setActiveCategory(category);
            setShowTodaysFocus(false);
          }}
          activeCategory={activeCategory}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Install Banner */}
          <InstallPromptBanner />
          
          {/* Minimal Header - Just trigger */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="px-4 py-3 flex items-center">
              <CustomSidebarTrigger hasUrgentTasks={hasUrgentTasks} />
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col px-4 pt-16 pb-32 overflow-y-auto">
            {!activeCategory && !showTodaysFocus ? (
              // Default: Voice Orb Centered
              <div className="flex flex-col items-center w-full group py-12">
                <div className="flex justify-center w-full">
                  <MalunitaVoice 
                    ref={malunitaVoiceRef} 
                    onSaveNote={handleSaveNote}
                    onPlanningModeActivated={handlePlanningMode}
                    onReflectionModeActivated={handleReflectionMode}
                    onOrbReflectionTrigger={enableOrbReflectionTrigger ? () => setShowRunwayReview(true) : undefined}
                    onTasksCreated={() => setShowTodaysFocus(true)}
                  />
                </div>
                <p className="mt-6 text-sm text-muted-foreground text-center w-full transition-all duration-300 group-hover:text-foreground group-hover:scale-105">What's on your mind?</p>
              </div>
            ) : activeCategory ? (
              // Task Stream View
              <div className="py-8 pb-48">
                <TaskStream 
                  category={activeCategory} 
                  onClose={() => setActiveCategory(null)}
                  onNavigate={handleCategoryNavigate}
                  hasPrev={hasPrevCategory}
                  hasNext={hasNextCategory}
                />
              </div>
            ) : showTodaysFocus ? (
              // Today's Focus View
              <div className="py-8 pb-48">
                <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-4">
                  <DailySummaryCard />
                  <TodaysFocus onReflectClick={enableReflectButton ? () => setShowRunwayReview(true) : undefined} />
                </div>
              </div>
            ) : null}
            
            {/* Always show voice orb when viewing tasks or focus */}
            {(activeCategory || showTodaysFocus) && (
              <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-8 pointer-events-none" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}>
                <div className="pointer-events-auto">
                  <MalunitaVoice 
                    ref={malunitaVoiceRef} 
                    onSaveNote={handleSaveNote}
                    onPlanningModeActivated={handlePlanningMode}
                    onReflectionModeActivated={handleReflectionMode}
                    onOrbReflectionTrigger={enableOrbReflectionTrigger ? () => setShowRunwayReview(true) : undefined}
                    onTasksCreated={() => setShowTodaysFocus(true)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Smart Reflection Prompt */}
          {enableSmartPrompt && !showRunwayReview && (
            <SmartReflectionPrompt onReflect={() => setShowRunwayReview(true)} />
          )}
          
          {/* Wake Word Listening Indicator */}
          <WakeWordIndicator 
            isListening={isWakeWordListening} 
            wakeWord={profile?.custom_wake_word}
            detectionTrigger={wakeWordDetected}
          />
        </main>

        {/* Runway Review Modal */}
        {showRunwayReview && <RunwayReview onClose={() => setShowRunwayReview(false)} />}
      </div>
    </SidebarProvider>
  );
};

export default Index;

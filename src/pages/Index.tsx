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

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
          <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="px-4 py-3 flex items-center">
              <SidebarTrigger className="hover:bg-muted/50" />
            </div>
          </header>

          {/* Orb-Centered Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-32">
            {/* Voice Orb - Center Stage */}
            <div className="flex flex-col items-center">
            <MalunitaVoice 
              ref={malunitaVoiceRef} 
              onSaveNote={handleSaveNote}
              onPlanningModeActivated={handlePlanningMode}
              onReflectionModeActivated={handleReflectionMode}
              onOrbReflectionTrigger={enableOrbReflectionTrigger ? () => setShowRunwayReview(true) : undefined}
              onTasksCreated={() => setShowTodaysFocus(true)}
            />
              <p className="mt-6 text-sm text-muted-foreground">What's on your mind?</p>
            </div>
            
            {/* Today's Focus - Conditionally shown */}
            {showTodaysFocus && (
              <div className="w-full max-w-2xl mt-12 animate-fade-in">
                <TodaysFocus onReflectClick={enableReflectButton ? () => setShowRunwayReview(true) : undefined} />
              </div>
            )}
          </div>

          {/* Smart Reflection Prompt */}
          {enableSmartPrompt && !showRunwayReview && (
            <SmartReflectionPrompt onReflect={() => setShowRunwayReview(true)} />
          )}
        </main>

        {/* Task Sheet */}
        <Sheet open={showTasksSheet} onOpenChange={setShowTasksSheet}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>All Tasks</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <TaskList />
            </div>
          </SheetContent>
        </Sheet>

        {/* Runway Review Modal */}
        {showRunwayReview && <RunwayReview onClose={() => setShowRunwayReview(false)} />}
      </div>
    </SidebarProvider>
  );
};

export default Index;

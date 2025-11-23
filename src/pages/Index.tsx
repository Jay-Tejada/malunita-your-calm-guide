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
import { FloatingReminder } from "@/components/FloatingReminder";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { CompanionIntroSequence } from "@/components/CompanionIntroSequence";
import { DailySessionView } from "@/components/DailySessionView";
import { FocusMode } from "@/features/focus/FocusMode";
import { TaskWorldMap } from "@/features/worldmap/TaskWorldMap";
import { ShareMalunita } from "@/features/social/ShareMalunita";
import { DreamMode } from "@/features/dreams/DreamMode";
import { CognitiveLoadIndicator } from "@/components/CognitiveLoadIndicator";
import { BondingMeter } from "@/components/BondingMeter";
import { SeasonalHelperBubble } from "@/components/SeasonalHelperBubble";
import { SeasonalBoostIndicator } from "@/components/SeasonalBoostIndicator";
import { useSeasonalEvent } from "@/hooks/useSeasonalEvent";
import { QuestProgressNotification } from "@/features/quests/QuestProgressNotification";
import { useAdmin } from "@/hooks/useAdmin";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { useWakeWord } from "@/hooks/useWakeWord";
import { useWorkflowRituals } from "@/hooks/useWorkflowRituals";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { AppSidebar } from "@/components/AppSidebar";
import { CompanionHub } from "@/components/CompanionHub";
import { TodayView } from "@/components/TodayView";
import { DailyIntelligence } from "@/components/DailyIntelligence";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { startAutoIdleCheck } from "@/state/moodMachine";
import { startCognitiveLoadMonitoring, useCognitiveLoad } from "@/state/cognitiveLoad";
import { useLevelSystem } from "@/state/levelSystem";
import { useCutsceneManager } from "@/features/cutscenes/useCutsceneManager";
import { EvolutionCutscene } from "@/features/cutscenes/EvolutionCutscene";
import { LevelUpCutscene } from "@/features/cutscenes/LevelUpCutscene";
import { RitualCompleteCutscene } from "@/features/cutscenes/RitualCompleteCutscene";

import { WakeWordIndicator } from "@/components/WakeWordIndicator";
import { MoodWeatherLayer } from "@/features/moodWeather/MoodWeatherLayer";
import { AmbientWorld } from "@/features/ambientWorlds/AmbientWorld";
import { SeasonalEventsManager } from "@/features/seasons/SeasonalEventsManager";
import { useAmbientWorld } from "@/hooks/useAmbientWorld";

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Globe2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

const CustomSidebarTrigger = ({ hasUrgentTasks }: { hasUrgentTasks: boolean }) => {
  const { open, setOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    setLongPressTriggered(false);
    
    const timer = setTimeout(() => {
      // Long press completed - toggle theme
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      setLongPressTriggered(true);
      toast({
        title: `Switched to ${newTheme} mode`,
        description: "Long press the globe again to switch back",
      });
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
    }, 800);
    setPressTimer(timer);
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(false);
    
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    // Only trigger sidebar if long press didn't complete
    if (!longPressTriggered) {
      // Short press - open sidebar normally
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      setOpen(!open);
    }
    
    setLongPressTriggered(false);
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={(e) => {
        setIsPressed(false);
        if (pressTimer) {
          clearTimeout(pressTimer);
          setPressTimer(null);
        }
        setLongPressTriggered(false);
      }}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className="hover:bg-muted/50 p-2 group transition-all duration-300 relative h-auto w-auto"
    >
      {/* Progress ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
        style={{ 
          opacity: isPressed ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="100"
          strokeDashoffset="100"
          className="text-primary"
          style={{
            animation: isPressed ? 'progress-ring 800ms linear forwards' : 'none'
          }}
        />
      </svg>
      <Globe2 
        className={`w-5 h-5 text-primary animate-float-spin transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] group-hover:scale-110 ${hasUrgentTasks ? 'animate-alert-pulse' : ''} relative z-10`} 
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
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showShareMalunita, setShowShareMalunita] = useState(false);
  const [showDreamMode, setShowDreamMode] = useState(false);
  const [showCompanionHub, setShowCompanionHub] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTodaysFocus, setShowTodaysFocus] = useState(false);
  const [showDailySession, setShowDailySession] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(0);
  const [taskStreak, setTaskStreak] = useState(0);
  const [lastTaskAddedTime, setLastTaskAddedTime] = useState<number | null>(null);
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  const { currentWorld } = useAmbientWorld();
  
  // Runway Review trigger settings (can be managed via settings in future)
  const enableOrbReflectionTrigger = true;
  const enableReflectButton = true;
  const enableSmartPrompt = true;
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { tasks, updateTask } = useTasks();
  const { profile } = useProfile();
  const { categories: customCategories, createCategory } = useCustomCategories();
  const { companion, isLoading: isCompanionLoading, updateCompanion, needsOnboarding } = useCompanionIdentity();
  const levelSystem = useLevelSystem();
  const { activeCutscene, showLevelUpCutscene, showEvolutionCutscene, dismissCutscene } = useCutsceneManager();
  const { getSeasonalMultiplier } = useSeasonalEvent();
  
  const { toast } = useToast();

  // Companion onboarding handler
  const handleCompanionComplete = async (name: string, personality: PersonalityType) => {
    const colorwayMap = {
      zen: 'zen-default',
      spark: 'spark-default',
      cosmo: 'cosmo-default',
    };

    await updateCompanion({
      name,
      personalityType: personality,
      colorway: colorwayMap[personality],
    });

    toast({
      title: `Welcome, ${name}!`,
      description: `Your ${personality} companion is ready to help you.`,
    });
  };

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

  // Track task streak for companion behaviors
  const handleTaskCreated = () => {
    const now = Date.now();
    
    // Reset streak if more than 5 minutes since last task
    if (lastTaskAddedTime && now - lastTaskAddedTime > 300000) {
      setTaskStreak(1);
    } else {
      setTaskStreak(prev => prev + 1);
    }
    
    setLastTaskAddedTime(now);
    setShowTodaysFocus(true);
    
    // Reset streak after 10 seconds
    setTimeout(() => {
      setTaskStreak(0);
    }, 10000);
  };

  // Workflow Rituals - Morning, Midday, Evening, Weekly
  useWorkflowRituals();
  
  // Check for night-time and offer Dream Mode
  useEffect(() => {
    const checkDreamMode = () => {
      const hour = new Date().getHours();
      const isNightTime = hour >= 22 || hour < 6;
      
      // Auto-show Dream Mode if nighttime and not already shown
      if (isNightTime && !showDreamMode && user && !showSettings) {
        // Only auto-trigger once per session
        const hasAutoTriggered = sessionStorage.getItem('dreamModeAutoTriggered');
        if (!hasAutoTriggered) {
          setTimeout(() => {
            setShowDreamMode(true);
            sessionStorage.setItem('dreamModeAutoTriggered', 'true');
          }, 2000); // Small delay after app load
        }
      }
    };
    
    checkDreamMode();
  }, [user, showDreamMode, showSettings]);
  
  // Start auto-idle mood checking
  useEffect(() => {
    const cleanup = startAutoIdleCheck();
    return cleanup;
  }, []);

  // Start cognitive load monitoring
  useEffect(() => {
    const cleanup = startCognitiveLoadMonitoring();
    return cleanup;
  }, []);

  // Track overdue tasks for cognitive load
  const { updateOverdueTasks, recordCategorySwitch } = useCognitiveLoad();
  useEffect(() => {
    if (tasks) {
      const now = new Date();
      const overdue = tasks.filter(task => 
        !task.completed && 
        task.reminder_time && 
        new Date(task.reminder_time) < now
      ).length;
      updateOverdueTasks(overdue);
    }
  }, [tasks, updateOverdueTasks]);

  // Track category switches for cognitive load
  const prevCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeCategory && prevCategoryRef.current && activeCategory !== prevCategoryRef.current) {
      recordCategorySwitch();
    }
    prevCategoryRef.current = activeCategory;
  }, [activeCategory, recordCategorySwitch]);

  // Watch for level ups and evolution changes
  const prevLevelRef = useRef(levelSystem.level);
  const prevStageRef = useRef(levelSystem.evolutionStage);
  
  useEffect(() => {
    // Check for level up
    if (levelSystem.level > prevLevelRef.current) {
      showLevelUpCutscene(levelSystem.level);
    }
    prevLevelRef.current = levelSystem.level;
    
    // Check for evolution
    if (levelSystem.evolutionStage > prevStageRef.current) {
      showEvolutionCutscene(levelSystem.evolutionStage);
    }
    prevStageRef.current = levelSystem.evolutionStage;
  }, [levelSystem.level, levelSystem.evolutionStage, showLevelUpCutscene, showEvolutionCutscene]);

  // Build complete navigation list including Daily Session
  const allViews = [
    'daily-session',
    'inbox',
    'projects', 
    'work',
    'home',
    'gym',
    ...(customCategories?.map(c => `custom-${c.id}`) || []),
    'all'
  ];

  const getCurrentView = () => {
    if (showDailySession) return 'daily-session';
    return activeCategory;
  };

  const currentViewIndex = getCurrentView() ? allViews.indexOf(getCurrentView()!) : -1;
  const hasPrevView = currentViewIndex > 0;
  const hasNextView = currentViewIndex >= 0 && currentViewIndex < allViews.length - 1;

  const handleViewNavigate = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentViewIndex - 1 : currentViewIndex + 1;
    const newView = allViews[newIndex];
    
    if (newView === 'daily-session') {
      setShowDailySession(true);
      setActiveCategory(null);
      setShowTodaysFocus(false);
    } else {
      setShowDailySession(false);
      setActiveCategory(newView);
      setShowTodaysFocus(false);
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

  const handleFocusMode = () => {
    setShowFocusMode(true);
  };

  const handleWorldMap = () => {
    setShowWorldMap(true);
  };

  const handleWorldMapPlanetClick = (category: string) => {
    setShowWorldMap(false);
    setActiveCategory(category);
    setShowTodaysFocus(false);
    setShowDailySession(false);
  };

  const handleDreamMode = () => {
    setShowDreamMode(true);
  };

  const handleDreamModeClose = () => {
    setShowDreamMode(false);
  };

  const handleMorningRitual = () => {
    setShowDreamMode(false);
    setShowDailySession(true);
    setActiveCategory(null);
    setShowTodaysFocus(false);
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
      <QuestProgressNotification />
      <SeasonalEventsManager>
        <div className="min-h-screen flex w-full relative">
          <AmbientWorld worldId={currentWorld} />
          <MoodWeatherLayer />
        {/* Sidebar - Hidden by default */}
        <AppSidebar 
          onSettingsClick={() => setShowSettings(true)}
          onCompanionHubClick={() => setShowCompanionHub(true)}
          onCategoryClick={(category) => {
            if (category === 'daily-session') {
              setShowDailySession(true);
              setActiveCategory(null);
              setShowTodaysFocus(false);
            } else {
              setActiveCategory(category);
              setShowTodaysFocus(false);
              setShowDailySession(false);
            }
          }}
          activeCategory={activeCategory}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative z-10">
          {/* Install Banner */}
          <InstallPromptBanner />
          
          {/* Fixed Header with Sidebar Trigger */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <div className="px-4 py-3 flex items-center">
              <CustomSidebarTrigger hasUrgentTasks={hasUrgentTasks} />
            </div>
          </header>

          {/* Floating Reminder */}
          <FloatingReminder />

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {showDailySession ? (
              <div className="py-8">
                <DailySessionView 
                  onClose={() => setShowDailySession(false)}
                  onNavigate={handleViewNavigate}
                  hasPrev={hasPrevView}
                  hasNext={hasNextView}
                />
              </div>
            ) : activeCategory && activeCategory !== 'today' ? (
              <div className="py-8">
                <TaskStream 
                  category={activeCategory} 
                  onClose={() => setActiveCategory(null)}
                  onNavigate={handleViewNavigate}
                  hasPrev={hasPrevView}
                  hasNext={hasNextView}
                />
              </div>
            ) : (
              <TodayView />
            )}
          </div>

          {/* Mini Companion - Bottom Right Corner */}
          <div className="fixed bottom-8 right-8 z-30">
            <div 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => setShowCompanionHub(true)}
              style={{ width: '80px', height: '80px' }}
            >
              <CompanionAvatar mode="idle" />
            </div>
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
          
          {/* Cognitive Load Indicator */}
          {user && !showSettings && !showRunwayReview && !showFocusMode && (
            <>
              <CognitiveLoadIndicator />
              <div className="fixed top-20 right-4 z-30">
                <BondingMeter />
              </div>
              <SeasonalHelperBubble />
              <SeasonalBoostIndicator />
            </>
          )}
        </main>

        {/* Runway Review Modal */}
        {showRunwayReview && <RunwayReview onClose={() => setShowRunwayReview(false)} />}
        
        {/* Focus Mode */}
        {showFocusMode && <FocusMode onClose={() => setShowFocusMode(false)} />}
        
        {/* World Map */}
        {showWorldMap && (
          <TaskWorldMap
            onClose={() => setShowWorldMap(false)}
            onPlanetClick={handleWorldMapPlanetClick}
            currentCategory={activeCategory}
          />
        )}
        
        {/* Share Malunita */}
        <ShareMalunita
          open={showShareMalunita}
          onClose={() => setShowShareMalunita(false)}
        />
        
          {/* Mini Companion - Bottom Right Corner */}
          <div className="fixed bottom-8 right-8 z-40">
            <div 
              className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
              onClick={() => setShowCompanionHub(true)}
              style={{ width: '80px', height: '80px' }}
            >
              <CompanionAvatar mode="idle" />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showSettings && <ProfileSettings onClose={() => setShowSettings(false)} />}
      {showRunwayReview && <RunwayReview onClose={() => setShowRunwayReview(false)} />}
      {showFocusMode && <FocusMode onClose={() => setShowFocusMode(false)} />}
      
      {/* Companion Hub */}
      <CompanionHub 
        open={showCompanionHub}
        onClose={() => setShowCompanionHub(false)}
      />

        {/* Cutscenes */}
        {activeCutscene?.type === 'evolution' && (
          <EvolutionCutscene
            stage={activeCutscene.stage}
            onComplete={dismissCutscene}
          />
        )}
        
        {activeCutscene?.type === 'levelup' && (
          <LevelUpCutscene
            level={activeCutscene.level}
            onComplete={dismissCutscene}
          />
        )}
        
        {activeCutscene?.type === 'ritual' && (
          <RitualCompleteCutscene
            type={activeCutscene.ritualType}
            onComplete={dismissCutscene}
          />
        )}
        
        {/* Companion Onboarding - Full Screen Intro Sequence */}
        {!isCompanionLoading && needsOnboarding && (
          <CompanionIntroSequence 
            onComplete={handleCompanionComplete}
          />
        )}
      </div>
      </SeasonalEventsManager>
    </SidebarProvider>
  );
};

export default Index;

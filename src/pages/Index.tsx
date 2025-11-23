import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { ProfileSettings } from "@/components/ProfileSettings";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { SmartReflectionPrompt } from "@/components/SmartReflectionPrompt";
import { FloatingReminder } from "@/components/FloatingReminder";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { CompanionIntroSequence } from "@/components/CompanionIntroSequence";
import { CognitiveLoadIndicator } from "@/components/CognitiveLoadIndicator";
import { BondingMeter } from "@/components/BondingMeter";
import { SeasonalHelperBubble } from "@/components/SeasonalHelperBubble";
import { SeasonalBoostIndicator } from "@/components/SeasonalBoostIndicator";
import { useSeasonalEvent } from "@/hooks/useSeasonalEvent";
import { QuestProgressNotification } from "@/features/quests/QuestProgressNotification";
import { useAdmin } from "@/hooks/useAdmin";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useWakeWord } from "@/hooks/useWakeWord";
import { useWorkflowRituals } from "@/hooks/useWorkflowRituals";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { AppSidebar } from "@/components/AppSidebar";
import { CompanionHub } from "@/components/CompanionHub";
import { CleanCanvas } from "@/components/CleanCanvas";
import { BillboardSuggestion } from "@/components/BillboardSuggestion";
import { CompanionWidget } from "@/components/CompanionWidget";
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
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      setLongPressTriggered(true);
      toast({
        title: `Switched to ${newTheme} mode`,
        description: "Long press the globe again to switch back",
      });
      
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
    
    if (!longPressTriggered) {
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
  const [showCompanionHub, setShowCompanionHub] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(0);
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  const { currentWorld } = useAmbientWorld();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { tasks, updateTask } = useTasks();
  const { profile } = useProfile();
  const { companion, isLoading: isCompanionLoading, updateCompanion, needsOnboarding } = useCompanionIdentity();
  const levelSystem = useLevelSystem();
  const { activeCutscene, showLevelUpCutscene, showEvolutionCutscene, dismissCutscene } = useCutsceneManager();
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

  // Wake word detection
  const { isListening: isWakeWordListening } = useWakeWord({
    onWakeWordDetected: () => {
      console.log('Wake word detected - activating voice input');
      
      setWakeWordDetected(Date.now());
      
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      malunitaVoiceRef.current?.startRecording();
      
      toast({
        title: "Voice activated",
        description: "Listening...",
        duration: 1500,
      });
    },
    enabled: !!user && !showSettings,
  });

  // Workflow Rituals
  useWorkflowRituals();
  
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

  // Track overdue tasks
  const { updateOverdueTasks } = useCognitiveLoad();
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

  // Watch for level ups and evolution
  const prevLevelRef = useRef(levelSystem.level);
  const prevStageRef = useRef(levelSystem.evolutionStage);
  
  useEffect(() => {
    if (levelSystem.level > prevLevelRef.current) {
      showLevelUpCutscene(levelSystem.level);
    }
    prevLevelRef.current = levelSystem.level;
    
    if (levelSystem.evolutionStage > prevStageRef.current) {
      showEvolutionCutscene(levelSystem.evolutionStage);
    }
    prevStageRef.current = levelSystem.evolutionStage;
  }, [levelSystem.level, levelSystem.evolutionStage, showLevelUpCutscene, showEvolutionCutscene]);

  // Check for urgent tasks
  const hasUrgentTasks = tasks?.some(task => 
    !task.completed && (task.has_reminder || task.is_time_based)
  ) ?? false;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut for creating new task (Q key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key && e.key.toLowerCase() === 'q' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        malunitaVoiceRef.current?.startRecording();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Generate billboard suggestions
  const topPriorities = tasks?.filter(t => !t.completed && t.is_focus) || [];
  const quickWins = tasks?.filter(t => !t.completed && !t.is_focus && !t.has_reminder) || [];
  const followUps = tasks?.filter(t => !t.completed && t.has_reminder) || [];

  const billboardSuggestions = [];
  
  if (topPriorities.length > 0) {
    billboardSuggestions.push({
      type: "priority" as const,
      text: `Don't forget: ${topPriorities[0].title}`,
      taskId: topPriorities[0].id,
    });
  }
  
  if (quickWins.length > 0) {
    billboardSuggestions.push({
      type: "quick-win" as const,
      text: `Quick win: ${quickWins[0].title}`,
      taskId: quickWins[0].id,
    });
  }
  
  if (followUps.length > 0) {
    billboardSuggestions.push({
      type: "follow-up" as const,
      text: `Follow up needed: ${followUps[0].title}`,
      taskId: followUps[0].id,
    });
  }

  // Add thinking prompts
  const categories = ['Work', 'Home', 'Gym'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  billboardSuggestions.push({
    type: "thinking-prompt" as const,
    text: `Anything on your mind about ${randomCategory}?`,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
          
          {/* Sidebar */}
          <AppSidebar 
            onSettingsClick={() => setShowSettings(true)}
            onCompanionHubClick={() => setShowCompanionHub(true)}
            onCategoryClick={(category) => {
              // Navigate to category pages
              if (category === 'inbox') navigate('/inbox');
              else if (category === 'today') navigate('/');
              else if (category === 'upcoming') navigate('/upcoming');
              else if (category === 'projects') navigate('/projects');
              else navigate(`/${category}`);
            }}
            activeCategory={null}
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

            {/* Billboard Suggestions */}
            {billboardSuggestions.length > 0 && (
              <BillboardSuggestion
                suggestions={billboardSuggestions}
                onAddToToday={(taskId) => {
                  if (taskId) {
                    updateTask({
                      id: taskId,
                      updates: { is_focus: true },
                    });
                    toast({
                      title: "Added to priorities",
                      description: "Task marked as top priority",
                    });
                  }
                }}
                onMarkDone={(taskId) => {
                  if (taskId) {
                    updateTask({
                      id: taskId,
                      updates: { 
                        completed: true,
                        completed_at: new Date().toISOString(),
                      },
                    });
                    toast({
                      title: "Task completed",
                      description: "Great work!",
                    });
                  }
                }}
                onLater={() => {
                  toast({
                    title: "Suggestion dismissed",
                    description: "We'll remind you later",
                  });
                }}
              />
            )}

            {/* Main Clean Canvas */}
            <div className="flex-1 overflow-y-auto pt-16">
              <CleanCanvas 
                onVoiceInput={() => malunitaVoiceRef.current?.startRecording()}
              />
            </div>

            {/* Companion Widget - Bottom Right */}
            <CompanionWidget 
              onTalkToMalunita={() => malunitaVoiceRef.current?.startRecording()}
              onCompanionSettings={() => setShowCompanionHub(true)}
            />

            {/* Smart Reflection Prompt */}
            <SmartReflectionPrompt onReflect={() => navigate('/runway-review')} />
            
            {/* Wake Word Listening Indicator */}
            <WakeWordIndicator 
              isListening={isWakeWordListening} 
              wakeWord={profile?.custom_wake_word}
              detectionTrigger={wakeWordDetected}
            />
            
            {/* Cognitive Load Indicator */}
            {user && !showSettings && (
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
        </div>
        
        {/* Companion Hub Modal */}
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
        
        {/* Companion Onboarding */}
        {!isCompanionLoading && needsOnboarding && (
          <CompanionIntroSequence 
            onComplete={handleCompanionComplete}
          />
        )}
        
        {/* Hidden Voice Component */}
        <div className="hidden">
          <MalunitaVoice ref={malunitaVoiceRef} />
        </div>
      </SeasonalEventsManager>
    </SidebarProvider>
  );
};

export default Index;

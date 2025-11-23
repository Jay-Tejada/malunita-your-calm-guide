import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { ProfileSettings } from "@/components/ProfileSettings";
import { CompanionIntroSequence } from "@/components/CompanionIntroSequence";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { startAutoIdleCheck } from "@/state/moodMachine";
import { startCognitiveLoadMonitoring, useCognitiveLoad } from "@/state/cognitiveLoad";
import { useLevelSystem } from "@/state/levelSystem";
import { useCutsceneManager } from "@/features/cutscenes/useCutsceneManager";
import { EvolutionCutscene } from "@/features/cutscenes/EvolutionCutscene";
import { LevelUpCutscene } from "@/features/cutscenes/LevelUpCutscene";
import { RitualCompleteCutscene } from "@/features/cutscenes/RitualCompleteCutscene";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { User, Sparkles, Heart, ListTodo } from "lucide-react";
import { Orb } from "@/components/navigation/Orb";
import { TasksPanel } from "@/components/navigation/TasksPanel";
import { CaptureMode } from "@/components/navigation/CaptureMode";
import { CompanionPanel } from "@/components/navigation/CompanionPanel";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMode, setActiveMode] = useState<"idle" | "tasks" | "capture" | "companion">("idle");
  const malunitaVoiceRef = useRef<MalunitaVoiceRef>(null);
  const navigate = useNavigate();
  const { tasks } = useTasks();
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
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Malunita
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content - Three Orbs */}
      <main className="flex flex-col items-center justify-center min-h-screen pt-16 px-4">
        <div className="flex items-center gap-12 md:gap-20">
          {/* Left Orb - Tasks */}
          <Orb
            icon={ListTodo}
            label="Tasks"
            isActive={activeMode === "tasks"}
            onClick={() => setActiveMode("tasks")}
          />

          {/* Center Orb - Capture */}
          <Orb
            icon={Sparkles}
            label="Capture"
            isActive={activeMode === "capture"}
            onClick={() => setActiveMode("capture")}
            pulseAnimation
          />

          {/* Right Orb - Companion */}
          <Orb
            icon={Heart}
            label="Companion"
            isActive={activeMode === "companion"}
            onClick={() => setActiveMode("companion")}
          />
        </div>
      </main>

      {/* Panels */}
      <TasksPanel
        isOpen={activeMode === "tasks"}
        onClose={() => setActiveMode("idle")}
      />

      <CaptureMode
        isOpen={activeMode === "capture"}
        onClose={() => setActiveMode("idle")}
        onVoiceInput={() => malunitaVoiceRef.current?.startRecording()}
      />

      <CompanionPanel
        isOpen={activeMode === "companion"}
        onClose={() => setActiveMode("idle")}
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
    </div>
  );
};

export default Index;

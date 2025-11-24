import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { HomeOrb } from "@/components/HomeOrb";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { useProfile } from "@/hooks/useProfile";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";
import { HomeShell } from "@/layouts/HomeShell";
import { DailyPriorityPrompt } from "@/components/DailyPriorityPrompt";
import { FocusReflectionPrompt } from "@/components/FocusReflectionPrompt";
import { MidDayFocusReminder } from "@/components/MidDayFocusReminder";
import { EndOfDayWrapUp } from "@/components/EndOfDayWrapUp";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useFocusReflection } from "@/hooks/useFocusReflection";
import { useMidDayFocusReminder } from "@/hooks/useMidDayFocusReminder";
import { useEndOfDayWrapUp } from "@/hooks/useEndOfDayWrapUp";
import { usePrimaryFocusPrediction } from "@/hooks/usePrimaryFocusPrediction";
import { useTasks, Task } from "@/hooks/useTasks";
import { AutoFocusNotification } from "@/components/AutoFocusNotification";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>("today");
  const [voiceStatus, setVoiceStatus] = useState<{ isListening: boolean; isProcessing: boolean; isSpeaking: boolean; recordingDuration: number }>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    recordingDuration: 0,
  });
  const { profile } = useProfile();
  const { companion, needsOnboarding, updateCompanion } = useCompanionIdentity();
  const { toast } = useToast();
  const voiceRef = useRef<MalunitaVoiceRef>(null);
  const { checkIfShouldShowPrompt } = useDailyPriorityPrompt();
  const { yesterdaysFocusTask, showPrompt: showReflection, saveReflection, dismissPrompt } = useFocusReflection();
  const { showReminder: showMidDayReminder, focusTask: midDayFocusTask, dismissReminder } = useMidDayFocusReminder();
  const { showWrapUp, completed: wrapUpCompleted } = useEndOfDayWrapUp();
  const { updateTask } = useTasks();
  
  // Initialize prediction system (runs silently in background)
  usePrimaryFocusPrediction();

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

  // Check if we should show the daily priority prompt
  useEffect(() => {
    if (user && !needsOnboarding) {
      checkIfShouldShowPrompt();
    }
  }, [user, needsOnboarding, checkIfShouldShowPrompt]);

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

  if (needsOnboarding) {
    return <CompanionOnboarding open={true} onComplete={handleCompanionComplete} />;
  }

  const handleOrbClick = () => {
    if (voiceRef.current) {
      voiceRef.current.startRecording();
    }
  };

  const getOrbStatus = (): 'ready' | 'listening' | 'processing' | 'speaking' => {
    if (voiceStatus.isSpeaking) return 'speaking';
    if (voiceStatus.isProcessing) return 'processing';
    if (voiceStatus.isListening) return 'listening';
    return 'ready';
  };

  // Stub handlers for HomeShell
  const handleSettingsClick = () => {
    console.log("Settings clicked");
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  const handleFocusModeClick = () => {
    console.log("Focus mode clicked");
  };

  const handleWorldMapClick = () => {
    console.log("World map clicked");
  };

  const handleShareMalunitaClick = () => {
    console.log("Share Malunita clicked");
  };

  const handleDreamModeClick = () => {
    console.log("Dream mode clicked");
  };

  const handleReflectionSubmit = async (outcome: 'done' | 'partial' | 'missed', note?: string) => {
    const { error } = await saveReflection({ outcome, note });
    if (!error) {
      toast({
        title: "Reflection saved",
        description: "Keep up the great work!",
      });
    }
  };

  const handleMidDayTaskSave = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask({ id: taskId, updates });
      toast({
        title: "Task updated",
        description: "Your ONE thing has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AutoFocusNotification />
      <HomeShell
        onSettingsClick={handleSettingsClick}
        onCategoryClick={handleCategoryClick}
        onFocusModeClick={handleFocusModeClick}
        onWorldMapClick={handleWorldMapClick}
        onShareMalunitaClick={handleShareMalunitaClick}
        onDreamModeClick={handleDreamModeClick}
        activeCategory={activeCategory}
      >
        {showReflection && yesterdaysFocusTask && (
          <div className="absolute top-12 sm:top-10 md:top-8 left-0 right-0 flex justify-center z-20 px-4">
            <div className="max-w-xl w-full">
              <FocusReflectionPrompt
                focusTask={yesterdaysFocusTask}
                onSubmit={handleReflectionSubmit}
                onDismiss={dismissPrompt}
              />
            </div>
          </div>
        )}
        {showMidDayReminder && midDayFocusTask && (
          <div className="absolute top-32 sm:top-28 md:top-24 left-0 right-0 flex justify-center z-20 px-4">
            <div className="max-w-xl w-full">
              <MidDayFocusReminder
                focusTask={midDayFocusTask}
                onDismiss={dismissReminder}
                onSave={handleMidDayTaskSave}
              />
            </div>
          </div>
        )}
        <DailyPriorityPrompt />
        {showWrapUp && (
          <div className="mb-6">
            <EndOfDayWrapUp completed={wrapUpCompleted} />
          </div>
        )}
        <HomeOrb
          onCapture={handleOrbClick} 
          isRecording={isRecording} 
          status={getOrbStatus()}
          recordingDuration={voiceStatus.recordingDuration}
        />
      </HomeShell>
      
      <MalunitaVoice 
        ref={voiceRef} 
        onRecordingStateChange={setIsRecording}
        onStatusChange={setVoiceStatus}
      />
    </>
  );
};

export default Index;

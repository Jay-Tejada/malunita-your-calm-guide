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
import { DailyIntelligence } from "@/components/DailyIntelligence";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useFocusReflection } from "@/hooks/useFocusReflection";
import { useMidDayFocusReminder } from "@/hooks/useMidDayFocusReminder";
import { useEndOfDayWrapUp } from "@/hooks/useEndOfDayWrapUp";
import { usePrimaryFocusPrediction } from "@/hooks/usePrimaryFocusPrediction";
import { useTasks, Task } from "@/hooks/useTasks";
import { AutoFocusNotification } from "@/components/AutoFocusNotification";
import { CompanionContextMessage } from "@/components/CompanionContextMessage";
import { fetchDailyPlan, DailyPlan } from "@/lib/ai/fetchDailyPlan";
import { fetchDailyAlerts, DailyAlerts } from "@/lib/ai/fetchDailyAlerts";

interface AISummary {
  decisions: string[];
  ideas: string[];
  clarifyingQuestions: string[];
  emotion: string;
  focus: string | null;
}

interface AIPatterns {
  habits: string[];
  anti_habits: string[];
  peak_energy_times: string[];
  avoidance_patterns: string[];
  common_contexts: string[];
  stress_triggers: string[];
  opportunity_zones: string[];
}

interface AIPreferences {
  preferred_task_length: string;
  preferred_daily_load: number;
  preferred_times: string[];
  task_style: string;
  energy_curve: string;
  notification_style: string;
}

interface AIPredictions {
  likely_state: string;
  risk_of_overwhelm: number;
  recommended_focus_window: string;
  recommended_workload: number;
  motivational_suggestion: string;
}

interface AIProactive {
  headline: string;
  suggestions: string[];
  warnings: string[];
  opportunities: string[];
  energy_timing: string;
  micro_habits: string[];
}


const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>("today");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [aiPlan, setAiPlan] = useState<DailyPlan | null>(null);
  const [aiAlerts, setAiAlerts] = useState<DailyAlerts | null>(null);
  const [aiPatterns, setAiPatterns] = useState<AIPatterns | null>(null);
  const [aiPreferences, setAiPreferences] = useState<AIPreferences | null>(null);
  const [aiPredictions, setAiPredictions] = useState<AIPredictions | null>(null);
  const [aiProactive, setAiProactive] = useState<AIProactive | null>(null);
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

  // Fetch daily plan on mount
  useEffect(() => {
    if (user) {
      fetchDailyPlan(user.id).then((plan) => {
        if (plan) {
          setAiPlan(plan);
        }
      });
      
      fetchDailyAlerts().then((alerts) => {
        if (alerts) {
          setAiAlerts(alerts);
        }
      });
    }
  }, [user]);

  // Fetch AI intelligence on mount
  useEffect(() => {
    if (!user) return;

    const fetchAIIntelligence = async () => {
      try {
        console.log('Fetching AI intelligence...');

        // Fetch pattern recognition
        const { data: patternsData, error: patternsError } = await supabase.functions.invoke('pattern-recognition');
        if (!patternsError && patternsData?.insights) {
          setAiPatterns(patternsData.insights);
          console.log('Patterns loaded:', patternsData.insights);
        } else if (patternsError) {
          console.warn('Pattern recognition error:', patternsError);
        }

        // Fetch preference learner
        const { data: preferencesData, error: preferencesError } = await supabase.functions.invoke('preference-learner');
        if (!preferencesError && preferencesData?.preferences) {
          setAiPreferences(preferencesData.preferences);
          console.log('Preferences loaded:', preferencesData.preferences);
        } else if (preferencesError) {
          console.warn('Preference learner error:', preferencesError);
        }

        // Fetch behavior predictor
        const { data: predictionsData, error: predictionsError } = await supabase.functions.invoke('behavior-predictor');
        if (!predictionsError && predictionsData?.prediction) {
          setAiPredictions(predictionsData.prediction);
          console.log('Predictions loaded:', predictionsData.prediction);
        } else if (predictionsError) {
          console.warn('Behavior predictor error:', predictionsError);
        }

        // Fetch proactive suggestions
        const { data: proactiveData, error: proactiveError } = await supabase.functions.invoke('proactive-suggestions');
        if (!proactiveError && proactiveData?.suggestions) {
          setAiProactive(proactiveData.suggestions);
          console.log('Proactive suggestions loaded:', proactiveData.suggestions);
        } else if (proactiveError) {
          console.warn('Proactive suggestions error:', proactiveError);
        }

        console.log('AI intelligence fetch complete');
      } catch (error) {
        console.error('Error fetching AI intelligence:', error);
      }
    };

    fetchAIIntelligence();
  }, [user]);

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
      <CompanionContextMessage />
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
        {aiSummary && (
          <div className="max-w-2xl mx-auto px-4 mb-8">
            <DailyIntelligence 
              aiSummary={aiSummary} 
              aiPlan={aiPlan} 
              aiAlerts={aiAlerts}
              aiPatterns={aiPatterns}
              aiPreferences={aiPreferences}
              aiPredictions={aiPredictions}
              aiProactive={aiProactive}
            />
          </div>
        )}
        <HomeOrb
          onCapture={handleOrbClick} 
          isRecording={isRecording} 
          status={getOrbStatus()}
          recordingDuration={voiceStatus.recordingDuration}
          onAISummaryUpdate={setAiSummary}
          onAIPlanUpdate={setAiPlan}
          onAIAlertsUpdate={setAiAlerts}
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

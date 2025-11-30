import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { OrbMeditationV2 } from "@/components/OrbMeditationV2";
import { ThinkWithMe } from "@/components/ThinkWithMe";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { useProfile } from "@/hooks/useProfile";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";
import { HomeShell } from "@/layouts/HomeShell";
import { HomeCanvas } from "@/components/home/HomeCanvas";
import { DailyPriorityPrompt, DailyPriorityPromptRef } from "@/components/DailyPriorityPrompt";
import { useDailyReset } from "@/hooks/useDailyReset";
import { usePrimaryFocusPrediction } from "@/hooks/usePrimaryFocusPrediction";
import { AutoFocusNotification } from "@/components/AutoFocusNotification";
import { CompanionContextMessage } from "@/components/CompanionContextMessage";
import { fetchDailyPlan, DailyPlan } from "@/lib/ai/fetchDailyPlan";
import { fetchDailyAlerts, DailyAlerts } from "@/lib/ai/fetchDailyAlerts";
import { useCaptureSessions } from "@/hooks/useCaptureSessions";
import { LastCapturePreview } from "@/components/LastCapturePreview";
import { CaptureHistoryModal } from "@/components/CaptureHistoryModal";
import { useDailyMindstream } from "@/hooks/useDailyMindstream";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { NotebookFeed } from "@/components/NotebookFeed";
import { QuickCapture } from "@/components/QuickCapture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNavigate } from "react-router-dom";
import { FloatingCompanion } from "@/components/mobile/FloatingCompanion";
import { useCompanionMessages } from "@/hooks/useCompanionMessages";
import { useIsMobile } from "@/hooks/use-mobile";

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
  // Initialize daily reset monitoring
  useDailyReset();
  
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
  const [taskCreatedTrigger, setTaskCreatedTrigger] = useState(0);
  const { profile } = useProfile();
  const { companion, needsOnboarding, updateCompanion } = useCompanionIdentity();
  const { toast } = useToast();
  const voiceRef = useRef<MalunitaVoiceRef>(null);
  const dailyPriorityRef = useRef<DailyPriorityPromptRef>(null);
  const { sessions, lastSession } = useCaptureSessions();
  const [showCaptureHistory, setShowCaptureHistory] = useState(false);
  const mindstreamData = useDailyMindstream();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showThinkWithMe, setShowThinkWithMe] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Initialize prediction system (runs silently in background)
  usePrimaryFocusPrediction();

  // Initialize companion messages (contextual)
  const { message: companionMessage, action: companionAction, dismissMessage } = useCompanionMessages();
  const isMobile = useIsMobile();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onQuickCapture: () => setQuickCaptureOpen(true),
    onFocusInput: () => inputRef.current?.focus(),
    onDailyReview: () => navigate('/daily-session'),
    onCloseModals: () => {
      setQuickCaptureOpen(false);
      setShowThinkWithMe(false);
      setShowCaptureHistory(false);
    },
  });

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

  const handleTaskCreated = () => {
    // Trigger refetch in HomeCanvas
    setTaskCreatedTrigger(prev => prev + 1);
  };

  const handlePlanningModeActivated = (text: string) => {
    setPlanningText(text);
    setPlanningMode(true);
  };

  const handleCapture = async (text: string) => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Process text input using the processInput API
      const { data, error } = await supabase.functions.invoke('process-input', {
        body: { text, userId: user.id }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to process your input. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Trigger task refetch
      handleTaskCreated();
      
      // Show success
      toast({
        title: "Captured!",
        description: "Your thought has been processed.",
      });
    } catch (error) {
      console.error('Error capturing text:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
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
        {/* Modals and prompts - not visible on main canvas */}
        <DailyPriorityPrompt ref={dailyPriorityRef} onTaskCreated={handleTaskCreated} />
        
        <HomeCanvas
          oneThingFocus={mindstreamData.oneThingFocus}
          planningMode={planningMode}
          planningText={planningText}
          onClosePlanning={() => setPlanningMode(false)}
        >
          {/* Sacred space - OrbMeditationV2 at top */}
          <OrbMeditationV2
            onCapture={handleCapture}
            onVoiceCapture={() => voiceRef.current?.startRecording()}
            onThinkWithMe={() => setShowThinkWithMe(true)}
            userName={profile?.companion_name || 'there'}
            isRecording={voiceStatus.isListening}
            isProcessing={voiceStatus.isProcessing}
          />

          {/* Notebook feed below orb */}
          <div className="mt-12">
            <NotebookFeed
              onEntryClick={(entry) => {
                console.log('Entry clicked:', entry);
              }}
              onEntryComplete={(id) => {
                handleTaskCreated();
              }}
              onEntryDelete={(id) => {
                handleTaskCreated();
              }}
            />
          </div>
        </HomeCanvas>
      </HomeShell>
      
      {/* Quick Capture Modal - triggered by Cmd+K */}
      <QuickCapture
        open={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
        onCapture={handleCapture}
      />

      {/* Capture history modal */}
      <CaptureHistoryModal
        open={showCaptureHistory}
        onOpenChange={setShowCaptureHistory}
        sessions={sessions || []}
        onSessionClick={(session) => {
          // Could add logic to highlight related tasks in the task list
          console.log('Session clicked:', session);
        }}
      />
      
      {/* Think With Me - render conditionally */}
      {showThinkWithMe && (
        <Dialog open={showThinkWithMe} onOpenChange={setShowThinkWithMe}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <ThinkWithMe />
          </DialogContent>
        </Dialog>
      )}
      
      <MalunitaVoice
        ref={voiceRef} 
        onRecordingStateChange={setIsRecording}
        onStatusChange={setVoiceStatus}
        onPlanningModeActivated={handlePlanningModeActivated}
      />

      {/* Floating companion for mobile */}
      {isMobile && (
        <FloatingCompanion
          message={companionMessage}
          action={companionAction}
          onDismiss={dismissMessage}
          visible={!needsOnboarding}
        />
      )}
    </>
  );
};

export default Index;

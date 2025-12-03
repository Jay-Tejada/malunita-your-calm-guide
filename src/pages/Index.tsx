import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { Moon, Sun } from "lucide-react";
import StartMyDayPhase1 from "@/components/rituals/StartMyDayPhase1";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ThinkWithMe } from "@/components/ThinkWithMe";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { useProfile } from "@/hooks/useProfile";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";
import { HomeShell } from "@/layouts/HomeShell";
import { HomeCanvas } from "@/components/home/HomeCanvas";
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
import { QuickCapture } from "@/components/QuickCapture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNavigate } from "react-router-dom";
import { FloatingCompanion } from "@/components/mobile/FloatingCompanion";
import { useCompanionMessages } from "@/hooks/useCompanionMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActionableBanner } from "@/components/home/ActionableBanner";
import { FocusSection } from "@/components/home/FocusSection";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import Orb from "@/components/Orb";
import CompanionMessage from "@/components/CompanionMessage";
import ProgressIndicator from "@/components/ProgressIndicator";
import { useDailyRituals } from "@/hooks/useDailyRituals";
import Search from "@/components/Search";
import { useTasks } from "@/hooks/useTasks";
import { generateFlowSessions, FlowSession } from "@/utils/taskCategorizer";
import FlowSessionCard from "@/components/FlowSessionCard";

// Lazy load heavy modal components
const MorningRitual = lazy(() => import("@/components/rituals/MorningRitual"));
const EveningSummary = lazy(() => import("@/components/EveningSummary"));
const MorningSummary = lazy(() => import("@/components/MorningSummary"));
const FocusSession = lazy(() => import("@/components/FocusSession"));
const TinyTaskParty = lazy(() => import("@/components/TinyTaskParty"));

// Minimal loader for modals
const ModalLoader = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 animate-pulse" />
  </div>
);

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
  const { sessions, lastSession } = useCaptureSessions();
  const [showCaptureHistory, setShowCaptureHistory] = useState(false);
  const mindstreamData = useDailyMindstream();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const [showThinkWithMe, setShowThinkWithMe] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Initialize prediction system (runs silently in background)
  usePrimaryFocusPrediction();

  // Initialize companion messages (contextual)
  const { message: companionMessage, action: companionAction, dismissMessage } = useCompanionMessages();
  const isMobile = useIsMobile();
  const { isOnline } = useOfflineStatus();
  
  // Direct orb recording state
  const [isOrbRecording, setIsOrbRecording] = useState(false);
  const [isOrbProcessing, setIsOrbProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Daily rituals
  const {
    shouldShowMorning,
    shouldShowEvening,
    completeMorning,
    completeEvening,
    dismissMorning,
    dismissEvening,
  } = useDailyRituals();
  const [showMorningRitual, setShowMorningRitual] = useState(false);
  const [showEveningSummary, setShowEveningSummary] = useState(false);
  const [showMorningSummary, setShowMorningSummary] = useState(false);
  
  // Flow sessions
  const { tasks, updateTask, createTasks } = useTasks();
  const [activeSession, setActiveSession] = useState<FlowSession | null>(null);
  const [sessionMode, setSessionMode] = useState<'focus' | 'party' | null>(null);
  
  const flowSessions = useMemo(() => {
    if (!tasks) return [];
    const todayTasks = tasks.filter(t => 
      !t.completed && 
      (t.scheduled_bucket === 'today' || !t.scheduled_bucket)
    );
    return generateFlowSessions(todayTasks);
  }, [tasks]);
  
  const handleStartSession = (session: FlowSession) => {
    setActiveSession(session);
    if (session.type === 'tiny_task_fiesta') {
      setSessionMode('party');
    } else {
      setSessionMode('focus');
    }
  };
  
  const handleCompleteTask = async (taskId: string) => {
    await updateTask({ id: taskId, updates: { completed: true, completed_at: new Date().toISOString() } });
  };
  
  // Time-based button visibility
  const hour = new Date().getHours();
  
  // Quick capture state (mobile swipe-up on orb, desktop Q//)
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  
  // Desktop quick capture modal state
  const [showDesktopCapture, setShowDesktopCapture] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(() => {
    // Only show hint if never used before
    return !localStorage.getItem('captureHintDismissed');
  });
  
  // Global keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if already typing somewhere
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'q' || e.key === '/') {
        e.preventDefault();
        setShowDesktopCapture(true);
        // Hide hint after first use
        if (showKeyboardHint) {
          localStorage.setItem('captureHintDismissed', 'true');
          setShowKeyboardHint(false);
        }
      }
      
      if (e.key === 'Escape') {
        setShowDesktopCapture(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, showKeyboardHint]);

  // Dismiss keyboard hint when desktop capture is opened (via orb click or keyboard)
  useEffect(() => {
    if (showDesktopCapture && showKeyboardHint) {
      localStorage.setItem('captureHintDismissed', 'true');
      setShowKeyboardHint(false);
    }
  }, [showDesktopCapture, showKeyboardHint]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onQuickCapture: () => setQuickCaptureOpen(true),
    onFocusInput: () => inputRef.current?.focus(),
    onDailyReview: () => navigate('/daily-session'),
    onCloseModals: () => {
      setQuickCaptureOpen(false);
      setShowThinkWithMe(false);
      setShowCaptureHistory(false);
      setShowSearch(false);
    },
  });
  
  // Search keyboard shortcuts (Cmd/Ctrl+K and /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // / key (forward slash)
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
    navigate('/settings');
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
        description: "Captured",
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

  const handleVoiceCapture = () => {
    if (isOrbRecording) {
      // Stop recording
      stopOrbRecording();
    } else if (!isOrbProcessing) {
      // Start recording
      startOrbRecording();
    }
  };

  const startOrbRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processOrbRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsOrbRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to use voice capture.",
        variant: "destructive"
      });
    }
  };

  const stopOrbRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsOrbRecording(false);
    setIsOrbProcessing(true);
  };

  const processOrbRecording = async (audioBlob: Blob) => {
    try {
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // Transcribe via edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const text = data?.text?.trim();
      if (text) {
        await createTasks([{
          title: text,
          category: 'inbox',
          input_method: 'voice',
        }]);
        
        toast({
          description: "Added to inbox",
        });
        handleTaskCreated();
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Error",
        description: "Failed to process voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOrbProcessing(false);
    }
  };

  return (
    <>
      {/* Morning ritual */}
      {showMorningRitual && (
        <Suspense fallback={<ModalLoader />}>
          <MorningRitual 
            onComplete={() => {
              completeMorning();
              setShowMorningRitual(false);
            }} 
            onDismiss={() => {
              dismissMorning();
              setShowMorningRitual(false);
            }} 
          />
        </Suspense>
      )}
      
      {/* Evening summary */}
      <Suspense fallback={<ModalLoader />}>
        <EveningSummary 
          isOpen={showEveningSummary}
          onClose={() => {
            completeEvening();
            setShowEveningSummary(false);
          }} 
        />
      </Suspense>
      
      {/* Morning summary */}
      <Suspense fallback={<ModalLoader />}>
        <MorningSummary
          isOpen={showMorningSummary}
          onClose={() => setShowMorningSummary(false)}
        />
      </Suspense>
      
      <ActionableBanner />
      <OfflineIndicator />
      
      {isMobile ? (
        /* MOBILE LAYOUT - Minimal & Thumb-Optimized */
        <div className="mobile-home min-h-screen bg-background flex flex-col px-4">
          {/* Offline banner */}
          {!isOnline && (
            <div className="sticky top-0 -mx-4 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center py-2 text-sm">
              📴 Offline - Changes will sync when connected
            </div>
          )}

          {/* CENTER STAGE - Focus task */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <FocusSection />
            
            {/* Flow session suggestion */}
            {flowSessions.length > 0 && !activeSession && (
              <div className="w-full max-w-sm mt-6">
                <FlowSessionCard 
                  session={flowSessions[0]} 
                  onStart={() => handleStartSession(flowSessions[0])} 
                />
              </div>
            )}
          </div>

          {/* BOTTOM ZONE - Orb grounded in bottom third */}
          <div className="mt-auto pb-24 flex flex-col items-center justify-center relative gap-6">
            {/* Time-based ritual buttons */}
            <div className="flex justify-center">
              {hour >= 5 && hour < 12 && (
                <button
                  onClick={() => setShowMorningSummary(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
                >
                  <Sun className="w-3.5 h-3.5" />
                  Start my day
                </button>
              )}
              
              {hour >= 17 && hour < 24 && (
                <button
                  onClick={() => setShowEveningSummary(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
                >
                  <Moon className="w-3.5 h-3.5" />
                  Wind down
                </button>
              )}
            </div>
            
            <div className={`flex flex-col items-center transition-transform duration-200 ${showQuickCapture ? 'translate-y-5' : ''}`}>
              <Orb
                size={140}
                onClick={handleVoiceCapture}
                isRecording={isOrbRecording}
                isProcessing={isOrbProcessing}
              />
              {/* Status text below orb */}
              {(isOrbRecording || isOrbProcessing) && (
                <p className="mt-3 text-xs text-muted-foreground/40 animate-fade-in">
                  {isOrbRecording ? 'listening...' : 'transcribing...'}
                </p>
              )}
            </div>
            
            {/* Companion zone - message and progress */}
            <div className="flex flex-col items-center gap-4">
              <div className="min-h-[20px]">
                <CompanionMessage onStartSession={handleStartSession} />
              </div>
              <ProgressIndicator />
            </div>
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT - Minimal & Focused */
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
            <HomeCanvas
              oneThingFocus={mindstreamData.oneThingFocus}
              planningMode={planningMode}
              planningText={planningText}
              onClosePlanning={() => setPlanningMode(false)}
            >
              {/* Minimal desktop home - clean & focused */}
              <div className="relative min-h-[85vh] flex flex-col">
              {/* CENTER STAGE - Focus task */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <StartMyDayPhase1 
                    userName={profile?.companion_name || "Friend"}
                    taskCount={tasks?.filter(t => t.scheduled_bucket === 'today' && !t.completed).length || 0}
                    inboxCount={tasks?.filter(t => !t.scheduled_bucket && !t.completed).length || 0}
                    onNext={(intention) => console.log("User's intention:", intention)}
                  />
                  <FocusSection />
                  
                  {/* Flow session suggestion */}
                  {flowSessions.length > 0 && !activeSession && (
                    <div className="w-full max-w-md mt-6 px-4">
                      <FlowSessionCard 
                        session={flowSessions[0]} 
                        onStart={() => handleStartSession(flowSessions[0])} 
                      />
                    </div>
                  )}
                </div>

                {/* BOTTOM - Orb grounded in bottom third */}
                <div className="mt-auto pb-16 flex flex-col items-center justify-center gap-2">
                  {/* Time-based ritual buttons */}
                  <div className="flex justify-center mb-4">
                    {hour >= 5 && hour < 12 && (
                      <button
                        onClick={() => setShowMorningSummary(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
                      >
                        <Sun className="w-3.5 h-3.5" />
                        Start my day
                      </button>
                    )}
                    
                    {hour >= 17 && hour < 24 && (
                      <button
                        onClick={() => setShowEveningSummary(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
                      >
                        <Moon className="w-3.5 h-3.5" />
                        Wind down
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Orb
                      size={180}
                      onClick={handleVoiceCapture}
                      isRecording={isOrbRecording}
                      isProcessing={isOrbProcessing}
                    />
                    {/* Status text below orb */}
                    {(isOrbRecording || isOrbProcessing) && (
                      <p className="mt-3 text-xs text-muted-foreground/40 animate-fade-in">
                        {isOrbRecording ? 'listening...' : 'transcribing...'}
                      </p>
                    )}
                  </div>
                  
                  {/* Keyboard hint - fades after first use */}
                  {showKeyboardHint && !isOrbRecording && !isOrbProcessing && (
                    <p className="text-[10px] text-muted-foreground/20 animate-fade-in">
                      Click orb or press Q to capture
                    </p>
                  )}
                  
                  {/* Search hint */}
                  <p className="text-[10px] text-muted-foreground/20 text-center mt-1">
                    Press / to search
                  </p>
                  
                  {/* Companion zone - message and progress */}
                  <div className="flex flex-col items-center gap-4 mt-2">
                    <div className="min-h-[20px]">
                      <CompanionMessage onStartSession={handleStartSession} />
                    </div>
                    <ProgressIndicator />
                  </div>
                </div>
              </div>
            </HomeCanvas>
          </HomeShell>
        </>
      )}
      
      {/* Quick Capture - Mobile variant (swipe up on orb) */}
      {isMobile && (
        <QuickCapture
          isOpen={showQuickCapture}
          onClose={() => setShowQuickCapture(false)}
          variant="mobile"
          onCapture={handleTaskCreated}
        />
      )}
      
      {/* Quick Capture - Desktop variant (Q or / keyboard shortcut, or orb click) */}
      {!isMobile && (
        <QuickCapture
          isOpen={showDesktopCapture}
          onClose={() => setShowDesktopCapture(false)}
          variant="desktop"
          onCapture={handleTaskCreated}
        />
      )}

      {/* Capture history modal (desktop only) */}
      {!isMobile && (
        <CaptureHistoryModal
        open={showCaptureHistory}
        onOpenChange={setShowCaptureHistory}
        sessions={sessions || []}
        onSessionClick={(session) => {
          // Could add logic to highlight related tasks in the task list
            console.log('Session clicked:', session);
          }}
        />
      )}
      
      {/* Think With Me - render conditionally (desktop only) */}
      {showThinkWithMe && (
        <Dialog open={showThinkWithMe} onOpenChange={setShowThinkWithMe}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <ThinkWithMe />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Voice system (desktop only) */}
      {!isMobile && (
        <MalunitaVoice
          ref={voiceRef} 
          onRecordingStateChange={setIsRecording}
          onStatusChange={setVoiceStatus}
          onPlanningModeActivated={handlePlanningModeActivated}
        />
      )}
      
      {/* Search modal */}
      <Search isOpen={showSearch} onClose={() => setShowSearch(false)} />
      
      {/* Active Flow Sessions */}
      {sessionMode === 'party' && activeSession && (
        <Suspense fallback={<ModalLoader />}>
          <TinyTaskParty
            tasks={activeSession.tasks}
            onComplete={handleCompleteTask}
            onClose={() => {
              setActiveSession(null);
              setSessionMode(null);
            }}
          />
        </Suspense>
      )}

      {sessionMode === 'focus' && activeSession && (
        <Suspense fallback={<ModalLoader />}>
          <FocusSession
            session={activeSession}
            onComplete={handleCompleteTask}
            onClose={() => {
              setActiveSession(null);
              setSessionMode(null);
            }}
          />
        </Suspense>
      )}
    </>
  );
};

export default Index;

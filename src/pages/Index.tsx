import { useState, useEffect, useRef } from "react";
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
import { QuickCapture } from "@/components/QuickCapture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNavigate } from "react-router-dom";
import { FloatingCompanion } from "@/components/mobile/FloatingCompanion";
import { useCompanionMessages } from "@/hooks/useCompanionMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActionableBanner } from "@/components/home/ActionableBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VoiceSheet } from "@/components/mobile/VoiceSheet";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { ContextualCard } from "@/components/mobile/ContextualCard";
import { SimpleOrb } from "@/components/mobile/SimpleOrb";
import { useContextualPrompt } from "@/hooks/useContextualPrompt";
import { Check, Clock, Pencil } from "lucide-react";
import CompanionMessage from "@/components/CompanionMessage";
import ProgressIndicator from "@/components/ProgressIndicator";
import { useDailyRituals } from "@/hooks/useDailyRituals";
import MorningRitual from "@/components/rituals/MorningRitual";
import EveningRitual from "@/components/rituals/EveningRitual";
import RitualPrompt from "@/components/RitualPrompt";

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
  const { isOnline } = useOfflineStatus();
  
  // Mobile-specific state
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  
  // Contextual prompt for mobile
  const contextualPrompt = useContextualPrompt();
  
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
  const [showEveningRitual, setShowEveningRitual] = useState(false);
  
  // State for focus task actions
  const [showFocusActions, setShowFocusActions] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [focusTaskData, setFocusTaskData] = useState<{ id: string; reminderTime: string | null } | null>(null);
  const isFocusTask = contextualPrompt.subtitle === "Today's main focus";
  
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

  // Fetch focus task data when needed
  useEffect(() => {
    if (isFocusTask && user) {
      const fetchFocusTask = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('tasks')
          .select('id, reminder_time')
          .eq('user_id', user.id)
          .eq('is_focus', true)
          .eq('focus_date', today)
          .maybeSingle();
        if (data) {
          setFocusTaskData({ id: data.id, reminderTime: data.reminder_time });
        }
      };
      fetchFocusTask();
    }
  }, [isFocusTask, user]);
  
  // Helper to format scheduled time
  const formatScheduledTime = (timeString: string) => {
    const date = new Date(timeString);
    const hour = date.getHours();
    
    if (hour === 9) return 'morning';
    if (hour === 13) return 'afternoon';
    if (hour === 18) return 'evening';
    
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: hour !== 0 ? '2-digit' : undefined });
  };
  
  // Close scheduler on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showScheduler) {
        setShowScheduler(false);
      }
    };
    if (showScheduler) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showScheduler]);

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
  
  // Listen for contextual card actions
  useEffect(() => {
    const handleOpenDailyPriority = () => {
      if (dailyPriorityRef.current) {
        // Trigger daily priority prompt
        dailyPriorityRef.current.openDialog();
      }
    };
    
    window.addEventListener('open-daily-priority', handleOpenDailyPriority);
    return () => window.removeEventListener('open-daily-priority', handleOpenDailyPriority);
  }, []);

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
    if (isMobile) {
      setVoiceSheetOpen(true);
    } else {
      voiceRef.current?.startRecording();
    }
  };

  return (
    <>
      {/* Morning ritual */}
      {showMorningRitual && (
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
      )}
      
      {/* Evening ritual */}
      {showEveningRitual && (
        <EveningRitual 
          onComplete={() => {
            completeEvening();
            setShowEveningRitual(false);
          }} 
          onDismiss={() => {
            dismissEvening();
            setShowEveningRitual(false);
          }} 
        />
      )}
      
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

          {/* CENTER STAGE - Focus text floats in center */}
          {contextualPrompt.title && (
            <div className="pt-[35vh] flex flex-col items-center justify-center gap-4">
              {isEditing && isFocusTask ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && editText.trim() && focusTaskData) {
                      await supabase.from('tasks').update({ title: editText.trim() }).eq('id', focusTaskData.id);
                      setIsEditing(false);
                      toast({ description: "Task updated" });
                      window.location.reload();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                  className="text-2xl font-mono font-light text-foreground/80 leading-tight text-center bg-transparent border-b border-foreground/20 px-4 py-2 focus:outline-none focus:border-foreground/40"
                />
              ) : (
                <>
                  <ContextualCard
                    title={contextualPrompt.title}
                    subtitle={contextualPrompt.subtitle}
                    onTap={isFocusTask ? () => setShowFocusActions(!showFocusActions) : contextualPrompt.action || undefined}
                  />
                  {isFocusTask && focusTaskData?.reminderTime && (
                    <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                      Scheduled for {formatScheduledTime(focusTaskData.reminderTime)}
                    </p>
                  )}
                </>
              )}
              {isFocusTask && showFocusActions && !isEditing && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex justify-center items-center gap-6">
                    <button
                      onClick={async () => {
                        if (focusTaskData) {
                          await supabase.from('tasks').update({ completed: true }).eq('id', focusTaskData.id);
                          setShowFocusActions(false);
                          toast({ description: "Focus task completed!" });
                          window.location.reload();
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Done
                    </button>
                    
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowScheduler(!showScheduler);
                              }}
                              className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                            
                            {showScheduler && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background border border-foreground/10 rounded-lg shadow-sm py-2 z-50 min-w-[140px]"
                              >
                          {[
                            { label: 'Morning', time: '09:00' },
                            { label: 'Afternoon', time: '13:00' },
                            { label: 'Evening', time: '18:00' },
                            { label: '9am', time: '09:00' },
                            { label: '12pm', time: '12:00' },
                            { label: '3pm', time: '15:00' },
                            { label: '6pm', time: '18:00' },
                          ].map((slot) => (
                            <button
                              key={slot.label}
                              onClick={async () => {
                                if (focusTaskData) {
                                  const today = new Date().toISOString().split('T')[0];
                                  const reminderTime = `${today}T${slot.time}:00`;
                                  await supabase.from('tasks').update({ reminder_time: reminderTime }).eq('id', focusTaskData.id);
                                  setFocusTaskData({ ...focusTaskData, reminderTime });
                                  setShowScheduler(false);
                                  toast({ description: `Scheduled for ${slot.label.toLowerCase()}` });
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-foreground/70 hover:bg-foreground/5 transition-colors"
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditText(contextualPrompt.title || '');
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTTOM ZONE - Orb grounded in bottom third */}
          <div className="mt-auto pb-24 flex flex-col items-center justify-center relative gap-6">
            {/* Ritual prompts */}
            {shouldShowMorning && !showMorningRitual && (
              <RitualPrompt 
                type="morning" 
                onTap={() => setShowMorningRitual(true)}
                onDismiss={dismissMorning}
              />
            )}
            {shouldShowEvening && !showEveningRitual && (
              <RitualPrompt 
                type="evening" 
                onTap={() => setShowEveningRitual(true)}
                onDismiss={dismissEvening}
              />
            )}
            
            <div className={`transition-transform duration-200 ${showQuickCapture ? 'translate-y-5' : ''}`}>
              <SimpleOrb
                onTap={handleVoiceCapture}
                onSwipeUp={() => setShowQuickCapture(true)}
                isRecording={voiceStatus.isListening}
                isProcessing={voiceStatus.isProcessing}
              />
            </div>
            
            {/* Companion zone - message and progress */}
            <div className="flex flex-col items-center gap-4">
              <div className="min-h-[20px]">
                <CompanionMessage />
              </div>
              <ProgressIndicator />
            </div>
          </div>

           {/* Voice sheet */}
          <VoiceSheet
            open={voiceSheetOpen}
            onOpenChange={setVoiceSheetOpen}
            onStartRecording={() => voiceRef.current?.startRecording()}
            onStopRecording={() => {
              setVoiceSheetOpen(false);
            }}
            isRecording={voiceStatus.isListening}
            isProcessing={voiceStatus.isProcessing}
            recordingDuration={voiceStatus.recordingDuration}
          />
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
            {/* Modals and prompts - not visible on main canvas */}
            <DailyPriorityPrompt ref={dailyPriorityRef} onTaskCreated={handleTaskCreated} />
            
            <HomeCanvas
              oneThingFocus={mindstreamData.oneThingFocus}
              planningMode={planningMode}
              planningText={planningText}
              onClosePlanning={() => setPlanningMode(false)}
            >
              {/* Minimal desktop home - clean & focused */}
              <div className="relative min-h-[85vh] flex flex-col">
                {/* CENTER STAGE - Focus text floats in center */}
                {contextualPrompt.title && (
                  <div className="pt-[35vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-full max-w-md">
                      {isEditing && isFocusTask ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && editText.trim() && focusTaskData) {
                              await supabase.from('tasks').update({ title: editText.trim() }).eq('id', focusTaskData.id);
                              setIsEditing(false);
                              toast({ description: "Task updated" });
                              window.location.reload();
                            } else if (e.key === 'Escape') {
                              setIsEditing(false);
                            }
                          }}
                          autoFocus
                          className="text-2xl font-mono font-light text-foreground/80 leading-tight text-center bg-transparent border-b border-foreground/20 px-4 py-2 focus:outline-none focus:border-foreground/40 w-full"
                        />
                      ) : (
                        <>
                          <ContextualCard
                            title={contextualPrompt.title}
                            subtitle={contextualPrompt.subtitle}
                            onTap={isFocusTask ? () => setShowFocusActions(!showFocusActions) : contextualPrompt.action || undefined}
                          />
                          {isFocusTask && focusTaskData?.reminderTime && (
                            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest text-center mt-2">
                              Scheduled for {formatScheduledTime(focusTaskData.reminderTime)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {isFocusTask && showFocusActions && !isEditing && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex justify-center items-center gap-6">
                          <button
                            onClick={async () => {
                              if (focusTaskData) {
                                await supabase.from('tasks').update({ completed: true }).eq('id', focusTaskData.id);
                                setShowFocusActions(false);
                                toast({ description: "Focus task completed!" });
                                window.location.reload();
                              }
                            }}
                            className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Done
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowScheduler(!showScheduler);
                              }}
                              className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Schedule
                            </button>
                            
                            {showScheduler && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background border border-foreground/10 rounded-lg shadow-sm py-2 z-50 min-w-[140px]"
                              >
                                {[
                                  { label: 'Morning', time: '09:00' },
                                  { label: 'Afternoon', time: '13:00' },
                                  { label: 'Evening', time: '18:00' },
                                  { label: '9am', time: '09:00' },
                                  { label: '12pm', time: '12:00' },
                                  { label: '3pm', time: '15:00' },
                                  { label: '6pm', time: '18:00' },
                                ].map((slot) => (
                                  <button
                                    key={slot.label}
                                    onClick={async () => {
                                      if (focusTaskData) {
                                        const today = new Date().toISOString().split('T')[0];
                                        const reminderTime = `${today}T${slot.time}:00`;
                                        await supabase.from('tasks').update({ reminder_time: reminderTime }).eq('id', focusTaskData.id);
                                        setFocusTaskData({ ...focusTaskData, reminderTime });
                                        setShowScheduler(false);
                                        toast({ description: `Scheduled for ${slot.label.toLowerCase()}` });
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-xs text-foreground/70 hover:bg-foreground/5 transition-colors"
                                  >
                                    {slot.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              setEditText(contextualPrompt.title || '');
                              setIsEditing(true);
                            }}
                            className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTTOM - Orb grounded in bottom third */}
                <div className="mt-auto pb-16 flex flex-col items-center justify-center gap-2">
                  {/* Ritual prompts */}
                  {shouldShowMorning && !showMorningRitual && (
                    <div className="mb-4">
                      <RitualPrompt 
                        type="morning" 
                        onTap={() => setShowMorningRitual(true)}
                        onDismiss={dismissMorning}
                      />
                    </div>
                  )}
                  {shouldShowEvening && !showEveningRitual && (
                    <div className="mb-4">
                      <RitualPrompt 
                        type="evening" 
                        onTap={() => setShowEveningRitual(true)}
                        onDismiss={dismissEvening}
                      />
                    </div>
                  )}
                  
                  <SimpleOrb
                    onTap={() => setShowDesktopCapture(true)}
                    isRecording={voiceStatus.isListening}
                    isProcessing={voiceStatus.isProcessing}
                  />
                  
                  {/* Keyboard hint - fades after first use */}
                  {showKeyboardHint && (
                    <p className="text-[10px] text-muted-foreground/20 animate-fade-in">
                      Click orb or press Q to capture
                    </p>
                  )}
                  
                  {/* Companion zone - message and progress */}
                  <div className="flex flex-col items-center gap-4 mt-2">
                    <div className="min-h-[20px]">
                      <CompanionMessage />
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
    </>
  );
};

export default Index;

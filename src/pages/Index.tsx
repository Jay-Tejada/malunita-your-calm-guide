import { useState, useEffect, useRef } from "react";
import { Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ThinkWithMe } from "@/components/ThinkWithMe";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CompanionOnboarding } from "@/components/CompanionOnboarding";
import { MalunitaVoice, MalunitaVoiceRef } from "@/components/MalunitaVoice";
import { useCompanionIdentity, PersonalityType } from "@/hooks/useCompanionIdentity";
import { useToast } from "@/hooks/use-toast";
import { HomeShell } from "@/layouts/HomeShell";
import { useDailyReset } from "@/hooks/useDailyReset";
import { usePrimaryFocusPrediction } from "@/hooks/usePrimaryFocusPrediction";
import { useCaptureSessions } from "@/hooks/useCaptureSessions";
import { CaptureHistoryModal } from "@/components/CaptureHistoryModal";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import Orb from "@/components/Orb";
import Search from "@/components/Search";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { StartMyDayModal } from "@/components/rituals/StartMyDayModal";
import { TinyTaskFiestaCard } from "@/components/home/TinyTaskFiestaCard";
import TinyTaskParty from "@/components/TinyTaskParty";
import { CaptureSheet } from "@/components/capture/CaptureSheet";

const Index = () => {
  // Initialize daily reset monitoring
  useDailyReset();
  
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
  const [taskCreatedTrigger, setTaskCreatedTrigger] = useState(0);
  const { companion, needsOnboarding, updateCompanion } = useCompanionIdentity();
  const { toast } = useToast();
  const voiceRef = useRef<MalunitaVoiceRef>(null);
  const { sessions } = useCaptureSessions();
  const [showCaptureHistory, setShowCaptureHistory] = useState(false);
  const [showThinkWithMe, setShowThinkWithMe] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Initialize prediction system (runs silently in background)
  usePrimaryFocusPrediction();

  const isMobile = useIsMobile();
  const { isOnline } = useOfflineStatus();
  
  // Capture sheet state
  const [captureOpen, setCaptureOpen] = useState(false);
  
  // Direct orb recording state (kept for legacy/desktop direct recording)
  const [isOrbRecording, setIsOrbRecording] = useState(false);
  const [isOrbProcessing, setIsOrbProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Start my day modal state
  const [showStartMyDay, setShowStartMyDay] = useState(false);
  
  // Orb focus state
  const [isFocused, setIsFocused] = useState(false);
  
  // Tiny Task Fiesta card state - only shows after completing Start My Day flow
  const [showTinyTaskFiesta, setShowTinyTaskFiesta] = useState(false);
  
  // Tiny Task Party modal state
  const [showTinyTaskParty, setShowTinyTaskParty] = useState(false);
  
  // Profile and tasks for modal
  const { profile } = useProfile();
  const { tasks, createTasks, updateTask } = useTasks();
  
  // Get tiny/small tasks for the party (tasks marked as tiny or inbox tasks)
  const tinyTasks = tasks?.filter(t => 
    !t.completed && 
    (t.is_tiny_task || (!t.scheduled_bucket && t.title.length < 50))
  ).slice(0, 5) || [];
  
  // Task counts for Start My Day modal
  const todayTaskCount = tasks?.filter(t => t.scheduled_bucket === 'today' && !t.completed).length || 0;
  const inboxCount = tasks?.filter(t => !t.scheduled_bucket && !t.completed).length || 0;
  
  // Handle completing a task in the party
  const handlePartyTaskComplete = async (taskId: string) => {
    await updateTask({ id: taskId, updates: { completed: true, completed_at: new Date().toISOString() } });
  };
  
  // Quick capture from global context
  const { openQuickCapture, closeQuickCapture } = useQuickCapture();
  
  // Initialize keyboard shortcuts - use global context for quick capture
  useKeyboardShortcuts({
    onQuickCapture: openQuickCapture,
    onFocusInput: () => inputRef.current?.focus(),
    onDailyReview: () => navigate('/daily-session'),
    onCloseModals: () => {
      closeQuickCapture();
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
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Auth />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (needsOnboarding) {
    return <CompanionOnboarding open={true} onComplete={handleCompanionComplete} />;
  }

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
    setTaskCreatedTrigger(prev => prev + 1);
  };

  const handleVoiceCapture = () => {
    if (isFocused) {
      // If focused, stop recording and exit focus
      stopOrbRecording();
      setIsFocused(false);
    } else if (!isOrbProcessing) {
      // If not focused, enter focus and start recording
      setIsFocused(true);
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
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
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

  // One-liner text based on focus state
  const getOneLiner = () => {
    return "Focus is set. You know what to do.";
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="contents"
      >
        {/* Start My Day Modal */}
        <StartMyDayModal
        isOpen={showStartMyDay}
        onClose={() => setShowStartMyDay(false)}
        userName={profile?.companion_name || "Friend"}
        taskCount={todayTaskCount}
        inboxCount={inboxCount}
        onNext={(intention) => {
          console.log("User's intention:", intention);
          setShowStartMyDay(false);
          setShowTinyTaskFiesta(true); // Show fiesta card after completing flow
        }}
      />
      
      <OfflineIndicator />
      
      {/* Focus backdrop overlay */}
      <div 
        className={`fixed inset-0 transition-all duration-300 ${isFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ 
          backdropFilter: 'blur(12px)', 
          background: 'rgba(0,0,0,0.4)',
          zIndex: 40 
        }}
        onClick={() => {
          setIsFocused(false);
          stopOrbRecording();
        }}
      />
      
      {isMobile ? (
        /* MOBILE LAYOUT - Minimal & Centered */
        <div className="mobile-home min-h-screen bg-background flex flex-col">
          {/* Offline banner */}
          {!isOnline && (
            <div className="sticky top-0 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center py-2 text-sm">
              📴 Offline - Changes will sync when connected
            </div>
          )}

          {/* CENTER - Everything vertically & horizontally centered */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Orb - direct voice capture on mobile (same as desktop) */}
            <div className="flex flex-col items-center relative" style={{ zIndex: 50 }}>
              <Orb
                size={140}
                onClick={handleVoiceCapture}
                isRecording={isOrbRecording}
                isProcessing={isOrbProcessing}
                isFocused={isFocused}
              />
              
              {/* Status text below orb - fixed height to prevent layout shift */}
              <p className="mt-6 h-5 text-sm text-muted-foreground/50 text-center font-light">
                {isOrbRecording ? 'listening...' : isOrbProcessing ? 'transcribing...' : getOneLiner()}
              </p>
            </div>
            
            {/* Start my day button - only show if fiesta card is not visible */}
            {!showTinyTaskFiesta && (
              <button
                onClick={() => setShowStartMyDay(true)}
                className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
              >
                <Sun className="w-3.5 h-3.5" />
                Start my day
              </button>
            )}
            
            {/* Tiny Task Fiesta Card - shows after Start My Day flow */}
            {showTinyTaskFiesta && (
              <div className="mt-8">
                <TinyTaskFiestaCard
                  onDismiss={() => setShowTinyTaskFiesta(false)}
                  onStart={() => {
                    setShowTinyTaskParty(true);
                    setShowTinyTaskFiesta(false);
                  }}
                />
              </div>
            )}
            
            {/* Search hint */}
            <p className="mt-6 text-[10px] text-muted-foreground/20">
              Press / to search
            </p>
          </div>
        </div>
      ) : (
        /* DESKTOP LAYOUT - Minimal & Centered */
        <HomeShell
          onSettingsClick={handleSettingsClick}
          onCategoryClick={handleCategoryClick}
          onFocusModeClick={handleFocusModeClick}
          onWorldMapClick={handleWorldMapClick}
          onShareMalunitaClick={handleShareMalunitaClick}
          onDreamModeClick={handleDreamModeClick}
          activeCategory={activeCategory}
        >
          {/* Minimal centered content */}
          <div className="min-h-[85vh] flex flex-col items-center justify-center">
            {/* Orb */}
            <div className="flex flex-col items-center relative" style={{ zIndex: 50 }}>
              <Orb
                size={180}
                onClick={handleVoiceCapture}
                isRecording={isOrbRecording}
                isProcessing={isOrbProcessing}
                isFocused={isFocused}
              />
              
              {/* Status text below orb - fixed height to prevent layout shift */}
              <p className="mt-6 h-5 text-sm text-muted-foreground/50 text-center font-light">
                {isOrbRecording ? 'listening...' : isOrbProcessing ? 'transcribing...' : getOneLiner()}
              </p>
            </div>
            
            {/* Start my day button - only show if fiesta card is not visible */}
            {!showTinyTaskFiesta && (
              <button
                onClick={() => setShowStartMyDay(true)}
                className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground/10 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
              >
                <Sun className="w-3.5 h-3.5" />
                Start my day
              </button>
            )}
            
            {/* Tiny Task Fiesta Card - shows after Start My Day flow */}
            {showTinyTaskFiesta && (
              <div className="mt-8">
                <TinyTaskFiestaCard
                  onDismiss={() => setShowTinyTaskFiesta(false)}
                  onStart={() => {
                    setShowTinyTaskParty(true);
                    setShowTinyTaskFiesta(false);
                  }}
                />
              </div>
            )}
            
            {/* Search hint */}
            <p className="mt-6 text-[10px] text-muted-foreground/20">
              Press / to search
            </p>
          </div>
        </HomeShell>
      )}
      
      {/* QuickCapture is now rendered globally via Layout.tsx */}

      {/* Capture history modal (desktop only) */}
      {!isMobile && (
        <CaptureHistoryModal
          open={showCaptureHistory}
          onOpenChange={setShowCaptureHistory}
          sessions={sessions || []}
          onSessionClick={(session) => {
            console.log('Session clicked:', session);
          }}
        />
      )}
      
      {/* Think With Me dialog */}
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
        />
      )}
      
      {/* Search modal */}
      <Search isOpen={showSearch} onClose={() => setShowSearch(false)} />
      
      {/* Tiny Task Party - full screen focus session */}
      {showTinyTaskParty && tinyTasks.length > 0 && (
        <TinyTaskParty
          tasks={tinyTasks}
          onComplete={handlePartyTaskComplete}
          onClose={() => setShowTinyTaskParty(false)}
        />
      )}
      
      {/* Capture Sheet - Mobile voice/text capture */}
      <CaptureSheet
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSubmit={async (text) => {
          const result = await createTasks([{
            title: text,
            category: 'inbox',
            input_method: 'voice',
          }]);
          toast({ description: "Added to inbox" });
          handleTaskCreated();
          // Return the first created task for auto-categorization
          return result?.[0] ? { id: result[0].id } : undefined;
        }}
      />
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;

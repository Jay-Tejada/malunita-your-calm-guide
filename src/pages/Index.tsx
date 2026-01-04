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
import { useWakeLock } from "@/hooks/useWakeLock";
import Orb from "@/components/Orb";
import { ListeningOverlay } from "@/components/orb/ListeningOverlay";
import Search from "@/components/Search";
import { useTasks } from "@/hooks/useTasks";
import { useCapture } from "@/hooks/useAICapture";
import { useProfile } from "@/hooks/useProfile";
import { StartMyDayModal } from "@/components/rituals/StartMyDayModal";
import { StartMyDayFlow, StartMyDayResult } from '@/components/rituals/StartMyDayFlow';
import { TinyTaskFiestaCard } from "@/components/home/TinyTaskFiestaCard";
import TinyTaskParty from "@/components/TinyTaskParty";
import { CaptureSheet } from "@/components/capture/CaptureSheet";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useDrawerState } from "@/contexts/DrawerContext";
import { useDynamicFocusStatus } from "@/hooks/useDynamicFocusStatus";

const Index = () => {
  // Initialize daily reset monitoring
  useDailyReset();
  
  // Get drawer state for orb passive mode
  const { isAnyDrawerOpen } = useDrawerState();
  
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
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  
  // Capture sheet state
  const [captureOpen, setCaptureOpen] = useState(false);
  
  // Direct orb recording state (kept for legacy/desktop direct recording)
  const [isOrbRecording, setIsOrbRecording] = useState(false);
  const [isOrbProcessing, setIsOrbProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const { tasks, updateTask } = useTasks();
  const { capture } = useCapture();
  
  // Dynamic focus status from real data (must be called before any early returns)
  const focusStatus = useDynamicFocusStatus();
  
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

  const handleVoiceCapture = async () => {
    // Trigger haptic feedback on mobile
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available (web browser)
    }
    
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
      // Request wake lock to prevent screen timeout during recording
      await requestWakeLock();
      
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
        // Release wake lock when recording stops
        await releaseWakeLock();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processOrbRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsOrbRecording(true);
      setRecordingDuration(0);
      
      // Track recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      // Release wake lock on error
      await releaseWakeLock();
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access needed",
        description: "Please allow microphone access to use voice capture.",
        variant: "destructive"
      });
    }
  };

  const stopOrbRecording = async () => {
    // Clear recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Ensure wake lock is released
    await releaseWakeLock();
    setIsOrbRecording(false);
    setIsOrbProcessing(true);
    setRecordingDuration(0);
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
        // Route through AI pipeline for full processing
        await capture({
          text,
          category: 'inbox',
        });
        
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
    <AnimatePresence mode="wait">
      <motion.div
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="contents"
      >
        {/* Start My Day Flow - 3-step operational decision funnel */}
        <StartMyDayFlow
          isOpen={showStartMyDay}
          onClose={() => setShowStartMyDay(false)}
          onComplete={(result: StartMyDayResult) => {
            console.log("Start My Day completed:", result);
            setShowStartMyDay(false);
            // Only show fiesta if primary task was set and we have tiny tasks
            if (result.primaryTaskId && tinyTasks.length > 0) {
              setShowTinyTaskFiesta(true);
            }
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
          {/* Listening overlay - soft background dim */}
          <ListeningOverlay isActive={isOrbRecording || isOrbProcessing} />
          
          {/* Offline banner */}
          {!isOnline && (
            <div className="sticky top-0 z-50 bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center py-2 text-sm">
              📴 Offline - Changes will sync when connected
            </div>
          )}

          {/* CENTER - Everything vertically & horizontally centered */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Rebalanced layout: Orb (ambient) → Focus Line (hero) → Button → Hint */}
            <div className="flex flex-col items-center relative" style={{ zIndex: 50 }}>
              {/* Orb - reduced size, ambient presence */}
              <Orb
                size={120}
                onClick={handleVoiceCapture}
                isRecording={isOrbRecording}
                isProcessing={isOrbProcessing}
                isFocused={isFocused}
                isPassive={isAnyDrawerOpen}
                recordingDuration={recordingDuration}
              />
              
              {/* Status text - minimal during recording */}
              <div className="mt-7 text-center max-w-[280px]">
                <AnimatePresence mode="wait">
                  {isOrbRecording ? (
                    <motion.p 
                      key="listening"
                      className="text-sm font-light text-foreground/40 leading-relaxed tracking-wide"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      listening…
                    </motion.p>
                  ) : isOrbProcessing ? (
                    <motion.p 
                      key="transcribing"
                      className="text-sm font-light text-foreground/40 leading-relaxed tracking-wide"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      transcribing…
                    </motion.p>
                  ) : (
                    <motion.p 
                      key="focus"
                      className="text-base font-normal text-foreground leading-relaxed tracking-tight"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      {focusStatus.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Tap to stop hint - very low contrast */}
              <AnimatePresence>
                {isFocused && (
                  <motion.p 
                    className="mt-3 text-[10px] text-foreground/20 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    tap to stop
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            {/* Start my day button - hidden during recording */}
            <AnimatePresence>
              {!showTinyTaskFiesta && !isOrbRecording && !isOrbProcessing && (
                <motion.button
                  onClick={() => setShowStartMyDay(true)}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Start my day
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* Tiny Task Fiesta Card - hidden during recording */}
            <AnimatePresence>
              {showTinyTaskFiesta && !isOrbRecording && !isOrbProcessing && (
                <motion.div 
                  className="mt-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  <TinyTaskFiestaCard
                    onDismiss={() => setShowTinyTaskFiesta(false)}
                    onStart={() => {
                      setShowTinyTaskParty(true);
                      setShowTinyTaskFiesta(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Search hint - hidden during recording */}
            <AnimatePresence>
              {!isOrbRecording && !isOrbProcessing && (
                <motion.p 
                  className="mt-4 text-[10px] text-muted-foreground/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Press / to search
                </motion.p>
              )}
            </AnimatePresence>
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
          {/* Listening overlay - soft background dim */}
          <ListeningOverlay isActive={isOrbRecording || isOrbProcessing} />
          
          {/* Minimal centered content - Rebalanced layout */}
          <div className="min-h-[85vh] flex flex-col items-center justify-center">
            {/* Rebalanced layout: Orb (ambient) → Focus Line (hero) → Button → Hint */}
            <div className="flex flex-col items-center relative" style={{ zIndex: 50 }}>
              {/* Orb - reduced size (~15% smaller), ambient presence */}
              <Orb
                size={155}
                onClick={handleVoiceCapture}
                isRecording={isOrbRecording}
                isProcessing={isOrbProcessing}
                isFocused={isFocused}
                isPassive={isAnyDrawerOpen}
                recordingDuration={recordingDuration}
              />
              
              {/* Status text - minimal during recording */}
              <div className="mt-8 text-center max-w-md">
                <AnimatePresence mode="wait">
                  {isOrbRecording ? (
                    <motion.p 
                      key="listening"
                      className="text-sm font-light text-foreground/40 leading-relaxed tracking-wide"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      listening…
                    </motion.p>
                  ) : isOrbProcessing ? (
                    <motion.p 
                      key="transcribing"
                      className="text-sm font-light text-foreground/40 leading-relaxed tracking-wide"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      transcribing…
                    </motion.p>
                  ) : (
                    <motion.p 
                      key="focus"
                      className="text-lg font-normal text-foreground leading-relaxed tracking-tight"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      {focusStatus.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Tap to stop hint - very low contrast */}
              <AnimatePresence>
                {isFocused && (
                  <motion.p 
                    className="mt-3 text-[10px] text-foreground/20 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    tap to stop
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            {/* Start my day button - hidden during recording */}
            <AnimatePresence>
              {!showTinyTaskFiesta && !isOrbRecording && !isOrbProcessing && (
                <motion.button
                  onClick={() => setShowStartMyDay(true)}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Start my day
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* Tiny Task Fiesta Card - hidden during recording */}
            <AnimatePresence>
              {showTinyTaskFiesta && !isOrbRecording && !isOrbProcessing && (
                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  <TinyTaskFiestaCard
                    onDismiss={() => setShowTinyTaskFiesta(false)}
                    onStart={() => {
                      setShowTinyTaskParty(true);
                      setShowTinyTaskFiesta(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Search hint - hidden during recording */}
            <AnimatePresence>
              {!isOrbRecording && !isOrbProcessing && (
                <motion.p 
                  className="mt-4 text-[10px] text-muted-foreground/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Press / to search
                </motion.p>
              )}
            </AnimatePresence>
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
          // Route through AI pipeline for full processing
          const result = await capture({
            text,
            category: 'inbox',
          });
          toast({ description: "Added to inbox" });
          handleTaskCreated();
          // Return the first created task for auto-categorization
          return result?.taskIds?.[0] ? { id: result.taskIds[0] } : undefined;
        }}
      />
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;

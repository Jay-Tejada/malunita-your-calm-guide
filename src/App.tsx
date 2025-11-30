import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, lazy, Suspense } from "react";
import { startEmotionalMemoryMonitoring } from "@/state/emotionalMemory";
import { initializeAILearningListeners } from "@/state/aiLearningEvents";
import { supabase } from "@/integrations/supabase/client";
import { useMemoryEngine } from "@/state/memoryEngine";
import { AnimatePresence } from "framer-motion";
import { useRitualTrigger } from "@/hooks/useRitualTrigger";
// MorningRitual removed - using DailyPriorityPrompt instead
import { EveningRitual } from "@/features/rituals/EveningRitual";
import { questTracker } from "@/lib/questTracker";
import { Layout } from "@/components/Layout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useCutsceneManager } from "./features/cutscenes/useCutsceneManager";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const Trends = lazy(() => import("./pages/Trends"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TestCore = lazy(() => import("./pages/TestCore"));
const TestAll = lazy(() => import("./pages/TestAll"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Calendar = lazy(() => import("./pages/Calendar"));
const DailySession = lazy(() => import("./pages/DailySession"));
const WeeklyInsights = lazy(() => import("./pages/WeeklyInsights"));
const TinyTaskFiesta = lazy(() => import("./pages/TinyTaskFiesta"));
const Reminders = lazy(() => import("./pages/Reminders"));
const HatchingGallery = lazy(() => import("./pages/HatchingGallery"));
const Backup = lazy(() => import("./pages/Backup"));
const Customization = lazy(() => import("./pages/Customization"));
const Journal = lazy(() => import("./pages/Journal"));
const MonthlyInsights = lazy(() => import("./pages/MonthlyInsights"));
const Quests = lazy(() => import("./pages/Quests"));
const AmbientWorlds = lazy(() => import("./pages/AmbientWorlds"));
const Clusters = lazy(() => import("./pages/Clusters"));
const TimeTravel = lazy(() => import("./pages/TimeTravel"));
const Learning = lazy(() => import("./pages/Learning"));
import { JOURNAL_EVENTS } from "./features/journal/journalEvents";
import { bondingMeter, BONDING_INCREMENTS } from "./state/bondingMeter";

// Configure React Query with optimized defaults for better caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering stale
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes (gcTime is v5 naming, was cacheTime in v4)
      gcTime: 10 * 60 * 1000,
      
      // Don't refetch when window regains focus (annoying on mobile)
      refetchOnWindowFocus: false,
      
      // Don't refetch when component remounts
      refetchOnMount: false,
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Wait 1s between retries
      retryDelay: 1000,
      
      // Use cached data while revalidating in background
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
      // Error handling for mutations (toast handled in individual hooks)
      onError: (error) => {
        console.error('Mutation failed:', error);
      }
    }
  }
});

const App = () => {
  const { shouldShowRitual, dismissRitual } = useRitualTrigger();
  const { showRitualCutscene } = useCutsceneManager();

  const handleRitualComplete = async (type: 'morning' | 'evening') => {
    // Update profile with ritual completion timestamp FIRST
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ritual_preferences')
          .eq('id', user.id)
          .single();

        const ritualPrefs = (profile?.ritual_preferences as any) || {};

        await supabase
          .from('profiles')
          .update({
            ritual_preferences: {
              ...ritualPrefs,
              ...(type === 'evening' ? { last_evening_ritual: new Date().toISOString() } : {}),
              ...(type === 'morning' ? { last_morning_ritual: new Date().toISOString() } : {})
            }
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving ritual completion:', error);
    }

    showRitualCutscene(type);
    dismissRitual();
    
    // Create journal entry for ritual completion
    JOURNAL_EVENTS.RITUAL_COMPLETE(type);
    
    // Track quest progress for ritual streak
    questTracker.trackRitualStreak();
    
    // Increment bonding for ritual completion
    bondingMeter.incrementBonding(
      BONDING_INCREMENTS.RITUAL_COMPLETED,
      "Ritual completed! Malunita feels closer"
    );
  };

  // Initialize emotional memory monitoring and AI learning listeners on app start
  useEffect(() => {
    const cleanupEmotional = startEmotionalMemoryMonitoring();
    const cleanupAILearning = initializeAILearningListeners();
    
    // Initialize memory engine from backend
    const initializeMemoryEngine = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch memory profile from backend
        const { data: profile, error } = await supabase
          .from('ai_memory_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching memory profile:', error);
          return;
        }

        // Load into Zustand store if profile exists
        if (profile) {
          const updates: any = {};
          
          if (profile.writing_style) updates.writingStyle = profile.writing_style;
          if (profile.category_preferences) updates.categoryPreferences = profile.category_preferences;
          if (profile.priority_bias) updates.priorityBias = profile.priority_bias;
          if (profile.tiny_task_threshold) updates.tinyTaskThreshold = profile.tiny_task_threshold;
          if (profile.energy_pattern) updates.energyPattern = profile.energy_pattern;
          if (profile.procrastination_triggers) updates.procrastinationTriggers = profile.procrastination_triggers;
          if (profile.emotional_triggers) updates.emotionalTriggers = profile.emotional_triggers;
          if (profile.positive_reinforcers) updates.positiveReinforcers = profile.positive_reinforcers;
          if (profile.streak_history) updates.streakHistory = profile.streak_history;
          updates.lastUpdated = profile.last_updated ? new Date(profile.last_updated) : new Date();
          
          // Directly update store state
          useMemoryEngine.setState(updates);
          
          console.log('✅ Memory profile loaded from backend');
        }
      } catch (err) {
        console.error('Error initializing memory engine:', err);
      }
    };

    initializeMemoryEngine();

    // Periodic sync every 5 minutes
    const syncInterval = setInterval(() => {
      useMemoryEngine.getState().syncWithBackend();
    }, 5 * 60 * 1000);

    // Subscribe to store changes for real-time sync
    const unsubscribe = useMemoryEngine.subscribe((state, prevState) => {
      // Debounce: only sync if significant changes
      const hasChanged = 
        state.writingStyle !== prevState.writingStyle ||
        JSON.stringify(state.categoryPreferences) !== JSON.stringify(prevState.categoryPreferences) ||
        JSON.stringify(state.priorityBias) !== JSON.stringify(prevState.priorityBias);
      
      if (hasChanged) {
        // Debounced sync after 2 seconds of inactivity
        setTimeout(() => {
          useMemoryEngine.getState().syncWithBackend();
        }, 2000);
      }
    });
    
    return () => {
      cleanupEmotional();
      cleanupAILearning();
      clearInterval(syncInterval);
      unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Ritual overlays */}
          <AnimatePresence>
            {shouldShowRitual === "evening" && (
              <EveningRitual
                onComplete={() => handleRitualComplete('evening')}
                onSkip={dismissRitual}
              />
            )}
          </AnimatePresence>

          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/daily-session" element={<DailySession />} />
                  <Route path="/weekly-insights" element={<WeeklyInsights />} />
                  <Route path="/hatching-gallery" element={<HatchingGallery />} />
                  <Route path="/tiny-task-fiesta" element={<TinyTaskFiesta />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/backup" element={<Backup />} />
                  <Route path="/customization" element={<Customization />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/monthly-insights" element={<MonthlyInsights />} />
                  <Route path="/quests" element={<Quests />} />
                  <Route path="/ambient-worlds" element={<AmbientWorlds />} />
                  <Route path="/clusters" element={<Clusters />} />
                  <Route path="/timetravel" element={<TimeTravel />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/learning" element={<Learning />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Route>
                
                {/* Routes without planet navigation */}
                <Route path="/install" element={<Install />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/trends" element={<Trends />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/test-core" element={<TestCore />} />
                <Route path="/test-all" element={<TestAll />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

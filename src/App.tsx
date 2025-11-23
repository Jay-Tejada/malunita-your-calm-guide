import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { startEmotionalMemoryMonitoring } from "@/state/emotionalMemory";
import { AnimatePresence } from "framer-motion";
import { useRitualTrigger } from "@/hooks/useRitualTrigger";
import { MorningRitual } from "@/features/rituals/MorningRitual";
import { EveningRitual } from "@/features/rituals/EveningRitual";
import { questTracker } from "@/lib/questTracker";
import Index from "./pages/Index";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Trends from "./pages/Trends";
import ResetPassword from "./pages/ResetPassword";
import TestCore from "./pages/TestCore";
import TestAll from "./pages/TestAll";
import Inbox from "./pages/Inbox";
import Notifications from "./pages/Notifications";
import Goals from "./pages/Goals";
import DailySession from "./pages/DailySession";
import WeeklyInsights from "./pages/WeeklyInsights";
import TinyTaskFiesta from "./pages/TinyTaskFiesta";
import Reminders from "./pages/Reminders";
import HatchingGallery from "./pages/HatchingGallery";
import Backup from "./pages/Backup";
import Customization from "./pages/Customization";
import Journal from "./pages/Journal";
import MonthlyInsights from "./pages/MonthlyInsights";
import Quests from "./pages/Quests";
import AmbientWorlds from "./pages/AmbientWorlds";
import Clusters from "./pages/Clusters";
import { useCutsceneManager } from "./features/cutscenes/useCutsceneManager";
import { JOURNAL_EVENTS } from "./features/journal/journalEvents";

const queryClient = new QueryClient();

const App = () => {
  const { shouldShowRitual, dismissRitual } = useRitualTrigger();
  const { showRitualCutscene } = useCutsceneManager();

  const handleRitualComplete = (type: 'morning' | 'evening') => {
    showRitualCutscene(type);
    dismissRitual();
    
    // Create journal entry for ritual completion
    JOURNAL_EVENTS.RITUAL_COMPLETE(type);
    
    // Track quest progress for ritual streak
    questTracker.trackRitualStreak();
  };

  // Initialize emotional memory monitoring on app start
  useEffect(() => {
    startEmotionalMemoryMonitoring();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Ritual overlays */}
          <AnimatePresence>
            {shouldShowRitual === "morning" && (
              <MorningRitual
                onComplete={() => handleRitualComplete('morning')}
                onSkip={dismissRitual}
              />
            )}
            {shouldShowRitual === "evening" && (
              <EveningRitual
                onComplete={() => handleRitualComplete('evening')}
                onSkip={dismissRitual}
              />
            )}
          </AnimatePresence>

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/goals" element={<Goals />} />
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
              <Route path="/install" element={<Install />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/test-core" element={<TestCore />} />
              <Route path="/test-all" element={<TestAll />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

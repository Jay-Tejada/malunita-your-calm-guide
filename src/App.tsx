import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
            <Route path="/reminders" element={<Reminders />} />
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

export default App;

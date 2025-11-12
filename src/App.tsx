import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import TestCore from "./pages/TestCore";
import TestAll from "./pages/TestAll";
import Inbox from "./pages/Inbox";
import Notifications from "./pages/Notifications";
import Goals from "./pages/Goals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/install" element={<Install />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/test-core" element={<TestCore />} />
          <Route path="/test-all" element={<TestAll />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

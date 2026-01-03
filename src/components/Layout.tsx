import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { MiniOrb } from "@/components/home/MiniOrb";
import { BottomNav } from "@/components/BottomNav";
import { LeftDrawer } from "@/components/LeftDrawer";
import { RightDrawer } from "@/components/RightDrawer";
import { QuickCapture } from "@/components/QuickCapture";
import Search from "@/components/Search";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCapture } from "@/hooks/useAICapture";
import { toast } from "@/hooks/use-toast";
import { useCompanionVisibility } from "@/state/useCompanionVisibility";
import ActiveSessionBar from "@/components/ActiveSessionBar";
import { useFlowSessions } from "@/hooks/useFlowSessions";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";
import { supabase } from "@/integrations/supabase/client";
import { useOrbSync } from "@/hooks/useOrbSync";
import { UpdateBanner } from "@/components/UpdateBanner";
import { DrawerProvider } from "@/contexts/DrawerContext";

import { useOrbEvolution } from "@/hooks/useOrbEvolution";

export const Layout = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { capture, isCapturing } = useCapture();
  const { isVisible: isCompanionVisible, show: showCompanion, hide: hideCompanion } = useCompanionVisibility();
  const { activeSession, completeSession, abandonSession } = useFlowSessions();
  const { isOpen: quickCaptureOpen, openQuickCapture, closeQuickCapture } = useQuickCapture();

  // Orb state sync and evolution
  useOrbSync(userId);
  useOrbEvolution(userId);

  // Get user ID and auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
      setIsAuthenticated(!!session?.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle active session bar interactions
  const handleSessionTap = () => {
    navigate('/today');
  };

  const handleEndSession = async () => {
    if (activeSession) {
      // Complete the session (reflection can be added later)
      await completeSession(activeSession.id, undefined, 0);
      toast({
        title: 'Session ended',
        description: 'You can review it in your journal.',
      });
    }
  };

  // Handle quick capture submission - routes through full AI pipeline
  const handleQuickCapture = async (text: string) => {
    try {
      await capture({ text, category: 'inbox' });
    } catch (error) {
      console.error('Failed to process quick capture:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle focus input shortcut
  const handleFocusInput = () => {
    // Try to find and focus the main input on the current page
    const mainInput = document.querySelector<HTMLInputElement>('input[type="text"], textarea');
    if (mainInput) {
      mainInput.focus();
    } else {
      toast({
        title: 'No input found',
        description: 'Navigate to a page with an input field',
      });
    }
  };

  // Handle close modals shortcut
  const handleCloseModals = () => {
    setLeftDrawerOpen(false);
    setRightDrawerOpen(false);
    closeQuickCapture();
    setShowSearch(false);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onQuickCapture: openQuickCapture,
    onFocusInput: handleFocusInput,
    onCloseModals: handleCloseModals,
  });

  // Keyboard shortcuts (Search: Cmd/Ctrl+K and /, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes all modals/drawers
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseModals();
        return;
      }
      
      // Don't trigger other shortcuts if user is typing in an input or textarea
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

  const isAnyDrawerOpen = leftDrawerOpen || rightDrawerOpen;

  return (
    <DrawerProvider isAnyDrawerOpen={isAnyDrawerOpen}>
      <div className={activeSession ? 'pt-10' : ''}>
        <UpdateBanner />
        
        {/* Main content wrapper - de-emphasized when drawer is open */}
        <div 
          className={`transition-all duration-200 ${
            isAnyDrawerOpen 
              ? 'blur-[2px] opacity-70 saturate-[0.85] pointer-events-none' 
              : 'blur-0 opacity-100 saturate-100'
          }`}
          style={{ willChange: isAnyDrawerOpen ? 'filter, opacity' : 'auto' }}
        >
          {/* Active Session Bar - shows on all pages */}
          {activeSession && activeSession.started_at && (
            <ActiveSessionBar
              session={{
                id: activeSession.id,
                title: activeSession.title,
                started_at: activeSession.started_at,
                target_duration_minutes: activeSession.target_duration_minutes,
              }}
              onTap={handleSessionTap}
              onEnd={handleEndSession}
            />
          )}
          
          {/* Top-Left Mini Orb - Notebook Drawer - Only show on home page when authenticated */}
          {location.pathname === '/' && isAuthenticated === true && (
            <MiniOrb
              position="left"
              label="notebook"
              onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            />
          )}

          {/* Top-Right Mini Orb - Companion Drawer / Visibility - HIDDEN until companion feature is ready */}
          {/* {location.pathname === '/' && (
            <MiniOrb
              position="right"
              label={isCompanionVisible ? "companion" : "summon companion"}
              onClick={() => {
                if (isCompanionVisible) {
                  hideCompanion();
                } else {
                  showCompanion();
                }
              }}
            />
          )} */}

          {/* Page Content */}
          <Outlet />
        </div>

        <BottomNav />

        {/* Drawers - always sharp and outside the blur wrapper */}
        <LeftDrawer
          isOpen={leftDrawerOpen}
          onClose={() => setLeftDrawerOpen(false)}
          onNavigate={(path) => navigate(path)}
          onSearchOpen={() => setShowSearch(true)}
        />

        <RightDrawer
          isOpen={rightDrawerOpen}
          onClose={() => {
            setRightDrawerOpen(false);
            hideCompanion();
          }}
        />

        {/* Quick Capture Modal */}
        <QuickCapture
          isOpen={quickCaptureOpen}
          onClose={closeQuickCapture}
          variant="desktop"
        />

        {/* Search Modal */}
        <Search 
          isOpen={showSearch} 
          onClose={() => setShowSearch(false)} 
        />
      </div>
    </DrawerProvider>
  );
};

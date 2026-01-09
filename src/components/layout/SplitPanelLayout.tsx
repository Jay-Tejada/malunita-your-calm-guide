import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import { QuickCapture } from '@/components/QuickCapture';
import Search from '@/components/Search';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCapture } from '@/hooks/useAICapture';
import { toast } from '@/hooks/use-toast';
import ActiveSessionBar from '@/components/ActiveSessionBar';
import { useFlowSessions } from '@/hooks/useFlowSessions';
import { useQuickCapture } from '@/contexts/QuickCaptureContext';
import { supabase } from '@/integrations/supabase/client';
import { useOrbSync } from '@/hooks/useOrbSync';
import { UpdateBanner } from '@/components/UpdateBanner';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { useOrbEvolution } from '@/hooks/useOrbEvolution';
import { MiniOrb } from '@/components/home/MiniOrb';
import { LeftDrawer } from '@/components/LeftDrawer';
import { RightDrawer } from '@/components/RightDrawer';
import { useCompanionVisibility } from '@/state/useCompanionVisibility';

/**
 * Split-panel layout for desktop (sidebar + content).
 * Falls back to existing mobile layout with bottom nav.
 */
export const SplitPanelLayout = () => {
  const isMobile = useIsMobile();
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
      await completeSession(activeSession.id, undefined, 0);
      toast({
        title: 'Session ended',
        description: 'You can review it in your journal.',
      });
    }
  };

  // Handle quick capture submission
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
    const mainInput = document.querySelector<HTMLInputElement>('input[type="text"], textarea');
    if (mainInput) {
      mainInput.focus();
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

  // Keyboard shortcuts (Search: Cmd/Ctrl+K and /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseModals();
        return;
      }
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const isAnyDrawerOpen = leftDrawerOpen || rightDrawerOpen;

  // Desktop: Split-panel layout with persistent sidebar
  if (!isMobile) {
    return (
      <DrawerProvider isAnyDrawerOpen={isAnyDrawerOpen}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            
            <SidebarInset className="flex flex-col flex-1">
              <UpdateBanner />
              
              {/* Header with sidebar trigger */}
              <header className="flex items-center gap-2 px-4 h-12 border-b border-border/50 shrink-0">
                <SidebarTrigger className="-ml-1" />
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
              </header>

              {/* Main content area */}
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </SidebarInset>
          </div>

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
        </SidebarProvider>
      </DrawerProvider>
    );
  }

  // Mobile: Existing layout with bottom nav and drawers
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
          
          {/* Top-Left Mini Orb - Only show on home page */}
          {location.pathname === '/' && isAuthenticated === true && (
            <MiniOrb
              position="left"
              label="notebook"
              onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            />
          )}

          {/* Page Content */}
          <Outlet />
        </div>

        <BottomNav />

        {/* Drawers */}
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

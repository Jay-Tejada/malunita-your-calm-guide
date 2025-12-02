import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { MiniOrb } from "@/components/home/MiniOrb";
import { LeftDrawer } from "@/components/LeftDrawer";
import { RightDrawer } from "@/components/RightDrawer";
import { QuickCapture } from "@/components/QuickCapture";
import Search from "@/components/Search";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProcessInputMutation } from "@/hooks/useProcessInputMutation";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";
import { useCompanionVisibility } from "@/state/useCompanionVisibility";
import ActiveSessionBar from "@/components/ActiveSessionBar";
import { useFlowSessions } from "@/hooks/useFlowSessions";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";
 
export const Layout = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const processInputMutation = useProcessInputMutation();
  const { createTasks } = useTasks();
  const { isVisible: isCompanionVisible, show: showCompanion, hide: hideCompanion } = useCompanionVisibility();
  const { activeSession, completeSession, abandonSession } = useFlowSessions();
  const { isOpen: quickCaptureOpen, openQuickCapture, closeQuickCapture } = useQuickCapture();

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

  // Handle quick capture submission
  const handleQuickCapture = async (text: string) => {
    try {
      const result = await processInputMutation.mutateAsync({ text });
      
      if (result?.tasks && result.tasks.length > 0) {
        const tasksToCreate = result.tasks.map(task => ({
          title: task.title,
          category: task.category || 'inbox',
          input_method: 'text' as const,
        }));

        await createTasks(tasksToCreate);
      }
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

  return (
    <div className={activeSession ? 'pt-10' : ''}>
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
      
      {/* Top-Left Mini Orb - Notebook Drawer - Only show on home page */}
      {location.pathname === '/' && (
        <MiniOrb
          position="left"
          label="notebook"
          onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
        />
      )}

      {/* Top-Right Mini Orb - Companion Drawer / Visibility - Only show on home page */}
      {location.pathname === '/' && (
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
      )}

      {/* Left Tasks Drawer */}
      <LeftDrawer
        isOpen={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        onNavigate={(path) => navigate(path)}
        onSearchOpen={() => setShowSearch(true)}
      />

      {/* Right Companion Drawer */}
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

      {/* Page Content */}
      <Outlet />
    </div>
  );
};

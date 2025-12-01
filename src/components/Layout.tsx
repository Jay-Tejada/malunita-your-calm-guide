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

export const Layout = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const processInputMutation = useProcessInputMutation();
  const { createTasks } = useTasks();

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
    setQuickCaptureOpen(false);
    setShowSearch(false);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onQuickCapture: () => setQuickCaptureOpen(true),
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
    <>
      {/* Top-Left Mini Orb - Notebook Drawer */}
      <MiniOrb
        position="left"
        label="notebook"
        onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
      />

      {/* Top-Right Mini Orb - Companion Drawer */}
      <MiniOrb
        position="right"
        label="companion"
        onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
      />

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
        onClose={() => setRightDrawerOpen(false)}
      />

      {/* Quick Capture Modal */}
      <QuickCapture
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        variant="desktop"
      />

      {/* Search Modal */}
      <Search 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />

      {/* Page Content */}
      <Outlet />
    </>
  );
};

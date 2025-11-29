import { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { GlobeButton } from "@/components/GlobeButton";
import { LeftDrawer } from "@/components/LeftDrawer";
import { RightDrawer } from "@/components/RightDrawer";
import { QuickCapture } from "@/components/QuickCapture";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProcessInputMutation } from "@/hooks/useProcessInputMutation";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";

export const Layout = () => {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
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
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onQuickCapture: () => setQuickCaptureOpen(true),
    onFocusInput: handleFocusInput,
    onCloseModals: handleCloseModals,
  });

  return (
    <>
      {/* Top-Left Planet - Tasks Drawer */}
      <GlobeButton
        position="top-left"
        variant="menu"
        onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
        isActive={leftDrawerOpen}
      />

      {/* Top-Right Planet - Companion Drawer */}
      <GlobeButton
        position="top-right"
        variant="home"
        onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
        isActive={rightDrawerOpen}
      />

      {/* Left Tasks Drawer */}
      <LeftDrawer
        isOpen={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
        onNavigate={(path) => navigate(path)}
      />

      {/* Right Companion Drawer */}
      <RightDrawer
        isOpen={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
      />

      {/* Quick Capture Modal */}
      <QuickCapture
        open={quickCaptureOpen}
        onOpenChange={setQuickCaptureOpen}
        onCapture={handleQuickCapture}
      />

      {/* Shortcuts Help Modal */}
      <ShortcutsHelp />

      {/* Page Content */}
      <Outlet />
    </>
  );
};

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface KeyboardShortcutsOptions {
  onQuickCapture?: () => void;
  onFocusInput?: () => void;
  onDailyReview?: () => void;
  onSearch?: () => void;
  onCloseModals?: () => void;
}

// Track usage counts for smart hints
const USAGE_KEY = 'hint-usage';
const getUsageCounts = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const incrementUsage = (id: string) => {
  try {
    const counts = getUsageCounts();
    counts[id] = (counts[id] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(counts));
  } catch {}
};

/**
 * Global keyboard shortcuts system
 * 
 * Shortcuts:
 * - Q: Quick capture (standalone)
 * - Cmd/Ctrl + K: Quick capture
 * - Cmd/Ctrl + /: Focus input
 * - Cmd/Ctrl + D: Daily review
 * - Cmd/Ctrl + F: Search
 * - Cmd/Ctrl + J: Journal
 * - Cmd/Ctrl + T: Today view
 * - Cmd/Ctrl + ?: Show shortcuts help
 * - Escape: Close modals/dialogs
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKeyName = isMac ? '⌘' : 'Ctrl';

  const isTyping = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    
    const tagName = target.tagName;
    return (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]') !== null
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target;

      // Always allow Escape
      if (e.key === 'Escape') {
        options.onCloseModals?.();
        return;
      }

      // Don't trigger shortcuts when typing (except Escape handled above)
      if (isTyping(target)) return;

      // Quick Capture: Q key (standalone)
      if (e.key === 'q' && !modKey && !e.shiftKey) {
        e.preventDefault();
        options.onQuickCapture?.();
        incrementUsage('quick-capture');
        return;
      }

      // Quick Capture: Cmd/Ctrl + K
      if (modKey && e.key === 'k') {
        e.preventDefault();
        options.onQuickCapture?.();
        incrementUsage('quick-capture');
        return;
      }

      // Focus Input: Cmd/Ctrl + /
      if (modKey && e.key === '/') {
        e.preventDefault();
        options.onFocusInput?.();
        incrementUsage('search');
        return;
      }

      // Daily Review: Cmd/Ctrl + D
      if (modKey && e.key === 'd') {
        e.preventDefault();
        options.onDailyReview?.();
        navigate('/daily-session');
        incrementUsage('daily-session');
        return;
      }

      // Search: Cmd/Ctrl + F
      if (modKey && e.key === 'f') {
        e.preventDefault();
        options.onSearch?.();
        incrementUsage('search');
        return;
      }

      // Journal: Cmd/Ctrl + J
      if (modKey && e.key === 'j') {
        e.preventDefault();
        navigate('/journal');
        incrementUsage('journal');
        return;
      }

      // Today View: Cmd/Ctrl + T
      if (modKey && e.key === 't') {
        e.preventDefault();
        navigate('/');
        return;
      }

      // Show Help: Cmd/Ctrl + ?
      if (modKey && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        // This will be handled by the ShortcutsHelp component
        window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isMac, isTyping, options]);

  return { isMac, modKeyName };
}

/**
 * Hook to listen for shortcuts help modal trigger
 */
export function useShortcutsHelpTrigger(onShow: () => void) {
  useEffect(() => {
    const handleShow = () => onShow();
    window.addEventListener('show-shortcuts-help', handleShow);
    return () => window.removeEventListener('show-shortcuts-help', handleShow);
  }, [onShow]);
}

/**
 * Reset all usage tracking (useful for testing or user preference)
 */
export function resetShortcutHints() {
  try {
    localStorage.removeItem(USAGE_KEY);
    toast({
      title: 'Hints Reset',
      description: 'Keyboard shortcut hints will show again',
    });
  } catch {
    // Silently fail
  }
}

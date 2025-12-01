import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface KeyboardShortcutsOptions {
  onQuickCapture?: () => void;
  onFocusInput?: () => void;
  onDailyReview?: () => void;
  onSearch?: () => void;
  onCloseModals?: () => void;
}

const HINTS_STORAGE_KEY = 'keyboard-shortcuts-hints-shown';

// Track which hints we've already shown
const getShownHints = (): Set<string> => {
  try {
    const stored = localStorage.getItem(HINTS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markHintShown = (shortcut: string) => {
  try {
    const shown = getShownHints();
    shown.add(shortcut);
    localStorage.setItem(HINTS_STORAGE_KEY, JSON.stringify([...shown]));
  } catch {
    // Silently fail if localStorage is unavailable
  }
};

const showHintOnce = (shortcut: string, message: string) => {
  const shown = getShownHints();
  if (!shown.has(shortcut)) {
    toast({
      title: '⌨️ Keyboard Shortcut',
      description: message,
      duration: 3000,
    });
    markHintShown(shortcut);
  }
};

/**
 * Global keyboard shortcuts system
 * 
 * Shortcuts:
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
        showHintOnce('quick-capture-q', `Press Q anytime to quickly capture tasks`);
        return;
      }

      // Quick Capture: Cmd/Ctrl + K
      if (modKey && e.key === 'k') {
        e.preventDefault();
        options.onQuickCapture?.();
        showHintOnce('quick-capture', `Press ${modKeyName}+K anytime to quickly capture tasks`);
        return;
      }

      // Focus Input: Cmd/Ctrl + /
      if (modKey && e.key === '/') {
        e.preventDefault();
        options.onFocusInput?.();
        showHintOnce('focus-input', `Press ${modKeyName}+/ to focus the main input`);
        return;
      }

      // Daily Review: Cmd/Ctrl + D
      if (modKey && e.key === 'd') {
        e.preventDefault();
        options.onDailyReview?.();
        navigate('/daily-session');
        showHintOnce('daily-review', `Press ${modKeyName}+D to open daily review`);
        return;
      }

      // Search: Cmd/Ctrl + F
      if (modKey && e.key === 'f') {
        e.preventDefault();
        options.onSearch?.();
        showHintOnce('search', `Press ${modKeyName}+F to search tasks`);
        return;
      }

      // Journal: Cmd/Ctrl + J
      if (modKey && e.key === 'j') {
        e.preventDefault();
        navigate('/journal');
        showHintOnce('journal', `Press ${modKeyName}+J to open journal`);
        return;
      }

      // Today View: Cmd/Ctrl + T
      if (modKey && e.key === 't') {
        e.preventDefault();
        navigate('/');
        showHintOnce('today', `Press ${modKeyName}+T to go to Today view`);
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
 * Reset all shown hints (useful for testing or user preference)
 */
export function resetShortcutHints() {
  try {
    localStorage.removeItem(HINTS_STORAGE_KEY);
    toast({
      title: 'Hints Reset',
      description: 'Keyboard shortcut hints will show again',
    });
  } catch {
    // Silently fail
  }
}

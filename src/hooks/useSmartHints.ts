import { useState, useEffect, useCallback } from 'react';

interface HintUsage {
  [key: string]: number;
}

const HINTS = [
  { id: 'quick-capture', text: 'Press Q to quickly add a task', threshold: 5 },
  { id: 'search', text: 'Press ⌘K to search', threshold: 3 },
  { id: 'daily-session', text: 'Press ⌘D to start your day', threshold: 3 },
  { id: 'journal', text: 'Press ⌘J to open journal', threshold: 3 },
  { id: 'tab-switch', text: 'Press Tab to switch between task/thought', threshold: 3 },
  { id: 'shift-enter', text: 'Shift+Enter to save & continue', threshold: 5 },
];

const STORAGE_KEY = 'hint-usage'; // Shared with useKeyboardShortcuts
const ROTATION_INTERVAL = 5000;

function getUsage(): HintUsage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveUsage(usage: HintUsage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function useSmartHints() {
  const [currentHint, setCurrentHint] = useState<string>('');
  const [usage, setUsage] = useState<HintUsage>(getUsage);

  // Get hints that haven't exceeded their threshold
  const getAvailableHints = useCallback(() => {
    return HINTS.filter(hint => (usage[hint.id] || 0) < hint.threshold);
  }, [usage]);

  // Rotate hints
  useEffect(() => {
    const rotate = () => {
      const available = getAvailableHints();
      if (available.length === 0) {
        setCurrentHint('');
        return;
      }
      const randomHint = available[Math.floor(Math.random() * available.length)];
      setCurrentHint(randomHint.text);
    };

    rotate();
    const interval = setInterval(rotate, ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, [getAvailableHints]);

  // Track when user performs an action
  const trackUsage = useCallback((hintId: string) => {
    setUsage(prev => {
      const newUsage = { ...prev, [hintId]: (prev[hintId] || 0) + 1 };
      saveUsage(newUsage);
      return newUsage;
    });
  }, []);

  return { currentHint, trackUsage };
}

// Helper to detect Mac for modifier key display
export function useModifierKey() {
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);
  
  return isMac ? '⌘' : 'Ctrl+';
}

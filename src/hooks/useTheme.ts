import { useEffect } from 'react';
import { useThemeStore } from '@/state/themeState';

export function useTheme() {
  const { theme, resolved, setTheme, resolveTheme } = useThemeStore();

  useEffect(() => {
    resolveTheme();
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => resolveTheme();
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [resolveTheme]);

  return { theme, resolved, setTheme };
}

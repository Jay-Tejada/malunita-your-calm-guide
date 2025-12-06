import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  resolveTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolved: 'light',
      
      setTheme: (theme) => {
        set({ theme });
        get().resolveTheme();
      },
      
      resolveTheme: () => {
        const { theme } = get();
        let resolved: 'light' | 'dark' = 'light';
        
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'dark' 
            : 'light';
        } else {
          resolved = theme;
        }
        
        set({ resolved });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      }
    }),
    { name: 'malunita-theme' }
  )
);

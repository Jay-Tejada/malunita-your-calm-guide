import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'system' as const, label: 'System', icon: Monitor },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">
        Theme
      </span>
      <div className="flex rounded-full p-1 bg-muted">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`Set ${option.label} theme`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

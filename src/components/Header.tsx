import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark");
    }, 800); // 800ms long press
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <button
          className="w-10 h-10 rounded-full bg-accent flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          aria-label="Long press to toggle theme"
        >
          <Sparkles className="w-5 h-5 text-accent-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-wide text-foreground">Malunita</h1>
          <p className="text-xs text-muted-foreground">Your thinking partner</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Today</p>
        <p className="text-sm font-normal text-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>
    </header>
  );
};

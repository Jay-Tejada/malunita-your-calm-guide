import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handlePressStart = () => {
    setIsPressed(true);
    const timer = setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark");
      setIsPressed(false);
    }, 800); // 800ms long press
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsPressed(false);
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <button
          className="relative w-10 h-10 rounded-full bg-accent flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          aria-label="Long press to toggle theme"
        >
          {/* Progress ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            style={{ 
              opacity: isPressed ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="113"
              strokeDashoffset="113"
              className="text-primary"
              style={{
                animation: isPressed ? 'progress-ring 800ms linear forwards' : 'none'
              }}
            />
          </svg>
          <Sparkles className="w-5 h-5 text-accent-foreground relative z-10" />
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

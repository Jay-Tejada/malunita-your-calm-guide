// src/ui/AppLayout.tsx

import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

interface AppLayoutProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  showOrbDock?: boolean;
}

export function AppLayout({
  title,
  showBack = false,
  rightAction,
  children,
  showOrbDock = false,
}: AppLayoutProps) {
  const navigate = useNavigate();

  const goHome = () => navigate("/");

  const handleBack = () => {
    // React Router keeps an internal index in history.state.idx; this is more reliable than history.length
    const idx = typeof window.history.state?.idx === "number" ? window.history.state.idx : 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    goHome();
  };
  return (
    <div className="min-h-screen flex flex-col bg-background font-mono">
      {/* Header */}
      {title && (
        <header className="flex items-center justify-between px-5 py-4 sticky top-0 z-30 bg-background border-b border-border">
          <div className="w-10">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-muted-foreground"
                aria-label="Go back"
              >
                ←
              </button>
            )}
          </div>
          <h1 className="text-xl font-medium text-foreground">
            {title}
          </h1>
          <div className="w-10 flex justify-end">
            {rightAction ??
              (showBack ? (
                <button
                  onClick={goHome}
                  className="p-2 -mr-2 text-muted-foreground"
                  aria-label="Go home"
                >
                  <Home className="h-4 w-4" />
                </button>
              ) : null)}
          </div>
        </header>
      )}

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y"
        style={{ 
          paddingBottom: showOrbDock ? 100 : 20,
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
        }}
      >
        {children}
      </main>
    </div>
  );
}

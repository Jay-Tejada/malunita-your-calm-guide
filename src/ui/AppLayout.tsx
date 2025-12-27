// src/ui/AppLayout.tsx

import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { colors, typography } from "@/ui/tokens";

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
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: colors.bg.base,
        fontFamily: typography.fontFamily,
      }}
    >
      {/* Header */}
      {title && (
        <header
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-30"
          style={{
            backgroundColor: colors.bg.base,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div className="w-10">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2"
                aria-label="Go back"
                style={{ color: colors.text.secondary }}
              >
                ←
              </button>
            )}
          </div>
          <h1
            style={{
              fontSize: typography.titleM.size,
              fontWeight: typography.titleM.weight,
              color: colors.text.primary,
            }}
          >
            {title}
          </h1>
          <div className="w-10 flex justify-end">
            {rightAction ??
              (showBack ? (
                <button
                  onClick={goHome}
                  className="p-2 -mr-2"
                  aria-label="Go home"
                  style={{ color: colors.text.secondary }}
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

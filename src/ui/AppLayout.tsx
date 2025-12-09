// src/ui/AppLayout.tsx

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
              <button onClick={() => window.history.back()} style={{ color: colors.text.secondary }}>
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
          <div className="w-10 flex justify-end">{rightAction}</div>
        </header>
      )}

      {/* Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: showOrbDock ? 100 : 20 }}
      >
        {children}
      </main>
    </div>
  );
}

import { ChevronRight, PanelLeft, PanelRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasTopBarProps {
  projectName: string;
  pageName?: string;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

export function CanvasTopBar({
  projectName,
  pageName,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftSidebarOpen,
  rightSidebarOpen,
}: CanvasTopBarProps) {
  return (
    <header className="h-12 border-b border-canvas-border bg-canvas-sidebar flex items-center justify-between px-3 flex-shrink-0">
      {/* Left: Toggle + Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLeftSidebar}
          className={cn(
            "h-8 w-8 text-canvas-text-muted hover:text-canvas-text",
            leftSidebarOpen && "bg-canvas-bg"
          )}
        >
          <PanelLeft className="w-4 h-4" />
        </Button>

        <nav className="flex items-center text-sm font-mono">
          <span className="text-canvas-text-muted">Malunita</span>
          <ChevronRight className="w-3 h-3 mx-1.5 text-canvas-text-muted" />
          <span className="text-canvas-text font-medium truncate max-w-[150px] sm:max-w-[200px]">
            {projectName}
          </span>
          {pageName && (
            <>
              <ChevronRight className="w-3 h-3 mx-1.5 text-canvas-text-muted hidden sm:block" />
              <span className="text-canvas-text truncate max-w-[100px] hidden sm:block">
                {pageName}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Orb icon + Toggle */}
      <div className="flex items-center gap-2">
        {/* Decorative orb */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-canvas-accent/60 to-canvas-accent opacity-80" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightSidebar}
          className={cn(
            "h-8 w-8 text-canvas-text-muted hover:text-canvas-text",
            rightSidebarOpen && "bg-canvas-bg"
          )}
        >
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

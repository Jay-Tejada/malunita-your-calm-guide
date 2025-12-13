import { useNavigate } from "react-router-dom";
import { ChevronRight, PanelLeft, PanelRight } from "lucide-react";
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
  const navigate = useNavigate();

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
          <button
            onClick={onToggleLeftSidebar}
            className="text-canvas-text-muted hover:text-canvas-text transition-colors"
            title="Toggle sidebar"
          >
            Malunita
          </button>
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
        {/* Home orb button */}
        <button
          onClick={() => navigate("/")}
          className="group p-0 border-0 bg-transparent cursor-pointer hover:scale-110 transition-transform"
          title="Go home"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-canvas-accent/60 to-canvas-accent opacity-80 group-hover:opacity-100 transition-all group-hover:shadow-[0_0_12px_hsl(var(--canvas-accent)/0.6)]" />
        </button>

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

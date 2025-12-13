import { LayoutGrid, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutToggleProps {
  value: "grid" | "split";
  onChange: (value: "grid" | "split") => void;
}

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-end">
        <div className="flex items-center bg-canvas-sidebar/50 rounded-lg p-0.5 border border-canvas-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  alert('Switching to grid');
                  onChange("grid");
                }}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200 motion-reduce:transition-none",
                  value === "grid"
                    ? "bg-white/10 text-canvas-text"
                    : "text-canvas-text-muted hover:text-canvas-text"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Grid view
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  alert('Switching to split');
                  onChange("split");
                }}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200 motion-reduce:transition-none",
                  value === "split"
                    ? "bg-white/10 text-canvas-text"
                    : "text-canvas-text-muted hover:text-canvas-text"
                )}
              >
                <Columns2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Split view
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Debug indicator */}
        <div className="text-xs text-red-500 mt-2">
          Mode: {value}
        </div>
      </div>
    </TooltipProvider>
  );
}

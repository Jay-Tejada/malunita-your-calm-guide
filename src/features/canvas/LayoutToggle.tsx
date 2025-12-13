import { cn } from "@/lib/utils";

interface LayoutToggleProps {
  value: "inline" | "split";
  onChange: (value: "inline" | "split") => void;
}

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center bg-canvas-sidebar/50 rounded-full p-0.5 border border-canvas-border/50">
      <button
        onClick={() => onChange("inline")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 motion-reduce:transition-none",
          value === "inline"
            ? "bg-canvas-accent/20 text-canvas-text"
            : "text-canvas-text-muted hover:text-canvas-text"
        )}
      >
        Inline
      </button>
      <button
        onClick={() => onChange("split")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 motion-reduce:transition-none",
          value === "split"
            ? "bg-canvas-accent/20 text-canvas-text"
            : "text-canvas-text-muted hover:text-canvas-text"
        )}
      >
        Split
      </button>
    </div>
  );
}

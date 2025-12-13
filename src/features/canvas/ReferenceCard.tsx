import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface ReferenceCardProps {
  children: ReactNode;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  className?: string;
}

export function ReferenceCard({ 
  children, 
  caption, 
  onCaptionChange,
  className 
}: ReferenceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localCaption, setLocalCaption] = useState(caption || "");

  const handleBlur = () => {
    setIsEditing(false);
    if (onCaptionChange && localCaption !== caption) {
      onCaptionChange(localCaption);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[14px] bg-muted/50 dark:bg-muted/30 shadow-sm overflow-hidden",
        "border border-border/50",
        className
      )}
    >
      {/* Image/Gallery Content */}
      <div className="p-3">
        {children}
      </div>

      {/* Caption */}
      <div className="px-3 pb-3">
        {isEditing ? (
          <input
            type="text"
            value={localCaption}
            onChange={(e) => setLocalCaption(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            autoFocus
            placeholder="Add a caption..."
            className="w-full text-xs font-mono text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
          />
        ) : (
          <p
            onClick={() => onCaptionChange && setIsEditing(true)}
            className={cn(
              "text-xs font-mono text-muted-foreground cursor-text min-h-[1.25rem]",
              !localCaption && onCaptionChange && "text-muted-foreground/50 hover:text-muted-foreground"
            )}
          >
            {localCaption || (onCaptionChange ? "Add caption..." : "")}
          </p>
        )}
      </div>
    </div>
  );
}

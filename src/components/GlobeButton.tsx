import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobeButtonProps {
  position: "top-left" | "top-right";
  onClick: () => void;
  variant?: "menu" | "home";
  isActive?: boolean;
}

export const GlobeButton = ({ 
  position, 
  onClick, 
  variant = "menu",
  isActive = false 
}: GlobeButtonProps) => {
  const positionClasses = {
    "top-left": "fixed top-6 left-6",
    "top-right": "fixed top-6 right-6",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        "z-50 flex items-center justify-center group",
        "transition-transform duration-200 hover:scale-110 active:scale-90"
      )}
    >
      <div className="animate-spin-continuous">
        <Globe2 
          className={cn(
            "w-8 h-8 transition-colors duration-300",
            isActive ? "text-primary" : "text-foreground/60",
            "group-hover:text-primary"
          )}
        />
      </div>
    </button>
  );
};

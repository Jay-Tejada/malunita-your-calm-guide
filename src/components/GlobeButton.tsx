import { Menu, User } from "lucide-react";
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

  const Icon = variant === "menu" ? Menu : User;

  return (
    <button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        "z-50 flex items-center justify-center",
        "transition-opacity duration-300"
      )}
    >
      <Icon 
        className={cn(
          "w-6 h-6 transition-opacity duration-300",
          isActive ? "text-muted-foreground/50" : "text-muted-foreground/30",
          "hover:text-muted-foreground/50"
        )}
      />
    </button>
  );
};

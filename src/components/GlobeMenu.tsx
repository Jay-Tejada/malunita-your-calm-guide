import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
}

interface GlobeMenuProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  items: MenuItem[];
  activeItem?: string;
  hasNotification?: boolean;
}

export const GlobeMenu = ({ position, items, activeItem, hasNotification }: GlobeMenuProps) => {
  const [open, setOpen] = useState(false);

  const positionClasses = {
    "top-left": "fixed top-4 left-4",
    "top-right": "fixed top-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
  };

  return (
    <div className={`${positionClasses[position]} z-50`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted/50 transition-all duration-300 group relative shadow-lg"
          >
            <Globe2 className="w-6 h-6 text-primary animate-float-spin transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] group-hover:scale-110" />
            {hasNotification && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-56 p-2 bg-background/95 backdrop-blur-sm border-border/50"
          align={position.includes("right") ? "end" : "start"}
          side={position.includes("top") ? "bottom" : "top"}
        >
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
                  activeItem === item.id ? "bg-muted text-primary font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

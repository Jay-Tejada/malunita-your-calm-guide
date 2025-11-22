import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe2, Sparkles, Calendar, Target, Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FloatingMenuProps {
  onSettingsClick: () => void;
  onCategoryClick: (category: string) => void;
  hasUrgentTasks: boolean;
}

export const FloatingMenu = ({ onSettingsClick, onCategoryClick, hasUrgentTasks }: FloatingMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { 
      icon: Globe2, 
      label: "All Tasks", 
      action: () => onCategoryClick('all'),
      color: "text-primary"
    },
    { 
      icon: Calendar, 
      label: "Daily Session", 
      action: () => navigate('/daily-session'),
      color: "text-blue-500"
    },
    { 
      icon: Target, 
      label: "Goals", 
      action: () => navigate('/goals'),
      color: "text-green-500"
    },
    { 
      icon: Sparkles, 
      label: "Tiny Task Fiesta", 
      action: () => navigate('/tiny-task-fiesta'),
      color: "text-yellow-500"
    },
    { 
      icon: Bell, 
      label: "Reminders", 
      action: () => navigate('/reminders'),
      color: "text-purple-500"
    },
    { 
      icon: Settings, 
      label: "Settings", 
      action: onSettingsClick,
      color: "text-muted-foreground"
    },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Main Toggle Button */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          isOpen && "rotate-45",
          hasUrgentTasks && "animate-pulse"
        )}
      >
        <Globe2 className="h-5 w-5" />
        {hasUrgentTasks && !isOpen && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full" />
        )}
      </Button>

      {/* Menu Items */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="absolute top-16 right-0 space-y-2 animate-fade-in">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="secondary"
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-48 justify-start gap-3 shadow-md animate-slide-in-from-right",
                    "hover:scale-105 transition-transform"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className={cn("h-4 w-4", item.color)} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

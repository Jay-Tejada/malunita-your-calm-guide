import { Inbox, FolderKanban, Mic, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCaptureClick: () => void;
}

export const BottomNav = ({ activeTab, onTabChange, onCaptureClick }: BottomNavProps) => {
  const navItems = [
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'capture', icon: Mic, label: 'Capture' },
    { id: 'review', icon: RotateCcw, label: 'Review' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCapture = item.id === 'capture';

          if (isCapture) {
            return (
              <Button
                key={item.id}
                onClick={onCaptureClick}
                className="relative -mt-8 w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg animate-pulse hover:animate-none transition-all"
                size="icon"
              >
                <Icon className="w-6 h-6 text-primary-foreground" />
              </Button>
            );
          }

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Inbox, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MalunitaVoice } from "./MalunitaVoice";
import { hapticLight } from "@/utils/haptics";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const { openQuickCapture } = useQuickCapture();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Inbox, label: "Inbox", path: "/inbox" },
    { icon: Plus, label: "Add", action: () => openQuickCapture() },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    hapticLight();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handlePressStart = (label: string) => {
    setPressedItem(label);
  };

  const handlePressEnd = () => {
    setPressedItem(null);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center px-8 py-4 pointer-events-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === location.pathname;
            const isPressed = pressedItem === item.label;
            const isAddButton = item.label === "Add";

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                onMouseDown={() => handlePressStart(item.label)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(item.label)}
                onTouchEnd={handlePressEnd}
                className={cn(
                  "relative p-3 -m-3 transition-transform duration-100",
                  isPressed && "scale-95"
                )}
                aria-label={item.label}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-opacity duration-150",
                    isActive 
                      ? "opacity-100 text-primary" 
                      : isAddButton
                        ? "opacity-60 text-muted-foreground"
                        : "opacity-50 text-muted-foreground"
                  )}
                  strokeWidth={1.75}
                />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">Voice Capture</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Hold the button and speak your thoughts. Malunita will transcribe and sort them.
            </p>
            <MalunitaVoice />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

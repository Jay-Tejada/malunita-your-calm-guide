import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Inbox, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MalunitaVoice } from "./MalunitaVoice";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Inbox, label: "Inbox", path: "/inbox" },
    { icon: Mic, label: "Voice", action: () => setIsVoiceModalOpen(true) },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === location.pathname;

            return (
              <button
                key={item.label}
                onClick={() => item.action ? item.action() : navigate(item.path!)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", item.label === "Voice" && "h-6 w-6")} />
                <span className="text-xs font-medium">{item.label}</span>
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

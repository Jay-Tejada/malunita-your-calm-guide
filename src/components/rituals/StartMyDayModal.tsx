import { useState } from "react";
import { X, Sun, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  taskCount?: number;
  inboxCount?: number;
  onNext?: (intention: string) => void;
}

export const StartMyDayModal = ({
  isOpen,
  onClose,
  userName = "Friend",
  taskCount = 0,
  inboxCount = 0,
  onNext,
}: StartMyDayModalProps) => {
  const [oneThingToday, setOneThingToday] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun };
    if (hour < 18) return { text: "Good Afternoon", icon: Sunset };
    return { text: "Good Evening", icon: Moon };
  };

  const handleNext = () => {
    if (onNext) onNext(oneThingToday);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-card rounded-3xl shadow-lg p-8 max-w-md w-full mx-4 font-mono">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Greeting */}
        <div className="flex items-center gap-2 mb-4">
          <GreetingIcon className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-light text-foreground">
            {greeting.text}, {userName}
          </h1>
        </div>

        {/* Stats */}
        <p className="text-sm text-muted-foreground mb-1">
          {taskCount} task{taskCount !== 1 ? "s" : ""} on your plate today
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          {inboxCount} item{inboxCount !== 1 ? "s" : ""} in inbox
        </p>
        <p className="text-sm text-foreground/70 mb-6">Let's do this.</p>

        {/* One Thing Input */}
        <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
          Your One Thing Today
        </label>
        <input
          type="text"
          value={oneThingToday}
          onChange={(e) => setOneThingToday(e.target.value)}
          placeholder="What would make today a success?"
          className="w-full mt-2 p-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />

        {/* Next Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

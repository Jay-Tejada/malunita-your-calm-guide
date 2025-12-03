import { useState } from "react";
import { Sun, Moon, Sunset } from "lucide-react";

interface StartMyDayPhase1Props {
  userName?: string;
  taskCount?: number;
  inboxCount?: number;
  onNext?: (oneThing: string) => void;
}

const StartMyDayPhase1 = ({ 
  userName = "Jay", 
  taskCount = 2, 
  inboxCount = 42, 
  onNext 
}: StartMyDayPhase1Props) => {
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

  const greeting = getGreeting();
  const Icon = greeting.icon;

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-3xl shadow-lg p-8 max-w-md mx-auto font-mono">
      {/* Greeting */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-light text-foreground">{greeting.text}, {userName}</h1>
      </div>

      {/* Stats */}
      <p className="text-sm text-muted-foreground mb-1">{taskCount} tasks on your plate today</p>
      <p className="text-sm text-muted-foreground mb-2">{inboxCount} items in inbox</p>
      <p className="text-sm text-foreground/70 mb-6">Let's do this.</p>

      {/* One Thing Input */}
      <label className="text-xs text-muted-foreground/60 uppercase tracking-wide">
        Your One Thing Today
      </label>
      <input
        type="text"
        value={oneThingToday}
        onChange={(e) => setOneThingToday(e.target.value)}
        placeholder="What would make today a success?"
        className="w-full mt-2 p-3 border border-border rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Next Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm text-secondary-foreground transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default StartMyDayPhase1;

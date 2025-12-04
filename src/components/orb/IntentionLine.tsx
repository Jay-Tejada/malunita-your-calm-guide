import { useOrbStore } from '@/state/orbState';

const intentionMap: Record<string, string> = {
  idle: "Quiet strength.",
  thinking: "Processing your flow...",
  celebrating: "You did that. ✦",
  focused: "Locked in.",
  morning: "New day. Fresh slate.",
  evening: "Rest and reset.",
  evolving: "Growing with you.",
};

export function IntentionLine() {
  const { mood } = useOrbStore();
  const line = intentionMap[mood] || "Still here.";
  
  return (
    <p 
      className="text-center text-sm font-light tracking-wide text-muted-foreground/70 transition-all duration-700 font-mono"
    >
      {line}
    </p>
  );
}

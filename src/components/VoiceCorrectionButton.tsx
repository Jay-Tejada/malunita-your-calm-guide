import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface VoiceCorrectionButtonProps {
  transcript: string;
  onTrigger: () => void;
  show?: boolean;
}

export const VoiceCorrectionButton = ({ 
  transcript, 
  onTrigger,
  show = true 
}: VoiceCorrectionButtonProps) => {
  if (!show || !transcript) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onTrigger}
      className="gap-2 text-xs text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
    >
      <AlertCircle className="h-3 w-3" />
      Malunita misunderstood → Fix
    </Button>
  );
};
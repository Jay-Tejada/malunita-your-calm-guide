import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useCapture } from "@/hooks/useAICapture";
import { useToast } from "@/hooks/use-toast";

interface TaskCaptureInputProps {
  placeholder: string;
  category?: string;
  onCapture?: (text: string) => void;
}

export const TaskCaptureInput = ({ 
  placeholder, 
  category,
  onCapture 
}: TaskCaptureInputProps) => {
  const [input, setInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { capture, isCapturing } = useCapture();
  const { toast } = useToast();

  const handleCapture = async () => {
    if (!input.trim()) return;

    try {
      if (onCapture) {
        // Custom handler provided (for page-specific logic)
        onCapture(input.trim());
      } else {
        // Route through AI pipeline for full processing
        await capture({
          text: input.trim(),
          category: category || 'inbox',
        });
      }

      // Show success state briefly
      setShowSuccess(true);
      setInput("");
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 1000);
    } catch (error) {
      toast({
        title: "Failed to capture task",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCapture();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full py-3 px-0 border-0 border-b border-foreground/10 bg-transparent font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-colors"
      />
      
      {/* Arrow or checkmark icon */}
      {input.trim() && !showSuccess && (
        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
      )}
      
      {showSuccess && (
        <Check className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
      )}
    </div>
  );
};

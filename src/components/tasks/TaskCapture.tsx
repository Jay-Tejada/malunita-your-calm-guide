import { useState, KeyboardEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useCapture } from "@/hooks/useAICapture";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskCaptureProps {
  placeholder: string;
  category: string;
}

export const TaskCapture = ({ placeholder, category }: TaskCaptureProps) => {
  const { capture, isCapturing } = useCapture();
  const [quickInput, setQuickInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleCapture = async () => {
    if (!quickInput.trim()) return;
    
    try {
      // Route through AI pipeline for full processing
      await capture({
        text: quickInput.trim(),
        category,
      });
      
      setQuickInput("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        description: "Failed to capture",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleQuickCapture = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleCapture();
    }
  };

  return (
    <div className="mb-6 relative">
      <div className="relative">
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={handleQuickCapture}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent border-0 border-b transition-all font-mono text-sm py-2 pr-8 px-0 placeholder:text-muted-foreground/40 outline-none",
            showSuccess 
              ? "border-primary/50" 
              : "border-border/30 focus:border-foreground/40"
          )}
        />
        
        {/* Send indicator */}
        {quickInput.trim() && !showSuccess && (
          <button
            onClick={handleCapture}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        
        {/* Success checkmark */}
        {showSuccess && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary animate-scale-in">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Hint text */}
      {!quickInput.trim() && !showSuccess && (
        <p className="text-[10px] text-muted-foreground/30 mt-1 font-mono">
          Press enter to capture
        </p>
      )}
    </div>
  );
};

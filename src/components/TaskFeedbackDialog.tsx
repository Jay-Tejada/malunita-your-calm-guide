import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, RotateCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  originalText: string;
}

export const TaskFeedbackDialog = ({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  originalText,
}: TaskFeedbackDialogProps) => {
  const { toast } = useToast();
  const [showRephraseInput, setShowRephraseInput] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (
    feedbackType: "confirmed" | "rephrase" | "wrong"
  ) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Store feedback
      const { error } = await supabase.from("task_learning_feedback").insert({
        user_id: user.id,
        original_text: originalText,
        task_title: taskTitle,
        suggested_category: "", // Can be enhanced later
        actual_category: "", // Can be enhanced later
        suggested_timeframe: "",
        actual_timeframe: "",
        was_corrected: feedbackType === "rephrase",
      });

      if (error) throw error;

      // If wrong or rephrase with correction, update the task
      if (feedbackType === "wrong") {
        // Delete the task
        await supabase.from("tasks").delete().eq("id", taskId);
        
        toast({
          title: "Task removed",
          description: "Thanks for the feedback!",
        });
      } else if (feedbackType === "rephrase" && correctedText.trim()) {
        // Update the task with corrected text
        await supabase
          .from("tasks")
          .update({ title: correctedText.trim() })
          .eq("id", taskId);
        
        toast({
          title: "Task updated",
          description: "Your correction has been saved",
        });
      } else if (feedbackType === "confirmed") {
        toast({
          title: "Thanks!",
          description: "Your feedback helps improve accuracy",
        });
      }

      onOpenChange(false);
      setShowRephraseInput(false);
      setCorrectedText("");
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRephraseClick = () => {
    setShowRephraseInput(true);
  };

  const handleSubmitRephrase = () => {
    if (correctedText.trim()) {
      handleFeedback("rephrase");
    } else {
      toast({
        title: "Empty correction",
        description: "Please enter the corrected text",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did we do?</DialogTitle>
          <DialogDescription>
            Your feedback helps improve voice recognition accuracy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Created task:</p>
            <p className="text-sm">{taskTitle}</p>
          </div>

          {!showRephraseInput ? (
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleFeedback("confirmed")}
                disabled={isSubmitting}
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Check className="w-5 h-5 text-success" />
                <span className="text-xs">Confirmed</span>
              </Button>

              <Button
                onClick={handleRephraseClick}
                disabled={isSubmitting}
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
              >
                <RotateCw className="w-5 h-5 text-primary" />
                <span className="text-xs">Rephrase</span>
              </Button>

              <Button
                onClick={() => handleFeedback("wrong")}
                disabled={isSubmitting}
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
              >
                <X className="w-5 h-5 text-destructive" />
                <span className="text-xs">Wrong</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Enter the corrected text..."
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitRephrase}
                  disabled={isSubmitting || !correctedText.trim()}
                  className="flex-1"
                >
                  Submit
                </Button>
                <Button
                  onClick={() => {
                    setShowRephraseInput(false);
                    setCorrectedText("");
                  }}
                  disabled={isSubmitting}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
          >
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, RotateCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  originalText: string;
  suggestedCategory?: string;
  actualCategory?: string;
  suggestedTimeframe?: string;
  actualTimeframe?: string;
}

export const TaskFeedbackDialog = ({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  originalText,
  suggestedCategory = "",
  actualCategory = "",
  suggestedTimeframe = "",
  actualTimeframe = "",
}: TaskFeedbackDialogProps) => {
  const { toast } = useToast();
  const [showRephraseInput, setShowRephraseInput] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [correctedCategory, setCorrectedCategory] = useState(actualCategory);
  const [correctedTimeframe, setCorrectedTimeframe] = useState(actualTimeframe);
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
        task_title: feedbackType === "rephrase" && correctedText.trim() ? correctedText.trim() : taskTitle,
        suggested_category: suggestedCategory,
        actual_category: feedbackType === "rephrase" ? correctedCategory : actualCategory,
        suggested_timeframe: suggestedTimeframe,
        actual_timeframe: feedbackType === "rephrase" ? correctedTimeframe : actualTimeframe,
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
        // Update the task with corrected text and category
        const updates: any = { title: correctedText.trim() };
        if (correctedCategory !== actualCategory) {
          updates.category = correctedCategory;
        }
        await supabase
          .from("tasks")
          .update(updates)
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="corrected-text" className="text-sm mb-2">
                  Correct the task title
                </Label>
                <Textarea
                  id="corrected-text"
                  placeholder="Enter the corrected text..."
                  value={correctedText}
                  onChange={(e) => setCorrectedText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="corrected-category" className="text-sm mb-2">
                  Correct the category
                </Label>
                <Select
                  value={correctedCategory}
                  onValueChange={setCorrectedCategory}
                >
                  <SelectTrigger id="corrected-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbox">Inbox</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                  </SelectContent>
                </Select>
                {suggestedCategory && suggestedCategory !== correctedCategory && (
                  <p className="text-xs text-muted-foreground mt-1">
                    AI suggested: {suggestedCategory}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitRephrase}
                  disabled={isSubmitting || !correctedText.trim()}
                  className="flex-1"
                >
                  Submit Correction
                </Button>
                <Button
                  onClick={() => {
                    setShowRephraseInput(false);
                    setCorrectedText("");
                    setCorrectedCategory(actualCategory);
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
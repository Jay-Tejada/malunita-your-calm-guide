import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCustomCategories } from "@/hooks/useCustomCategories";

interface TaskCategoryFeedbackProps {
  taskId: string;
  taskTitle: string;
  currentCategory: string;
  originalText?: string;
}

export const TaskCategoryFeedback = ({ 
  taskId, 
  taskTitle, 
  currentCategory,
  originalText = ""
}: TaskCategoryFeedbackProps) => {
  const [showFeedback, setShowFeedback] = useState(true);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState(currentCategory);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyFeedback, setAlreadyFeedback] = useState(false);
  const { toast } = useToast();
  const { categories: customCategories } = useCustomCategories();

  // Check if feedback already exists for this task
  useEffect(() => {
    const checkExistingFeedback = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('task_learning_feedback' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('task_title', taskTitle)
        .limit(1);

      if (!error && data && data.length > 0) {
        setAlreadyFeedback(true);
        setShowFeedback(false);
      }
    };

    checkExistingFeedback();
  }, [taskTitle]);

  const handleYes = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save positive feedback
      await supabase.from('task_learning_feedback' as any).insert({
        user_id: user.id,
        original_text: originalText || taskTitle,
        task_title: taskTitle,
        suggested_category: currentCategory,
        actual_category: currentCategory,
        suggested_timeframe: "",
        actual_timeframe: "",
        was_corrected: false,
      });

      toast({
        title: "Thanks!",
        description: "Your feedback helps improve Malunita.",
      });

      setShowFeedback(false);
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNo = () => {
    setShowCorrectionForm(true);
  };

  const handleSubmitCorrection = async () => {
    if (!correctedCategory || correctedCategory === currentCategory) {
      toast({
        title: "Select a different category",
        description: "Please choose the correct category",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save correction feedback
      await supabase.from('task_learning_feedback' as any).insert({
        user_id: user.id,
        original_text: originalText || taskTitle,
        task_title: taskTitle,
        suggested_category: currentCategory,
        actual_category: correctedCategory,
        suggested_timeframe: note || "",
        actual_timeframe: note || "",
        was_corrected: true,
      });

      // Update the task category
      await supabase
        .from('tasks')
        .update({ category: correctedCategory })
        .eq('id', taskId);

      // Trigger global trends analyzer in the background
      supabase.functions.invoke('global-trends-analyzer', { body: {} }).catch(err => {
        console.log('Background analyzer trigger failed:', err);
      });

      toast({
        title: "Thanks! We'll use this to make Malunita smarter.",
        description: "Task category updated",
      });

      setShowFeedback(false);
    } catch (error: any) {
      console.error("Error saving correction:", error);
      toast({
        title: "Error",
        description: "Failed to save correction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showFeedback || alreadyFeedback) {
    return null;
  }

  const allCategories = [
    { value: 'inbox', label: 'Inbox' },
    { value: 'work', label: 'Work' },
    { value: 'home', label: 'Home' },
    { value: 'gym', label: 'Gym' },
    { value: 'projects', label: 'Projects' },
    ...(customCategories || []).map(cat => ({
      value: `custom-${cat.id}`,
      label: cat.name
    }))
  ];

  return (
    <div className="ml-12 mt-2 p-3 bg-muted/30 border border-border rounded-lg text-sm animate-in fade-in duration-300">
      {!showCorrectionForm ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">Was this categorized correctly?</p>
          <div className="flex gap-2">
            <Button
              onClick={handleYes}
              disabled={isSubmitting}
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
            >
              <Check className="w-4 h-4 text-success" />
              Yes
            </Button>
            <Button
              onClick={handleNo}
              disabled={isSubmitting}
              variant="outline"
              size="sm"
              className="gap-2 flex-1"
            >
              <X className="w-4 h-4 text-destructive" />
              No
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground">What's the correct category?</p>
          
          <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {allCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Optional note to help improve AI..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[60px] text-sm bg-background"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitCorrection}
              disabled={isSubmitting || !correctedCategory}
              size="sm"
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit correction"}
            </Button>
            <Button
              onClick={() => {
                setShowCorrectionForm(false);
                setShowFeedback(false);
              }}
              disabled={isSubmitting}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

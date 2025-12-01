import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyFeedback, setAlreadyFeedback] = useState(false);
  const { toast } = useToast();
  const { categories: customCategories } = useCustomCategories();

  // Don't show feedback for inbox tasks
  if (currentCategory === 'inbox') {
    return null;
  }

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
        suggested_timeframe: "",
        actual_timeframe: "",
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

  const getCategoryLabel = (cat: string) => {
    if (cat.startsWith('custom-')) {
      const customCat = customCategories?.find(c => `custom-${c.id}` === cat);
      return customCat?.name || cat;
    }
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const allCategories = [
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
    <div className="ml-12 mt-1">
      {!showCorrectionForm ? (
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            {getCategoryLabel(currentCategory)}
          </span>
          <button
            onClick={handleYes}
            disabled={isSubmitting}
            className="hover:text-foreground/80 transition-colors p-0.5"
            title="Correct"
          >
            <ThumbsUp className="w-3 h-3" />
          </button>
          <button
            onClick={handleNo}
            disabled={isSubmitting}
            className="hover:text-foreground/80 transition-colors p-0.5"
            title="Wrong category"
          >
            <ThumbsDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-xs animate-in fade-in duration-200">
          <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
            <SelectTrigger className="h-7 text-xs bg-background border-foreground/20 w-[120px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {allCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSubmitCorrection}
            disabled={isSubmitting || !correctedCategory}
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
          >
            {isSubmitting ? "..." : "Save"}
          </Button>
          <Button
            onClick={() => {
              setShowCorrectionForm(false);
              setShowFeedback(false);
            }}
            disabled={isSubmitting}
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { CategorySuggestions } from "@/components/CategorySuggestions";

interface SuggestedTask {
  title: string;
  suggested_category: string;
  custom_category_id?: string;
  suggested_timeframe: string;
  confidence: number;
  confirmation_prompt: string;
}

interface TaskConfirmationProps {
  tasks: SuggestedTask[];
  originalText: string;
  onConfirm: (confirmedTasks: Array<{title: string; category: string; is_focus: boolean; custom_category_id?: string}>) => void;
  onCancel: () => void;
}

interface CategorySuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  reason: string;
}

export const TaskConfirmation: React.FC<TaskConfirmationProps> = ({ tasks, originalText, onConfirm, onCancel }) => {
  const { categories: customCategories } = useCustomCategories();
  const [editedTasks, setEditedTasks] = React.useState(
    tasks.map(task => ({
      title: task.title,
      category: task.suggested_category,
      custom_category_id: task.custom_category_id,
      timeframe: task.suggested_timeframe
    }))
  );
  const [categorySuggestions, setCategorySuggestions] = useState<Record<number, CategorySuggestion[]>>({});

  // Fetch category suggestions for each task
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!customCategories || customCategories.length === 0) return;

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        try {
          const { data, error } = await supabase.functions.invoke('suggest-custom-category', {
            body: { taskText: task.title }
          });

          if (!error && data?.suggestions) {
            setCategorySuggestions(prev => ({
              ...prev,
              [i]: data.suggestions
            }));
          }
        } catch (err) {
          console.error('Failed to fetch category suggestions:', err);
        }
      }
    };

    fetchSuggestions();
  }, [tasks, customCategories]);

  const handleCategoryChange = (index: number, category: string, customCategoryId?: string) => {
    const updated = [...editedTasks];
    updated[index].category = category;
    updated[index].custom_category_id = customCategoryId;
    setEditedTasks(updated);
  };

  const handleTimeframeChange = (index: number, timeframe: string) => {
    const updated = [...editedTasks];
    updated[index].timeframe = timeframe;
    setEditedTasks(updated);
  };

  const handleSuggestionSelect = (taskIndex: number, categoryId: string) => {
    const category = customCategories?.find(c => c.id === categoryId);
    if (category) {
      handleCategoryChange(taskIndex, `custom-${categoryId}`, categoryId);
    }
  };

  const handleConfirm = async () => {
    // Track corrections for learning
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const feedbackPromises = tasks.map((originalTask, index) => {
        const editedTask = editedTasks[index];
        const wasCorrected = 
          originalTask.suggested_category !== editedTask.category ||
          originalTask.suggested_timeframe !== editedTask.timeframe;

        return supabase.from('task_learning_feedback').insert({
          user_id: user.id,
          original_text: originalText,
          task_title: editedTask.title,
          suggested_category: originalTask.suggested_category,
          actual_category: editedTask.category,
          suggested_timeframe: originalTask.suggested_timeframe,
          actual_timeframe: editedTask.timeframe,
          was_corrected: wasCorrected
        });
      });

      await Promise.all(feedbackPromises);
    }

    const confirmed = editedTasks.map(task => ({
      title: task.title,
      category: task.category,
      custom_category_id: task.custom_category_id,
      is_focus: task.timeframe === 'today'
    }));
    onConfirm(confirmed);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <Card className="max-w-2xl w-full p-6 space-y-6">
        <div>
          <h3 className="text-xl font-light mb-2">Confirm Your Tasks</h3>
          <p className="text-sm text-muted-foreground">
            I've extracted {tasks.length} task{tasks.length > 1 ? 's' : ''} from your input. Review and adjust as needed.
          </p>
        </div>

        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={index} className="space-y-3 p-4 rounded-lg border border-secondary">
              <div>
                <p className="font-normal mb-1">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.confirmation_prompt}</p>
              </div>

              {categorySuggestions[index] && categorySuggestions[index].length > 0 && (
                <CategorySuggestions
                  suggestions={categorySuggestions[index]}
                  onSelectSuggestion={(categoryId) => handleSuggestionSelect(index, categoryId)}
                  className="mb-3"
                />
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Select
                    value={editedTasks[index].category}
                    onValueChange={(value) => {
                      const customCategory = customCategories?.find(c => `custom-${c.id}` === value);
                      handleCategoryChange(index, value, customCategory?.id);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbox">Inbox</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="someday">Someday</SelectItem>
                      {customCategories && customCategories.length > 0 && (
                        <>
                          <SelectItem value="divider" disabled>──────────</SelectItem>
                          {customCategories.map(cat => (
                            <SelectItem key={cat.id} value={`custom-${cat.id}`}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Timeframe</label>
                  <Select
                    value={editedTasks[index].timeframe}
                    onValueChange={(value) => handleTimeframeChange(index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today (Focus)</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="later">Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {task.confidence < 0.7 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  Low confidence - please review carefully
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            Confirm & Save
          </Button>
        </div>
      </Card>
    </div>
  );
};

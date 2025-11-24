import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, User, Clock, Bell, Star, MapPin } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { DomainTabs } from "@/components/DomainTabs";
import { CategoryManager } from "@/components/CategoryManager";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { TaskCategoryFeedback } from "@/components/TaskCategoryFeedback";
import { TaskEditDialog } from "@/components/TaskEditDialog";
import { useToast } from "@/hooks/use-toast";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { useAutoSplitTask } from "@/hooks/useAutoSplitTask";
import { useRelatedTaskSuggestions } from "@/hooks/useRelatedTaskSuggestions";
import { WorkloadBalanceSuggestions } from "@/components/WorkloadBalanceSuggestions";
import { WorkloadSuggestion } from "@/ai/adaptiveWorkloadBalancer";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface TaskListProps {
  category?: string;
}

export const TaskList = ({ category: externalCategory }: TaskListProps = {}) => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { categories, createCategory } = useCustomCategories();
  const growth = useCompanionGrowth();
  const { generateAndCreateSubtasks } = useAutoSplitTask();
  const { checkForRelatedTasks } = useRelatedTaskSuggestions();
  const [internalDomain, setInternalDomain] = useState("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const { toast } = useToast();
  
  // Use external category if provided, otherwise use internal state
  const selectedDomain = externalCategory ?? internalDomain;
  const setSelectedDomain = externalCategory ? () => {} : setInternalDomain;

  const handleCreateCategory = async (name: string) => {
    try {
      await createCategory({ name, icon: "Tag", color: "#6B7280" });
      toast({
        title: "Category created",
        description: `"${name}" is now available for tagging tasks`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks?.find((t) => t.id === taskId);
    
    if (!task) return;

    // Check if dropped on a category tab
    const categoryMatch = over.id.toString().match(/^category-(.+)$/);
    if (categoryMatch) {
      const newCategory = categoryMatch[1];
      
      if (task.category !== newCategory) {
        updateTask({
          id: taskId,
          updates: { category: newCategory },
        });
        
        toast({
          title: "Task moved",
          description: `Moved to ${newCategory.charAt(0).toUpperCase() + newCategory.slice(1)}`,
        });
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if a task is selected and not typing in an input
      if (!selectedTaskId || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const categoryMap: { [key: string]: string } = {
        '1': 'inbox',
        '2': 'home',
        '3': 'work',
        '4': 'gym',
        '5': 'projects',
      };

      const category = categoryMap[e.key];
      if (category) {
        e.preventDefault();
        const task = tasks?.find((t) => t.id === selectedTaskId);
        if (task && task.category !== category) {
          updateTask({
            id: selectedTaskId,
            updates: { category },
          });
          toast({
            title: "Task moved",
            description: `Moved to ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTaskId, tasks, updateTask, toast]);


  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Filter tasks by selected domain or custom category, excluding focus tasks
  const filteredTasks = tasks?.filter(task => {
    if (task.is_focus) return false;
    
    // Show all non-focus tasks if "all" is selected
    if (selectedDomain === 'all') return true;
    
    // Check if selected domain is a custom category ID
    const isCustomCategory = selectedDomain.startsWith('custom-');
    if (isCustomCategory) {
      const categoryId = selectedDomain.replace('custom-', '');
      return task.custom_category_id === categoryId;
    }
    
    return task.category === selectedDomain;
  }) || [];
  const activeTask = activeId ? tasks?.find((t) => t.id === activeId) : null;

  if (!tasks || tasks.length === 0) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <DomainTabs 
          value={selectedDomain} 
          onChange={setSelectedDomain} 
          isDragging={!!activeId}
          customCategories={categories || []}
          onCreateCategory={handleCreateCategory}
        />
        <Card className="p-8 text-center text-muted-foreground mt-4">
          <p>No tasks yet. Start by speaking into Malunita.</p>
        </Card>
      </DndContext>
    );
  }

  const handleToggleComplete = async (task: Task) => {
    const wasCompleted = task.completed;
    const nowCompleted = !task.completed;
    
    updateTask({
      id: task.id,
      updates: {
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      },
    });
    
    // Award XP only when completing (not uncompleting)
    if (nowCompleted && !wasCompleted) {
      await growth.addXp(1, 'Task completed');
    }
  };

  const handleAddToFocus = async (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;
    
    await updateTask({
      id: taskId,
      updates: {
        is_focus: true,
        focus_date: new Date().toISOString().split('T')[0],
      },
    });
    
    // Check prediction
    checkAndHandlePrediction(taskId, task.title);
    
    // Auto-split if complex
    generateAndCreateSubtasks(task);
    
    // Check for related tasks
    checkForRelatedTasks(task);
    
    toast({
      title: "Added to Focus",
      description: "Task moved to Today's Focus",
    });
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
  };

  const handleLongPress = (task: Task) => {
    setTaskToMove(task);
    setCategoryDrawerOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (taskId: string, updates: Partial<Task>) => {
    await updateTask({ id: taskId, updates });
    setEditDialogOpen(false);
    setTaskToEdit(null);
    toast({
      title: "Task updated",
      description: "Your changes have been saved",
    });
  };

  const handleMoveToCategory = (category: string) => {
    if (!taskToMove) return;
    
    updateTask({
      id: taskToMove.id,
      updates: { 
        category,
        custom_category_id: category.startsWith('custom-') ? category.replace('custom-', '') : null
      },
    });
    
    toast({
      title: "Task moved",
      description: `Moved to ${getCategoryLabel(category)}`,
    });
    
    setCategoryDrawerOpen(false);
    setTaskToMove(null);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat.startsWith("custom-")) {
      const categoryId = cat.replace('custom-', '');
      const customCategory = categories?.find(c => c.id === categoryId);
      return customCategory?.name || cat;
    }
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const handleApplySuggestion = async (suggestion: WorkloadSuggestion) => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let focusDate: string | null = null;
    
    if (suggestion.toBucket === 'today') {
      focusDate = today;
    } else if (suggestion.toBucket === 'thisWeek') {
      focusDate = weekFromNow;
    } else if (suggestion.toBucket === 'soon') {
      focusDate = null;
    }
    
    await updateTask({
      id: suggestion.taskId,
      updates: {
        focus_date: focusDate,
        is_focus: suggestion.toBucket === 'today',
      },
    });
    
    toast({
      title: "Task moved",
      description: `Moved "${suggestion.taskTitle}" to ${suggestion.toBucket === 'soon' ? 'Someday' : suggestion.toBucket}`,
    });
  };

  const allCategories = [
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'gym', label: 'Gym', icon: '💪' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    ...(categories || []).map(cat => ({
      id: `custom-${cat.id}`,
      label: cat.name,
      icon: cat.icon || '📌'
    }))
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        {/* Only show domain tabs and category manager when not in controlled mode */}
        {!externalCategory && (
          <div className="flex items-center justify-between gap-4">
            <DomainTabs 
              value={selectedDomain} 
              onChange={setSelectedDomain} 
              isDragging={!!activeId}
              customCategories={categories || []}
              onCreateCategory={handleCreateCategory}
            />
            <CategoryManager />
          </div>
        )}
        
        {/* Workload Balance Suggestions */}
        <WorkloadBalanceSuggestions 
          tasks={tasks}
          onApplySuggestion={handleApplySuggestion}
        />
        
        {/* Keyboard shortcuts hint */}
        {filteredTasks.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">1-5</kbd> to move selected task • 
            Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Q</kbd> to create task
          </div>
        )}
        
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No {selectedDomain} tasks yet.</p>
          </Card>
        ) : (
          <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div key={task.id} className="space-y-0">
                  <div className="flex items-center gap-2">
                    <TaskCard
                      id={task.id}
                      title={task.title}
                      context={task.context || undefined}
                      completed={task.completed || false}
                      selected={selectedTaskId === task.id}
                      onToggle={() => handleToggleComplete(task)}
                      onSelect={() => setSelectedTaskId(task.id)}
                      onLongPress={() => handleLongPress(task)}
                      onEdit={() => handleEditTask(task)}
                      goalAligned={task.goal_aligned}
                      alignmentReason={task.alignment_reason}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTask(task)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      title="Edit task & add location"
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddToFocus(task.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      title="Add to Today's Focus"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Show feedback component for voice-created tasks */}
                  {task.input_method === 'voice' && !task.completed && (
                    <TaskCategoryFeedback
                      taskId={task.id}
                      taskTitle={task.title}
                      currentCategory={task.category || 'inbox'}
                      originalText={task.title}
                    />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard
              id={activeTask.id}
              title={activeTask.title}
              context={activeTask.context || undefined}
              completed={activeTask.completed || false}
              goalAligned={activeTask.goal_aligned}
              alignmentReason={activeTask.alignment_reason}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Category Selector Drawer */}
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move task to...</DrawerTitle>
            <DrawerDescription>
              {taskToMove?.title}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-6 grid grid-cols-2 gap-3">
            {allCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={taskToMove?.category === cat.id ? "default" : "outline"}
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => handleMoveToCategory(cat.id)}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </Button>
            ))}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Task Dialog */}
      <TaskEditDialog
        open={editDialogOpen}
        task={taskToEdit}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setTaskToEdit(null);
        }}
      />
    </DndContext>
  );
};

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, User, Clock, Bell, Star, MapPin, ArrowRightFromLine } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { DomainTabs } from "@/components/DomainTabs";
import { CategoryManager } from "@/components/CategoryManager";
import { sortTasksByIntelligentPriority } from "@/lib/taskSorting";
import { QuickSendButton } from "@/components/QuickSendButton";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { TaskCategoryFeedback } from "@/components/TaskCategoryFeedback";
import { InboxSuggestionChip } from "@/components/InboxSuggestionChip";
import { TaskEditDialog } from "@/components/TaskEditDialog";
import { useToast } from "@/hooks/use-toast";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { useAutoSplitTask } from "@/hooks/useAutoSplitTask";
import { useRelatedTaskSuggestions } from "@/hooks/useRelatedTaskSuggestions";
import { usePlanTasks } from "@/hooks/usePlanTasks";
import { TaskPlanModal } from "@/components/TaskPlanModal";
import { SwipeableTaskRow } from "@/components/SwipeableTaskRow";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface TaskSuggestion {
  taskId: string;
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  reason?: string;
}

interface TaskListProps {
  category?: string;
  onPlanThis?: (title: string) => void;
  suggestions?: TaskSuggestion[];
  onApplySuggestion?: (taskId: string, destination: string) => void;
  onDismissSuggestion?: (taskId: string) => void;
}

export const TaskList = ({ 
  category: externalCategory, 
  onPlanThis, 
  suggestions = [], 
  onApplySuggestion,
  onDismissSuggestion 
}: TaskListProps = {}) => {
  const { tasks, isLoading, updateTask, deleteTask, createTasks } = useTasks();
  const { categories, createCategory } = useCustomCategories();
  const growth = useCompanionGrowth();
  const { generateAndCreateSubtasks } = useAutoSplitTask();
  const { checkForRelatedTasks } = useRelatedTaskSuggestions();
  const { generatePlan, createPlanTasks, isGenerating, isCreating } = usePlanTasks();
  const isMobile = useIsMobile();
  const [internalDomain, setInternalDomain] = useState("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [showCompleted, setShowCompleted] = useState(false);
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
    
    // Hide completed tasks unless showCompleted is true
    if (!showCompleted && task.completed) return false;
    
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
  
  // Count completed tasks in current view for toggle button
  const completedCount = tasks?.filter(task => {
    if (task.is_focus) return false;
    if (!task.completed) return false;
    
    if (selectedDomain === 'all') return true;
    
    const isCustomCategory = selectedDomain.startsWith('custom-');
    if (isCustomCategory) {
      const categoryId = selectedDomain.replace('custom-', '');
      return task.custom_category_id === categoryId;
    }
    
    return task.category === selectedDomain;
  }).length || 0;
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
        <div className="text-center py-12">
          <p className="text-muted-foreground/40 text-sm">No tasks yet</p>
        </div>
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

  const handleMoveToDestination = async (taskId: string, destination: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    let updates: any = {};
    
    if (destination === 'today') {
      updates = {
        is_focus: true,
        focus_date: today,
        scheduled_bucket: 'today',
        category: null,
      };
    } else if (destination === 'someday') {
      updates = {
        is_focus: false,
        focus_date: null,
        scheduled_bucket: 'someday',
        category: null,
      };
    } else {
      // Moving to a category (work, home, gym)
      updates = {
        category: destination,
        is_focus: false,
        focus_date: null,
      };
    }
    
    await updateTask({ id: taskId, updates });
    
    const destinationLabel = destination === 'today' ? 'Today' 
      : destination === 'someday' ? 'Someday'
      : destination.charAt(0).toUpperCase() + destination.slice(1);
    
    toast({
      title: "Moved to " + destinationLabel,
      description: "Task has been moved",
    });
  };

  const getCategoryLabel = (cat: string) => {
    if (cat.startsWith("custom-")) {
      const categoryId = cat.replace('custom-', '');
      const customCategory = categories?.find(c => c.id === categoryId);
      return customCategory?.name || cat;
    }
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleTurnIntoPlan = async () => {
    if (selectedTaskIds.size === 0) {
      toast({
        title: "No tasks selected",
        description: "Select at least one task to create a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      const plan = await generatePlan(Array.from(selectedTaskIds));
      setGeneratedPlan(plan);
      setPlanModalOpen(true);
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  };

  const handleConfirmPlan = async (planTitle: string, steps: any[]) => {
    try {
      await createPlanTasks({ planTitle, steps });
      setSelectedTaskIds(new Set());
      setPlanModalOpen(false);
      setGeneratedPlan(null);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleCreateSubtasks = async (subtasks: any[]) => {
    await createTasks(subtasks);
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
        
        {/* Multi-select actions */}
        {selectedTaskIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
            </span>
            <Button
              size="sm"
              onClick={handleTurnIntoPlan}
              disabled={isGenerating || isCreating}
              className="ml-auto"
            >
              🧩 Turn into a plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTaskIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground/40 text-sm">No tasks yet</p>
          </div>
        ) : (
          <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {/* Group tasks by plan */}
              {(() => {
                const planGroups = new Map<string, Task[]>();
                const regularTasks: Task[] = [];

                // Group tasks
                filteredTasks.forEach(task => {
                  if (task.plan_id) {
                    if (!planGroups.has(task.plan_id)) {
                      planGroups.set(task.plan_id, []);
                    }
                    planGroups.get(task.plan_id)!.push(task);
                  } else {
                    regularTasks.push(task);
                  }
                });

                // Apply intelligent sorting to regular tasks
                const sortedRegularTasks = sortTasksByIntelligentPriority(regularTasks);

                // Sort tasks within each plan group
                planGroups.forEach((planTasks, planId) => {
                  planGroups.set(planId, sortTasksByIntelligentPriority(planTasks));
                });

                return (
                  <>
                    {/* Render plan groups */}
                    {Array.from(planGroups.entries()).map(([planId, planTasks]) => {
                      const planTask = tasks?.find(t => t.id === planId);
                      if (!planTask) return null;

                       return (
                        <div key={planId} className="space-y-2">
                          <div className="flex items-center gap-2 px-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Quest: {planTask.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({planTasks.filter(t => t.completed).length}/{planTasks.length} done)
                            </span>
                          </div>
                       {planTasks.map((task) => {
                         const taskCard = (
                           <div className="flex items-center gap-2 group">
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
                                 priority={task.future_priority_score}
                                 cluster={task.cluster}
                                 fullTask={task}
                                 onTaskUpdate={(updates) => updateTask({ id: task.id, updates })}
                                 onCreateTasks={handleCreateSubtasks}
                                 onPlanThis={onPlanThis}
                               />
                              {selectedDomain === "inbox" ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="shrink-0 text-foreground/30 hover:text-foreground/50"
                                      title="Move to"
                                    >
                                      <ArrowRightFromLine className="w-5 h-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                   <DropdownMenuContent 
                                     align="end" 
                                     className="min-w-[140px] bg-background border border-foreground/10 shadow-md z-50"
                                   >
                                    <DropdownMenuItem
                                      onClick={() => handleMoveToDestination(task.id, 'today')}
                                      className="font-mono text-sm"
                                    >
                                      Today
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMoveToDestination(task.id, 'someday')}
                                      className="font-mono text-sm"
                                    >
                                      Someday
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleMoveToDestination(task.id, 'work')}
                                      className="font-mono text-sm"
                                    >
                                      Work
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMoveToDestination(task.id, 'home')}
                                      className="font-mono text-sm"
                                    >
                                      Home
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleMoveToDestination(task.id, 'gym')}
                                      className="font-mono text-sm"
                                    >
                                      Gym
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(task.id)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         );
                         
                         return (
                           <div key={task.id} className="space-y-0 pl-4 border-l-2 border-primary/20">
                             {isMobile ? (
                               <SwipeableTaskRow
                                 task={task}
                                 onComplete={() => handleToggleComplete(task)}
                                 onDelete={() => handleDelete(task.id)}
                                 onSchedule={() => handleMoveToDestination(task.id, 'today')}
                                 onStar={() => handleAddToFocus(task.id)}
                               >
                                 {taskCard}
                               </SwipeableTaskRow>
                             ) : (
                               taskCard
                             )}
                           </div>
                         );
                       })}
                        </div>
                      );
                     })}

                     {/* Render regular tasks */}
                     {sortedRegularTasks.map((task) => {
                       const taskCard = (
                         <div className="flex items-center gap-2 group">
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
                               priority={task.future_priority_score}
                               cluster={task.cluster}
                               fullTask={task}
                               onTaskUpdate={(updates) => updateTask({ id: task.id, updates })}
                               onCreateTasks={handleCreateSubtasks}
                               onPlanThis={onPlanThis}
                             />
                            {selectedDomain === "inbox" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-foreground/30 hover:text-foreground/50"
                                    title="Move to"
                                  >
                                    <ArrowRightFromLine className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                 <DropdownMenuContent 
                                   align="end" 
                                   className="min-w-[140px] bg-background border border-foreground/10 shadow-md z-50"
                                 >
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToDestination(task.id, 'today')}
                                    className="font-mono text-sm"
                                  >
                                    Today
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToDestination(task.id, 'someday')}
                                    className="font-mono text-sm"
                                  >
                                    Someday
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToDestination(task.id, 'work')}
                                    className="font-mono text-sm"
                                  >
                                    Work
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToDestination(task.id, 'home')}
                                    className="font-mono text-sm"
                                  >
                                    Home
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMoveToDestination(task.id, 'gym')}
                                    className="font-mono text-sm"
                                  >
                                    Gym
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTask(task)}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                title="Edit task & add location"
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                            )}
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
                       );
                       
                       return (
                         <div key={task.id} className="space-y-0">
                           {isMobile ? (
                             <SwipeableTaskRow
                               task={task}
                               onComplete={() => handleToggleComplete(task)}
                               onDelete={() => handleDelete(task.id)}
                               onSchedule={() => handleMoveToDestination(task.id, 'today')}
                               onStar={() => handleAddToFocus(task.id)}
                             >
                               {taskCard}
                             </SwipeableTaskRow>
                           ) : (
                             taskCard
                           )}
                           
                           {/* Show AI suggestion chip for inbox tasks */}
                           {selectedDomain === 'inbox' && onApplySuggestion && onDismissSuggestion && (() => {
                             const taskSuggestion = suggestions.find(s => s.taskId === task.id);
                             return taskSuggestion ? (
                               <InboxSuggestionChip
                                 suggestion={taskSuggestion.suggestion}
                                 confidence={taskSuggestion.confidence}
                                 onApply={() => onApplySuggestion(task.id, taskSuggestion.suggestion)}
                                 onDismiss={() => onDismissSuggestion(task.id)}
                               />
                             ) : null;
                           })()}
                           
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
                       );
                     })}
                   </>
                 );
               })()}
             </div>
           </SortableContext>
         )}
         
         {/* Show completed toggle */}
         {completedCount > 0 && (
           <button
             onClick={() => setShowCompleted(!showCompleted)}
             className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors w-full text-center py-2"
           >
             {showCompleted ? `Hide completed (${completedCount})` : `Show completed (${completedCount})`}
           </button>
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
              priority={activeTask.future_priority_score}
              cluster={activeTask.cluster}
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

      {/* Plan Tasks Modal */}
      <TaskPlanModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        plan={generatedPlan}
        isLoading={isGenerating}
        onConfirm={handleConfirmPlan}
      />

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

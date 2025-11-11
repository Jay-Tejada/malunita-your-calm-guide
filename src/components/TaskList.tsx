import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, User, Clock, Bell, Star } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { DomainTabs } from "@/components/DomainTabs";
import { CategoryManager } from "@/components/CategoryManager";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";

export const TaskList = () => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const { categories } = useCustomCategories();
  const [selectedDomain, setSelectedDomain] = useState("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

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
        />
        <Card className="p-8 text-center text-muted-foreground mt-4">
          <p>No tasks yet. Start by speaking into Malunita.</p>
        </Card>
      </DndContext>
    );
  }

  const handleToggleComplete = (task: Task) => {
    updateTask({
      id: task.id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleAddToFocus = (taskId: string) => {
    updateTask({
      id: taskId,
      updates: {
        is_focus: true,
        focus_date: new Date().toISOString().split('T')[0],
      },
    });
    toast({
      title: "Added to Focus",
      description: "Task moved to Today's Focus",
    });
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <DomainTabs 
            value={selectedDomain} 
            onChange={setSelectedDomain} 
            isDragging={!!activeId}
            customCategories={categories || []}
          />
          <CategoryManager />
        </div>
        
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
                <div key={task.id} className="flex items-center gap-2">
                  <TaskCard
                    id={task.id}
                    title={task.title}
                    context={task.context || undefined}
                    completed={task.completed || false}
                    selected={selectedTaskId === task.id}
                    onToggle={() => handleToggleComplete(task)}
                    onSelect={() => setSelectedTaskId(task.id)}
                    goalAligned={task.goal_aligned}
                    alignmentReason={task.alignment_reason}
                  />
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
    </DndContext>
  );
};

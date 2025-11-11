import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, User, Clock, Bell } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { DomainTabs } from "@/components/DomainTabs";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";
import { useToast } from "@/hooks/use-toast";

export const TaskList = () => {
  const { tasks, isLoading, updateTask, deleteTask } = useTasks();
  const [selectedDomain, setSelectedDomain] = useState("inbox");
  const [activeId, setActiveId] = useState<string | null>(null);
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Filter tasks by selected domain
  const filteredTasks = tasks?.filter(task => task.category === selectedDomain) || [];
  const activeTask = activeId ? tasks?.find((t) => t.id === activeId) : null;

  if (!tasks || tasks.length === 0) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <DomainTabs value={selectedDomain} onChange={setSelectedDomain} />
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
        <DomainTabs value={selectedDomain} onChange={setSelectedDomain} isDragging={!!activeId} />
        
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
                    onToggle={() => handleToggleComplete(task)}
                  />
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
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

import { useState } from "react";
import { DailyIntelligence } from "@/components/DailyIntelligence";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Edit2, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast";

export function TodayView() {
  const { tasks, updateTask, createTasks } = useTasks();
  const { toast } = useToast();
  const [taskInput, setTaskInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter today's tasks
  const todayTasks = (tasks || [])
    .filter(t => !t.completed)
    .sort((a, b) => {
      const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // Filter by active category filter
  const filteredTasks = activeFilter === "all" 
    ? todayTasks 
    : todayTasks.filter(t => t.category === activeFilter);

  // Group tasks
  const topPriorities = filteredTasks.filter(t => t.is_focus);
  const followUps = filteredTasks.filter(t => !t.is_focus && t.has_reminder);
  const everythingElse = filteredTasks.filter(t => !t.is_focus && !t.has_reminder);

  const completedToday = (tasks || []).filter(t => 
    t.completed && 
    t.completed_at && 
    new Date(t.completed_at).toDateString() === new Date().toDateString()
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
    const newIndex = filteredTasks.findIndex((t) => t.id === over.id);

    if (oldIndex !== newIndex) {
      const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      reorderedTasks.forEach((task, index) => {
        updateTask({
          id: task.id,
          updates: { display_order: index },
        });
      });
    }
  };

  const handleTaskComplete = (id: string) => {
    const task = tasks?.find(t => t.id === id);
    if (!task) return;

    updateTask({
      id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleAddTask = async () => {
    if (!taskInput.trim()) return;

    await createTasks([{ 
      title: taskInput.trim(),
      category: activeFilter === "all" ? "inbox" : activeFilter,
      input_method: "text"
    }]);

    setTaskInput("");
    toast({
      title: "Task added",
      description: taskInput.trim(),
    });
  };

  const activeTask = activeId ? filteredTasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Daily Intelligence - Suggestions Panel */}
        <DailyIntelligence 
          topPriorities={topPriorities.slice(0, 3)}
          followUps={followUps}
          quickWins={everythingElse.slice(0, 3)}
        />

        {/* Today's Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium font-mono">Today's Tasks</h2>
            <span className="text-sm text-muted-foreground">
              {filteredTasks.length} active
            </span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'work', 'home', 'gym'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-all",
                  activeFilter === cat 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "border-border hover:bg-muted hover:border-input"
                )}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Task Groups */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No tasks for today</p>
              <p className="text-xs mt-1">Add a task below to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Priority */}
              {topPriorities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Top Priority
                  </h3>
                  <SortableContext items={topPriorities.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {topPriorities.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <TaskCard
                            id={task.id}
                            title={task.title}
                            context={task.context || undefined}
                            completed={task.completed || false}
                            selected={selectedTaskId === task.id}
                            onToggle={() => handleTaskComplete(task.id)}
                            onSelect={() => setSelectedTaskId(task.id)}
                            goalAligned={task.goal_aligned}
                            alignmentReason={task.alignment_reason}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Follow Ups */}
              {followUps.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Follow Ups
                  </h3>
                  <SortableContext items={followUps.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {followUps.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <TaskCard
                            id={task.id}
                            title={task.title}
                            context={task.context || undefined}
                            completed={task.completed || false}
                            selected={selectedTaskId === task.id}
                            onToggle={() => handleTaskComplete(task.id)}
                            onSelect={() => setSelectedTaskId(task.id)}
                            goalAligned={task.goal_aligned}
                            alignmentReason={task.alignment_reason}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Everything Else */}
              {everythingElse.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Everything Else
                  </h3>
                  <SortableContext items={everythingElse.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {everythingElse.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <TaskCard
                            id={task.id}
                            title={task.title}
                            context={task.context || undefined}
                            completed={task.completed || false}
                            selected={selectedTaskId === task.id}
                            onToggle={() => handleTaskComplete(task.id)}
                            onSelect={() => setSelectedTaskId(task.id)}
                            goalAligned={task.goal_aligned}
                            alignmentReason={task.alignment_reason}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}
            </div>
          )}

          {/* Completed Today (Collapsible) */}
          {completedToday.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-2">
                <Check className="w-3 h-3" />
                <span>Completed Today ({completedToday.length})</span>
              </summary>
              <div className="space-y-1 mt-2 pl-5">
                {completedToday.map((task) => (
                  <div key={task.id} className="text-sm text-muted-foreground line-through">
                    {task.title}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Task Input */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border pt-4 -mx-6 px-6">
            <div className="bg-card border border-input rounded-[10px] px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all focus-within:border-primary focus-within:shadow-md">
              <span className="text-muted-foreground text-lg">+</span>
              <input 
                type="text" 
                placeholder="Type a task or talk to Malunita…"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask();
                  }
                }}
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleAddTask}
                disabled={!taskInput.trim()}
                className="shrink-0"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="cursor-grabbing opacity-80">
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
}

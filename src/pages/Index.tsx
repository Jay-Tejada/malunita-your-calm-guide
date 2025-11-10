import { useState } from "react";
import { Header } from "@/components/Header";
import { DomainTabs } from "@/components/DomainTabs";
import { TaskCard } from "@/components/TaskCard";
import { VoiceOrb } from "@/components/VoiceOrb";
import { Inbox } from "@/components/Inbox";
import { TaskSuggestions } from "@/components/TaskSuggestions";
import { TaskEditDialog } from "@/components/TaskEditDialog";
import { Button } from "@/components/ui/button";
import { Inbox as InboxIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Task {
  id: string;
  title: string;
  time?: string;
  context: string;
  completed: boolean;
}

// Sample data - will be replaced with real data from backend
const sampleTasks = {
  personal: [
    { id: "1", title: "Review EMR pricing document", time: "10:00 AM", context: "PCMH Pro Tech", completed: false },
    { id: "2", title: "Call Luis about studio session", time: "2:00 PM", context: "Music", completed: false },
    { id: "3", title: "Finish proposal draft for new client", time: "4:00 PM", context: "1844 Tech", completed: false },
  ],
  health: [
    { id: "4", title: "Morning workout - Upper body", time: "7:00 AM", context: "Fitness", completed: true },
    { id: "5", title: "Meal prep for tomorrow", time: "6:00 PM", context: "Nutrition", completed: false },
  ],
  enterprises: [
    { id: "6", title: "Update client pricing doc", time: "11:00 AM", context: "PCMH Pro Tech", completed: false },
    { id: "7", title: "Check music distribution status", time: "3:00 PM", context: "1844 Tech", completed: false },
  ],
};

const Index = () => {
  const [selectedDomain, setSelectedDomain] = useState("personal");
  const [tasks, setTasks] = useState(sampleTasks);
  const [showInbox, setShowInbox] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) => ({
      ...prev,
      [selectedDomain]: prev[selectedDomain as keyof typeof prev].map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const handleMoveToToday = (text: string) => {
    const newTask = {
      id: Date.now().toString(),
      title: text,
      time: "TBD",
      context: "Inbox",
      completed: false,
    };
    
    setTasks((prev) => ({
      ...prev,
      [selectedDomain]: [...prev[selectedDomain as keyof typeof prev], newTask],
    }));
  };

  const handleVoiceInput = (text: string, category?: 'personal' | 'health' | 'enterprises') => {
    const newTask = {
      id: Date.now().toString(),
      title: text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      context: "Voice",
      completed: false,
    };
    
    // Use AI-suggested category or current domain
    const targetDomain = category || selectedDomain;
    
    setTasks((prev) => ({
      ...prev,
      [targetDomain]: [...prev[targetDomain as keyof typeof prev], newTask],
    }));
  };

  const handleAddSuggestedTask = (title: string, context: string, category: string) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      context,
      completed: false,
    };
    
    setTasks((prev) => ({
      ...prev,
      [category]: [...prev[category as keyof typeof prev], newTask],
    }));
  };

  const handleEditTask = (taskId: string) => {
    const task = currentTasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setEditDialogOpen(true);
    }
  };

  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => ({
      ...prev,
      [selectedDomain]: prev[selectedDomain as keyof typeof prev].map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setTasks((prev) => {
      const domainTasks = prev[selectedDomain as keyof typeof prev];
      const oldIndex = domainTasks.findIndex((task) => task.id === active.id);
      const newIndex = domainTasks.findIndex((task) => task.id === over.id);

      const reorderedTasks = arrayMove(domainTasks, oldIndex, newIndex);

      return {
        ...prev,
        [selectedDomain]: reorderedTasks,
      };
    });
  };

  const currentTasks = tasks[selectedDomain as keyof typeof tasks] || [];
  const completedCount = currentTasks.filter((t) => t.completed).length;
  const totalCount = currentTasks.length;

  return (
    <div className="min-h-screen bg-background pb-32">
      <TaskEditDialog
        open={editDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        onClose={handleCloseEditDialog}
      />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Header />

        {/* Inbox Toggle */}
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => setShowInbox(!showInbox)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <InboxIcon className="h-4 w-4" />
            {showInbox ? "Close Inbox" : "Open Inbox"}
          </Button>
        </div>

        {/* Inbox Section */}
        {showInbox && (
          <div className="mb-8 p-6 bg-accent/10 rounded-2xl border border-accent">
            <h2 className="text-lg font-normal text-foreground mb-4">Inbox</h2>
            <Inbox onMoveToToday={handleMoveToToday} />
          </div>
        )}

        {/* Domain Tabs */}
        <div className="mb-8">
          <DomainTabs value={selectedDomain} onChange={setSelectedDomain} />
        </div>

        {/* AI Task Suggestions */}
        <TaskSuggestions
          tasks={currentTasks}
          domain={selectedDomain}
          onAddTask={handleAddSuggestedTask}
        />

        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-card rounded-2xl border border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-normal text-foreground mb-1">Today's Focus</h2>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {totalCount} completed
              </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-secondary flex items-center justify-center">
              <span className="text-lg font-light text-foreground">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {currentTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks for today. Speak or type to add one.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    time={task.time}
                    context={task.context}
                    completed={task.completed}
                    onToggle={() => handleToggleTask(task.id)}
                    onEdit={() => handleEditTask(task.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* AI Insight Card */}
        {currentTasks.length > 0 && (
          <div className="mt-8 p-6 bg-accent/20 rounded-2xl border border-accent">
            <p className="text-sm text-foreground/80 italic">
              💡 You've been focusing on PCMH Pro Tech this week. Consider scheduling time for creative work tomorrow.
            </p>
          </div>
        )}
      </div>

      {/* Voice Orb - Always visible */}
      <VoiceOrb onVoiceInput={handleVoiceInput} />
    </div>
  );
};

export default Index;

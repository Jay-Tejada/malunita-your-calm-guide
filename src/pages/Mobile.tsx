import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { BottomNav } from "@/components/mobile/BottomNav";
import { VoiceCaptureModal } from "@/components/mobile/VoiceCaptureModal";
import { TaskSwipeCard } from "@/components/mobile/TaskSwipeCard";
import { TaskDetailsModal } from "@/components/mobile/TaskDetailsModal";
import { ProfileSettings } from "@/components/ProfileSettings";
import { useTasks, Task } from "@/hooks/useTasks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const Mobile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showCapture, setShowCapture] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [category, setCategory] = useState('inbox');
  
  const { tasks, updateTask, deleteTask } = useTasks();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      // Settings handled separately
    } else if (tab === 'projects') {
      setCategory('projects');
    } else if (tab === 'inbox') {
      setCategory('inbox');
    }
  };

  const filteredTasks = tasks?.filter(task => {
    if (activeTab === 'review') {
      return !task.category || task.category === 'inbox';
    }
    if (activeTab === 'projects') {
      return task.category === 'projects';
    }
    return task.category === category;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-background">
        <ProfileSettings onClose={() => setActiveTab('inbox')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Home View */}
      {activeTab === 'inbox' && !tasks?.length ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <h1 className="text-2xl font-light text-foreground text-center mb-8 animate-fade-in">
            What's on your mind?
          </h1>
          <div 
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse cursor-pointer transition-all hover:scale-110"
            onClick={() => setShowCapture(true)}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-6 px-4">
          <h2 className="text-xl font-light text-foreground mb-4">
            {activeTab === 'inbox' && 'Inbox'}
            {activeTab === 'projects' && 'Projects'}
            {activeTab === 'review' && 'Review'}
          </h2>

          {/* Category Tabs */}
          {(activeTab === 'inbox' || activeTab === 'projects') && (
            <Tabs value={category} onValueChange={setCategory} className="mb-4">
              <TabsList className="w-full justify-start bg-muted/30 rounded-2xl p-1">
                <TabsTrigger value="inbox" className="rounded-xl">Inbox</TabsTrigger>
                <TabsTrigger value="home" className="rounded-xl">Home</TabsTrigger>
                <TabsTrigger value="work" className="rounded-xl">Work</TabsTrigger>
                <TabsTrigger value="gym" className="rounded-xl">Gym</TabsTrigger>
                <TabsTrigger value="projects" className="rounded-xl">Projects</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Task List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>No tasks yet</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskSwipeCard
                    key={task.id}
                    task={task}
                    onToggle={() => updateTask({
                      id: task.id,
                      updates: {
                        completed: !task.completed,
                        completed_at: !task.completed ? new Date().toISOString() : null,
                      },
                    })}
                    onExpand={() => setSelectedTask(task)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCaptureClick={() => setShowCapture(true)}
      />

      {/* Voice Capture Modal */}
      <VoiceCaptureModal
        open={showCapture}
        onClose={() => setShowCapture(false)}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={(updates) => {
          if (selectedTask) {
            updateTask({ id: selectedTask.id, updates });
          }
        }}
        onDelete={() => {
          if (selectedTask) {
            deleteTask(selectedTask.id);
            setSelectedTask(null);
          }
        }}
      />
    </div>
  );
};

export default Mobile;

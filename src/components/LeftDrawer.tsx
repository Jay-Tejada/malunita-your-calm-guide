import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo, ChevronLeft, Circle, Check } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { hapticLight, hapticMedium, hapticSuccess, hapticSwipe } from "@/utils/haptics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { format } from "date-fns";

type DrawerMode = "root" | "inbox" | "projects" | "work" | "home" | "gym" | "calendar";

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const categories = [
  { id: "inbox", label: "Inbox", filter: (task: any) => !task.category || task.category === "inbox" },
  { id: "projects", label: "Projects", filter: (task: any) => task.category === "project" },
  { id: "work", label: "Work", filter: (task: any) => task.category === "work" },
  { id: "home", label: "Home", filter: (task: any) => task.category === "home" },
  { id: "gym", label: "Gym", filter: (task: any) => task.category === "gym" },
  { id: "calendar", label: "Calendar", filter: (task: any) => task.reminder_time !== null },
];

export const LeftDrawer = ({ isOpen, onClose, onNavigate }: LeftDrawerProps) => {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("root");
  const { tasks, updateTask, createTasks } = useTasks();
  const { toast } = useToast();
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(0);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const handleCategoryClick = (categoryId: DrawerMode) => {
    hapticLight();
    setDrawerMode(categoryId);
  };

  const handleBack = () => {
    hapticLight();
    setDrawerMode("root");
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      // If completing, add to animating set and show undo toast
      if (!completed) {
        setCompletingTaskIds(prev => new Set(prev).add(taskId));
        hapticSuccess();
        
        let undoClicked = false;
        const task = tasks?.find(t => t.id === taskId);
        
        // Show toast with undo option
        toast({
          title: "Task completed",
          description: task?.title,
          action: (
            <ToastAction
              altText="Undo completion"
              onClick={() => {
                undoClicked = true;
                setCompletingTaskIds(prev => {
                  const next = new Set(prev);
                  next.delete(taskId);
                  return next;
                });
                hapticLight();
              }}
            >
              Undo
            </ToastAction>
          ),
          duration: 4000,
        });
        
        // Wait for animation before actually updating
        setTimeout(async () => {
          if (!undoClicked) {
            await updateTask({
              id: taskId,
              updates: {
                completed: true,
                completed_at: new Date().toISOString(),
              }
            });
          }
          setCompletingTaskIds(prev => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }, 400); // Match animation duration
      } else {
        hapticLight();
        await updateTask({
          id: taskId,
          updates: {
            completed: false,
            completed_at: null,
          }
        });
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
      setCompletingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate || !newEventTime) {
      toast({
        title: "Missing information",
        description: "Please fill in the title, date, and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reminderDateTime = new Date(`${newEventDate}T${newEventTime}`);
      
      await createTasks([{
        title: newEventTitle,
        reminder_time: reminderDateTime.toISOString(),
        context: newEventDescription || undefined,
        has_reminder: true,
        recurrence_pattern: recurrencePattern,
        recurrence_day: recurrencePattern === 'weekly' ? recurrenceDay : undefined,
        recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
      }]);

      hapticSuccess();
      toast({
        title: "Event created",
        description: recurrencePattern !== 'none' 
          ? "Your recurring event has been added."
          : "Your calendar event has been added.",
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventDescription("");
      setRecurrencePattern('none');
      setRecurrenceDay(0);
      setRecurrenceEndDate("");
      setIsNewEventDialogOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter tasks for current category
  const getCurrentCategoryTasks = () => {
    if (drawerMode === "root") return [];
    const category = categories.find(c => c.id === drawerMode);
    if (!category) return [];
    return tasks?.filter(t => !t.completed && category.filter(t)) || [];
  };

  const categoryTasks = getCurrentCategoryTasks();
  const currentCategory = categories.find(c => c.id === drawerMode);

  // Swipe handlers
  const drawerSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isOpen) {
        hapticSwipe();
        onClose();
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  const categorySwipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (drawerMode !== "root") {
        hapticSwipe();
        handleBack();
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[14px] z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              {...drawerSwipeHandlers}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50",
                "w-full md:w-[380px]",
                "overflow-y-auto",
                "bg-background shadow-lg"
              )}
            >
              <AnimatePresence mode="wait">
                {drawerMode === "root" ? (
                  <motion.div
                    key="root"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.14 }}
                    className="h-full flex flex-col p-6 md:p-8 pt-16"
                  >
                    {/* Prompt Card */}
                    <div className="w-full rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 flex items-center gap-3 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                      <p className="font-mono text-[15px] text-foreground/90">
                        What matters most today?
                      </p>
                    </div>

                    {/* Add New Task Button */}
                    <button
                      onClick={() => {
                        hapticMedium();
                        onNavigate("/");
                        onClose();
                      }}
                      className="w-full h-14 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-white font-mono text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 mb-5"
                    >
                      <Plus className="w-4 h-4" />
                      Add new task
                    </button>

                    {/* View All Tasks Button */}
                    <button
                      onClick={() => {
                        hapticMedium();
                        onNavigate("/");
                        onClose();
                      }}
                      className="w-full h-14 rounded-full bg-transparent border border-border hover:border-foreground/30 hover:bg-muted/20 text-foreground font-mono text-[15px] flex items-center justify-center gap-2 transition-all mb-8"
                    >
                      <ListTodo className="w-4 h-4" />
                      View All Tasks
                    </button>

                    {/* Category Links */}
                    <div className="flex flex-col gap-1">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id as DrawerMode)}
                          className="text-left py-2 px-3 font-mono text-[14px] text-foreground/60 hover:text-foreground/90 hover:bg-muted/30 rounded-md transition-colors"
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1" />
                  </motion.div>
                ) : (
                  <motion.div
                    {...categorySwipeHandlers}
                    key={drawerMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.14 }}
                    className="h-full flex flex-col p-6 md:p-8 pt-16"
                  >
                    {/* Back Button */}
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 mb-6 text-foreground/70 hover:text-foreground font-mono text-[14px] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>

                    {/* Category Title */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-mono text-[18px] font-medium text-foreground">
                        {currentCategory?.label}
                      </h2>
                      {drawerMode === 'calendar' && (
                        <button
                          onClick={() => {
                            hapticLight();
                            setIsNewEventDialogOpen(true);
                          }}
                          className="p-1.5 hover:bg-muted/30 rounded-md transition-colors"
                          aria-label="Add new event"
                        >
                          <Plus className="w-4 h-4 text-foreground/60" />
                        </button>
                      )}
                    </div>

                    {/* Task List */}
                    <div className="flex-1 space-y-2">
                      {categoryTasks.length === 0 ? (
                        <p className="font-mono text-[14px] text-foreground/40 text-center py-8">
                          No tasks in {currentCategory?.label}
                        </p>
                      ) : drawerMode === 'calendar' ? (
                        categoryTasks.map((task) => {
                          const eventDate = task.reminder_time ? new Date(task.reminder_time) : new Date();
                          const today = new Date();
                          const nextWeekEnd = new Date(today);
                          nextWeekEnd.setDate(today.getDate() + 14);
                          
                          const isUpcoming = eventDate <= nextWeekEnd;
                          const dateDisplay = isUpcoming 
                            ? format(eventDate, 'EEEE')
                            : format(eventDate, 'M/d');
                          
                          const isCompleting = completingTaskIds.has(task.id);
                          
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCompleting ? { 
                                opacity: 0, 
                                x: -20,
                                height: 0,
                                marginBottom: 0
                              } : { 
                                opacity: 1, 
                                x: 0 
                              }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="flex items-start gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group overflow-hidden"
                            >
                              <button
                                onClick={() => handleTaskToggle(task.id, task.completed || false)}
                                className={cn(
                                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300 ease-out",
                                  task.completed
                                    ? "bg-foreground/90 border-2 border-foreground/90 scale-100 shadow-[0_0_12px_rgba(0,0,0,0.3)]"
                                    : "border-2 border-foreground/20 hover:border-foreground/40 hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.15)]"
                                )}
                              >
                                {task.completed ? (
                                  <Check className="w-3 h-3 text-background animate-in fade-in zoom-in duration-200" />
                                ) : (
                                  <Circle className="w-2 h-2 text-foreground/20 transition-all duration-200" />
                                )}
                              </button>
                              <div className={cn(
                                "flex-1 font-mono text-[13px] leading-snug",
                                task.completed && "opacity-60"
                              )}>
                                <div className={cn(
                                  task.completed && "line-through"
                                )}>
                                  • {task.title}
                                </div>
                                <div className="text-foreground/50 mt-0.5">
                                  {dateDisplay} at {format(eventDate, 'h:mm a')}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        categoryTasks.map((task) => {
                          const isCompleting = completingTaskIds.has(task.id);
                          
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 1, x: 0 }}
                              animate={isCompleting ? { 
                                opacity: 0, 
                                x: -20,
                                height: 0,
                                marginBottom: 0
                              } : { 
                                opacity: 1, 
                                x: 0 
                              }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="flex items-start gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group overflow-hidden"
                            >
                              <button
                                onClick={() => handleTaskToggle(task.id, task.completed || false)}
                                className={cn(
                                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-300 ease-out",
                                  task.completed
                                    ? "bg-foreground/90 border-2 border-foreground/90 scale-100 shadow-[0_0_12px_rgba(0,0,0,0.3)]"
                                    : "border-2 border-foreground/20 hover:border-foreground/40 hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.15)]"
                                )}
                              >
                                {task.completed ? (
                                  <Check className="w-3 h-3 text-background animate-in fade-in zoom-in duration-200" />
                                ) : (
                                  <Circle className="w-2 h-2 text-foreground/20 transition-all duration-200" />
                                )}
                              </button>
                              <span className={cn(
                                "flex-1 font-mono text-[14px] leading-snug",
                                task.completed ? "text-foreground/40 line-through" : "text-foreground/90"
                              )}>
                                {task.title}
                              </span>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Event Dialog */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="drawer-title">Event Title</Label>
              <Input
                id="drawer-title"
                placeholder="Meeting, Appointment, etc."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-date">Date</Label>
                <Input
                  id="drawer-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drawer-time">Time</Label>
                <Input
                  id="drawer-time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-description">Description (optional)</Label>
              <Textarea
                id="drawer-description"
                placeholder="Add notes or location..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-recurrence">Repeat</Label>
              <Select value={recurrencePattern} onValueChange={(value: any) => setRecurrencePattern(value)}>
                <SelectTrigger id="drawer-recurrence">
                  <SelectValue placeholder="Does not repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrencePattern === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="drawer-recurrence-day">Day of Week</Label>
                <Select value={recurrenceDay.toString()} onValueChange={(value) => setRecurrenceDay(parseInt(value))}>
                  <SelectTrigger id="drawer-recurrence-day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {recurrencePattern !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="drawer-recurrence-end">End Date (optional)</Label>
                <Input
                  id="drawer-recurrence-end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  hapticLight();
                  setIsNewEventDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateEvent}
              >
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

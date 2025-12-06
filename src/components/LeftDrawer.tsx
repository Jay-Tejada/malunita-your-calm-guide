import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, Circle, Check, Search as SearchIcon, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { hapticLight, hapticMedium, hapticSuccess, hapticSwipe } from "@/utils/haptics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { EventTitleAutocomplete } from "@/components/EventTitleAutocomplete";
import { useRecentEventTitles } from "@/hooks/useRecentEventTitles";
import { MapboxLocationPicker } from "@/components/MapboxLocationPicker";
import { MapFullScreen } from "@/components/MapFullScreen";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { MapPin } from "lucide-react";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { useQuickCapture } from "@/contexts/QuickCaptureContext";
type DrawerMode = "root" | "calendar";

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSearchOpen?: () => void;
}

const coreCategories = [
  { id: "today", label: "Today", route: "/today" },
  { id: "inbox", label: "Inbox", route: "/inbox" },
  { id: "habits", label: "Habits", route: "/habits" },
  { id: "thoughts", label: "Thoughts", route: "/thoughts" },
  { id: "someday", label: "Someday", route: "/someday" },
  { id: "calendar", label: "Calendar", route: "/calendar" },
];

const spaceCategories = [
  { id: "work", label: "Work", route: "/work" },
  { id: "home", label: "Home", route: "/home-tasks" },
  { id: "gym", label: "Gym", route: "/gym" },
  { id: "journal", label: "Journal", route: "/journal" },
];

const insightCategories = [
  { id: "weekly-review", label: "Weekly Review", route: "/weekly-review" },
  { id: "weekly-insights", label: "Weekly Insights", route: "/weekly-insights" },
];

const calendarCategory = { id: "calendar", label: "Calendar", filter: (task: any) => task.reminder_time !== null };

export const LeftDrawer = ({ isOpen, onClose, onNavigate, onSearchOpen }: LeftDrawerProps) => {
  const navigate = useNavigate();
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("root");
  const { tasks, updateTask, createTasks, deleteTask } = useTasks();
  const { data: projectTasks } = useProjectTasks();
  const { toast } = useToast();
  const { recordEventTitle } = useRecentEventTitles();
  const { token: mapboxToken } = useMapboxToken();
  const { openQuickCapture } = useQuickCapture();
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventLocationLat, setNewEventLocationLat] = useState<number | undefined>();
  const [newEventLocationLng, setNewEventLocationLng] = useState<number | undefined>();
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(0);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isMapFullScreenOpen, setIsMapFullScreenOpen] = useState(false);

  const handleCategoryClick = (categoryId: string, route?: string) => {
    hapticLight();
    if (categoryId === "calendar") {
      // Calendar stays inline in drawer
      setDrawerMode("calendar");
    } else if (route) {
      // Close drawer first, then navigate after a frame to avoid race condition
      onClose();
      requestAnimationFrame(() => {
        navigate(route);
      });
    }
  };

  const handleBack = () => {
    hapticLight();
    setDrawerMode("root");
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      // Add animation for non-calendar categories
      if (!completed && drawerMode !== 'calendar') {
        setCompletingTaskIds(prev => new Set(prev).add(taskId));
        hapticSuccess();
        
        setTimeout(async () => {
          await updateTask({
            id: taskId,
            updates: {
              completed: true,
              completed_at: new Date().toISOString(),
            }
          });
          setCompletingTaskIds(prev => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }, 400);
      } else {
        hapticSuccess();
        await updateTask({
          id: taskId,
          updates: {
            completed: !completed,
            completed_at: !completed ? new Date().toISOString() : null,
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

  const handleEventClick = (task: any) => {
    hapticLight();
    setSelectedEvent(task);
    setIsEventDetailsOpen(true);
  };

  const handleCompleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      hapticSuccess();
      await updateTask({
        id: selectedEvent.id,
        updates: {
          completed: true,
          completed_at: new Date().toISOString(),
        }
      });
      setIsEventDetailsOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event completed",
        description: selectedEvent.title,
      });
    } catch (error) {
      console.error("Failed to complete event:", error);
      toast({
        title: "Error",
        description: "Failed to complete event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      hapticMedium();
      await deleteTask(selectedEvent.id);
      setIsEventDetailsOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Event deleted",
        description: selectedEvent.title,
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleRescheduleEvent = () => {
    if (!selectedEvent) return;
    
    const eventDateTime = new Date(selectedEvent.reminder_time!);
    setNewEventTitle(selectedEvent.title);
    setNewEventDate(format(eventDateTime, 'yyyy-MM-dd'));
    setNewEventTime(format(eventDateTime, 'HH:mm'));
    setNewEventDescription(selectedEvent.context || "");
    setNewEventLocation(selectedEvent.location_address || "");
    setNewEventLocationLat(selectedEvent.location_lat);
    setNewEventLocationLng(selectedEvent.location_lng);
    setRecurrencePattern(selectedEvent.recurrence_pattern || 'none');
    setRecurrenceDay(selectedEvent.recurrence_day || 0);
    setRecurrenceEndDate(selectedEvent.recurrence_end_date ? format(new Date(selectedEvent.recurrence_end_date), 'yyyy-MM-dd') : "");
    
    setIsEventDetailsOpen(false);
    setIsNewEventDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
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
      
      await updateTask({
        id: selectedEvent.id,
        updates: {
          title: newEventTitle,
          reminder_time: reminderDateTime.toISOString(),
          context: newEventDescription || undefined,
          location_address: newEventLocation || undefined,
          location_lat: newEventLocationLat,
          location_lng: newEventLocationLng,
          has_reminder: true,
          recurrence_pattern: recurrencePattern,
          recurrence_day: recurrencePattern === 'weekly' ? recurrenceDay : undefined,
          recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
        } as any
      });

      // Record event title for autocomplete
      await recordEventTitle(newEventTitle);

      hapticSuccess();
      toast({
        title: "Event updated",
        description: recurrencePattern !== 'none' 
          ? "Your recurring event has been updated."
          : "Your calendar event has been updated.",
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventDescription("");
      setNewEventLocation("");
      setNewEventLocationLat(undefined);
      setNewEventLocationLng(undefined);
      setRecurrencePattern('none');
      setRecurrenceDay(0);
      setRecurrenceEndDate("");
      setSelectedEvent(null);
      setIsNewEventDialogOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
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
      
      if (selectedEvent) {
        // Update existing event
        await handleUpdateEvent();
      } else {
        // Create new event
        await createTasks([{
          title: newEventTitle,
          reminder_time: reminderDateTime.toISOString(),
          context: newEventDescription || undefined,
          location_address: newEventLocation || undefined,
          location_lat: newEventLocationLat,
          location_lng: newEventLocationLng,
          has_reminder: true,
          recurrence_pattern: recurrencePattern,
          recurrence_day: recurrencePattern === 'weekly' ? recurrenceDay : undefined,
          recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
        } as any]);

        // Record event title for autocomplete
        await recordEventTitle(newEventTitle);

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
        setNewEventLocation("");
        setNewEventLocationLat(undefined);
        setNewEventLocationLng(undefined);
        setRecurrencePattern('none');
        setRecurrenceDay(0);
        setRecurrenceEndDate("");
        setIsNewEventDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Group events for calendar (only used in calendar view)
  const getCalendarEvents = () => {
    if (drawerMode !== "calendar") return [];
    return tasks?.filter(t => !t.completed && calendarCategory.filter(t)) || [];
  };

  // Group tasks by date for calendar view
  const groupEventsByDate = (tasks: any[]) => {
    const grouped: Record<string, any[]> = {};
    
    tasks
      .filter(task => task.reminder_time && !task.completed)
      .sort((a, b) => new Date(a.reminder_time!).getTime() - new Date(b.reminder_time!).getTime())
      .forEach(task => {
        const date = new Date(task.reminder_time!);
        const dateKey = date.toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      });
    
    return grouped;
  };

  const calendarEvents = getCalendarEvents();
  const groupedEvents = drawerMode === 'calendar' ? groupEventsByDate(calendarEvents) : {};
  const hasEvents = Object.keys(groupedEvents).length > 0;

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
                    className="h-full flex flex-col p-6 md:p-8 pt-6"
                  >
                    {/* Header Row - Burger + Search */}
                    <div className="flex items-center gap-2 mb-4">
                      {/* Burger placeholder for alignment */}
                      <div className="w-5 h-5" />
                      
                      {/* Search Button - centered */}
                      <button
                        onClick={() => {
                          hapticLight();
                          onSearchOpen?.();
                          onClose();
                        }}
                        className="flex-1 flex items-center gap-3 px-3 py-2 text-foreground/50 hover:text-foreground/70 hover:bg-foreground/[0.03] transition-colors rounded-lg"
                      >
                        <SearchIcon className="w-4 h-4" />
                        <span className="font-mono text-sm">Search</span>
                        <span className="ml-auto text-[10px] text-muted-foreground/30">/</span>
                      </button>
                    </div>

                    {/* Add New Task Button */}
                    <button
                      onClick={() => {
                        hapticMedium();
                        onClose();
                        // Small delay to let drawer close before modal opens
                        setTimeout(() => {
                          openQuickCapture();
                        }, 100);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-foreground/10 rounded-lg text-sm text-foreground/60 hover:bg-foreground/[0.03] transition-colors mb-4"
                    >
                      <Plus className="w-4 h-4" />
                      Add new task
                    </button>

                    {/* CORE Section */}
                    <div className="mb-4">
                      <h3 className="font-mono font-normal text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-2">
                        Core
                      </h3>
                      <div className="space-y-0.5">
                        {coreCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id, category.route)}
                            className="w-full text-left py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SPACES Section */}
                    <div className="mb-4">
                      <h3 className="font-mono font-normal text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-2">
                        Spaces
                      </h3>
                      <div className="space-y-0.5">
                        {spaceCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id, category.route)}
                            className="w-full text-left py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* INSIGHTS Section */}
                    <div className="mb-4">
                      <h3 className="font-mono font-normal text-[10px] text-muted-foreground/40 uppercase tracking-widest mb-2">
                        Insights
                      </h3>
                      <div className="space-y-0.5">
                        {insightCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id, category.route)}
                            className="w-full text-left py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PROJECTS Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-mono font-normal text-[10px] text-muted-foreground/40 uppercase tracking-widest">
                          Projects
                        </h3>
                        <button
                          onClick={() => {
                            hapticLight();
                            toast({
                              title: "Coming soon",
                              description: "Project creation will be available soon.",
                            });
                          }}
                          className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors"
                          title="Create new project"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {!projectTasks || projectTasks.length === 0 ? (
                          <p className="text-xs text-foreground/30 py-1">Nothing here yet</p>
                        ) : (
                          projectTasks.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => {
                                hapticLight();
                                onClose();
                                requestAnimationFrame(() => {
                                  onNavigate(`/project/${project.id}`);
                                });
                              }}
                              className="w-full text-left py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                            >
                              {project.title}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Keyboard Shortcuts - At bottom */}
                    <div className="mt-auto pt-4 border-t border-border/50">
                      <ShortcutsHelp />
                      
                      {/* Settings & Sign Out */}
                      <div className="mt-4 space-y-1">
                        <button
                          onClick={() => {
                            hapticLight();
                            onClose();
                            requestAnimationFrame(() => {
                              navigate('/settings');
                            });
                          }}
                          className="w-full flex items-center gap-3 py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={async () => {
                            hapticLight();
                            await supabase.auth.signOut();
                            toast({
                              title: "Signed out",
                              description: "You've been signed out successfully.",
                            });
                          }}
                          className="w-full flex items-center gap-3 py-2 px-2 font-mono text-sm text-foreground/70 hover:bg-foreground/[0.03] rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : drawerMode === "calendar" ? (
                  <motion.div
                    {...categorySwipeHandlers}
                    key="calendar"
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
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="font-mono text-[16px] font-medium" style={{ color: '#111' }}>
                        Calendar
                      </h2>
                      <button
                        onClick={() => {
                          hapticLight();
                          setIsNewEventDialogOpen(true);
                        }}
                        className="p-1.5 hover:bg-black/5 rounded-md transition-colors"
                        aria-label="Add new event"
                      >
                        <Plus className="w-4 h-4" style={{ color: '#777' }} />
                      </button>
                    </div>

                    {/* Calendar View */}
                    <div className="flex-1">
                      {!hasEvents ? (
                        <div className="text-center py-16">
                          <p className="text-muted-foreground/40 text-sm">Nothing here yet</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
                            const date = new Date(dateKey);
                            const dayOfWeek = format(date, 'EEEE');
                            const monthDay = format(date, 'MMM d');
                            
                            return (
                              <div key={dateKey} className="space-y-4">
                                {/* Day Header */}
                                <div className="space-y-1">
                                  <div className="font-mono font-medium text-[15px]" style={{ color: '#111' }}>
                                    {dayOfWeek}
                                  </div>
                                  <div className="font-mono text-[14px]" style={{ color: '#999' }}>
                                    {monthDay}
                                  </div>
                                </div>
                                
                                {/* Divider */}
                                <div 
                                  className="h-px" 
                                  style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                                />
                                
                                {/* Events List */}
                                <div className="space-y-4">
                                  {dayEvents.map((task) => {
                                    const eventTime = new Date(task.reminder_time!);
                                    const dayAbbrev = format(eventTime, 'EEE');
                                    const timeStr = format(eventTime, 'h:mm a');
                                    
                                    return (
                                      <button
                                        key={task.id}
                                        onClick={() => handleEventClick(task)}
                                        className="w-full text-left flex items-start gap-3 py-2 px-2 -mx-2 rounded-md transition-colors"
                                        style={{ backgroundColor: 'transparent' }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        <div className="flex-shrink-0 mt-0.5">
                                          <span className="font-mono text-[14px]" style={{ color: '#888' }}>•</span>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                          <div 
                                            className="font-mono text-[14px] leading-snug"
                                            style={{ color: '#111' }}
                                          >
                                            {task.title}
                                          </div>
                                          <div 
                                            className="font-mono text-[13px]"
                                            style={{ color: '#999' }}
                                          >
                                            {dayAbbrev} at {timeStr}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-sm border-foreground/5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-[16px]">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <div>
                  <div className="font-mono text-[13px]" style={{ color: '#888' }}>Title</div>
                  <div className="font-mono text-[15px] mt-1" style={{ color: '#111' }}>{selectedEvent.title}</div>
                </div>
                
                <div>
                  <div className="font-mono text-[13px]" style={{ color: '#888' }}>Date & Time</div>
                  <div className="font-mono text-[15px] mt-1" style={{ color: '#111' }}>
                    {format(new Date(selectedEvent.reminder_time!), 'EEEE, MMM d')} at {format(new Date(selectedEvent.reminder_time!), 'h:mm a')}
                  </div>
                </div>
                
                {selectedEvent.context && (
                  <div>
                    <div className="font-mono text-[13px]" style={{ color: '#888' }}>Description</div>
                    <div className="font-mono text-[14px] mt-1" style={{ color: '#555' }}>{selectedEvent.context}</div>
                  </div>
                )}

                {selectedEvent.location_address && (
                  <div className="space-y-2">
                    <div className="font-mono text-[13px]" style={{ color: '#888' }}>Location</div>
                    <div className="font-mono text-[14px] mt-1" style={{ color: '#555' }}>{selectedEvent.location_address}</div>
                    {selectedEvent.location_lat && selectedEvent.location_lng && mapboxToken && (
                      <button
                        onClick={() => setIsMapFullScreenOpen(true)}
                        className="w-full h-[120px] rounded-xl overflow-hidden border border-foreground/5 hover:border-foreground/10 transition-colors relative group"
                      >
                        <img
                          src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+3b82f6(${selectedEvent.location_lng},${selectedEvent.location_lat})/${selectedEvent.location_lng},${selectedEvent.location_lat},13,0/600x240@2x?access_token=${mapboxToken}`}
                          alt="Location map"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded-full p-2">
                            <MapPin className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full font-mono text-[14px]"
                  onClick={handleCompleteEvent}
                >
                  Complete
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-mono text-[14px]"
                  onClick={handleRescheduleEvent}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-mono text-[14px]"
                  onClick={handleDeleteEvent}
                  style={{ color: '#dc2626' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Event Dialog */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-sm border-foreground/5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <DialogHeader>
            <DialogTitle className="font-mono text-[16px]">{selectedEvent ? 'Reschedule Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="drawer-title" className="font-mono text-[13px]">Event Title</Label>
              <EventTitleAutocomplete
                value={newEventTitle}
                onChange={setNewEventTitle}
                placeholder="Meeting, Appointment, etc."
                className="font-mono text-[14px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-date" className="font-mono text-[13px]">Date</Label>
                <Input
                  id="drawer-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="font-mono text-[14px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drawer-time" className="font-mono text-[13px]">Time</Label>
                <Input
                  id="drawer-time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="font-mono text-[14px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-description" className="font-mono text-[13px]">Description (optional)</Label>
              <Textarea
                id="drawer-description"
                placeholder="Add notes..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
                className="font-mono text-[14px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-location" className="font-mono text-[13px]">Location (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="drawer-location"
                  placeholder="Add location"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="font-mono text-[14px] flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="flex-shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {newEventLocationLat && newEventLocationLng && mapboxToken && (
              <button
                onClick={() => setIsMapFullScreenOpen(true)}
                className="w-full h-[120px] rounded-xl overflow-hidden border border-foreground/5 hover:border-foreground/10 transition-colors relative group"
              >
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+3b82f6(${newEventLocationLng},${newEventLocationLat})/${newEventLocationLng},${newEventLocationLat},13,0/600x240@2x?access_token=${mapboxToken}`}
                  alt="Location preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded-full p-2">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </button>
            )}

            <div className="space-y-2">
              <Label htmlFor="drawer-recurrence" className="font-mono text-[13px]">Repeat</Label>
              <Select value={recurrencePattern} onValueChange={(value: any) => setRecurrencePattern(value)}>
                <SelectTrigger id="drawer-recurrence" className="font-mono text-[14px]">
                  <SelectValue placeholder="Does not repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-mono text-[14px]">Does not repeat</SelectItem>
                  <SelectItem value="daily" className="font-mono text-[14px]">Daily</SelectItem>
                  <SelectItem value="weekly" className="font-mono text-[14px]">Weekly</SelectItem>
                  <SelectItem value="monthly" className="font-mono text-[14px]">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrencePattern === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="drawer-recurrence-day" className="font-mono text-[13px]">Day of Week</Label>
                <Select value={recurrenceDay.toString()} onValueChange={(value) => setRecurrenceDay(parseInt(value))}>
                  <SelectTrigger id="drawer-recurrence-day" className="font-mono text-[14px]">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="font-mono text-[14px]">Sunday</SelectItem>
                    <SelectItem value="1" className="font-mono text-[14px]">Monday</SelectItem>
                    <SelectItem value="2" className="font-mono text-[14px]">Tuesday</SelectItem>
                    <SelectItem value="3" className="font-mono text-[14px]">Wednesday</SelectItem>
                    <SelectItem value="4" className="font-mono text-[14px]">Thursday</SelectItem>
                    <SelectItem value="5" className="font-mono text-[14px]">Friday</SelectItem>
                    <SelectItem value="6" className="font-mono text-[14px]">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {recurrencePattern !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="drawer-recurrence-end" className="font-mono text-[13px]">End Date (optional)</Label>
                <Input
                  id="drawer-recurrence-end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="font-mono text-[14px]"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 font-mono text-[14px]"
                onClick={() => {
                  hapticLight();
                  setSelectedEvent(null);
                  setNewEventTitle("");
                  setNewEventDate("");
                  setNewEventTime("");
                  setNewEventDescription("");
                  setRecurrencePattern('none');
                  setRecurrenceDay(0);
                  setRecurrenceEndDate("");
                  setIsNewEventDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 font-mono text-[14px]"
                onClick={handleCreateEvent}
              >
                {selectedEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mapbox Location Picker */}
      <MapboxLocationPicker
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        onConfirm={(location) => {
          setNewEventLocation(location.address);
          setNewEventLocationLat(location.lat);
          setNewEventLocationLng(location.lng);
        }}
        accessToken={mapboxToken}
      />

      {/* Full Screen Map */}
      {selectedEvent?.location_lat && selectedEvent?.location_lng && (
        <MapFullScreen
          open={isMapFullScreenOpen}
          onOpenChange={setIsMapFullScreenOpen}
          lat={selectedEvent.location_lat}
          lng={selectedEvent.location_lng}
          address={selectedEvent.location_address}
          accessToken={mapboxToken}
        />
      )}

      {/* Full Screen Map for new event preview */}
      {newEventLocationLat && newEventLocationLng && (
        <MapFullScreen
          open={isMapFullScreenOpen && !selectedEvent}
          onOpenChange={setIsMapFullScreenOpen}
          lat={newEventLocationLat}
          lng={newEventLocationLng}
          address={newEventLocation}
          accessToken={mapboxToken}
        />
      )}
    </>
  );
};

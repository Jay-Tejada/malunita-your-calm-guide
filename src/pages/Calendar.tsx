import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { format, addDays, isSameDay, isPast, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { AppLayout } from "@/ui/AppLayout";
import { CalendarEventSheet } from "@/components/calendar/CalendarEventSheet";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string | null; // null = all-day
  completed: boolean;
  taskId: string;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  description?: string;
  locationAddress?: string;
}

interface GroupedEvents {
  date: Date;
  events: CalendarEvent[];
}

const Calendar = () => {
  const { toast } = useToast();
  const { tasks, isLoading, updateTask, createTasks, deleteTask } = useTasks();
  
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Convert tasks with reminder times to calendar events
  const events = useMemo(() => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => task.reminder_time)
      .map(task => {
        const eventDate = new Date(task.reminder_time!);
        const timeStr = format(eventDate, "H:mm");
        // Check if it's an "all-day" event (midnight or no specific time set)
        const isAllDay = timeStr === "0:00";
        
        return {
          id: task.id,
          title: task.title,
          date: eventDate,
          time: isAllDay ? null : format(eventDate, "H:mm"),
          completed: task.completed || false,
          taskId: task.id,
          recurrencePattern: task.recurrence_pattern || 'none',
          description: task.context || undefined,
          locationAddress: task.location_address || undefined,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks]);

  // Group events by day for the next 14 days (or more if there are events)
  const groupedEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const daysToShow = 14;
    const groups: GroupedEvents[] = [];
    
    // Create groups for each day
    for (let i = 0; i < daysToShow; i++) {
      const date = addDays(today, i);
      const dayEvents = events.filter(event => isSameDay(event.date, date));
      groups.push({ date, events: dayEvents });
    }
    
    // Include any events beyond 14 days
    const futureEvents = events.filter(
      event => event.date > addDays(today, daysToShow - 1)
    );
    
    futureEvents.forEach(event => {
      const existingGroup = groups.find(g => isSameDay(g.date, event.date));
      if (!existingGroup) {
        groups.push({ date: event.date, events: [event] });
      }
    });
    
    return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const handleEventClick = (event: CalendarEvent) => {
    hapticLight();
    setEditingEvent(event);
    setIsEventSheetOpen(true);
  };

  const handleAddEvent = () => {
    hapticLight();
    setEditingEvent(null);
    setIsEventSheetOpen(true);
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    date: string;
    time: string | null;
    description?: string;
  }) => {
    try {
      const dateTimeStr = eventData.time 
        ? `${eventData.date}T${eventData.time}`
        : `${eventData.date}T00:00`;
      const reminderDateTime = new Date(dateTimeStr);
      
      if (editingEvent) {
        // Update existing event
        await updateTask({
          id: editingEvent.taskId,
          updates: {
            title: eventData.title,
            reminder_time: reminderDateTime.toISOString(),
            context: eventData.description || undefined,
          }
        });
        
        hapticSuccess();
        toast({
          title: "Event updated",
          description: "Your calendar event has been updated.",
        });
      } else {
        // Create new event
        await createTasks([{
          title: eventData.title,
          reminder_time: reminderDateTime.toISOString(),
          context: eventData.description || undefined,
          has_reminder: true,
        }]);
        
        hapticSuccess();
        toast({
          title: "Event added",
          description: "Your calendar event has been added.",
        });
      }
      
      setIsEventSheetOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    
    try {
      await deleteTask(editingEvent.taskId);
      
      hapticSuccess();
      toast({
        title: "Event removed",
        description: "Your calendar event has been removed.",
      });
      
      setIsEventSheetOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (eventId: string, completed: boolean) => {
    try {
      await updateTask({
        id: eventId,
        updates: { completed: !completed }
      });
      hapticLight();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const scrollToToday = () => {
    hapticLight();
    const todayElement = document.getElementById('calendar-today');
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AppLayout 
      title="Calendar" 
      showBack
      rightAction={
        <button
          onClick={handleAddEvent}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Add event"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div className="px-5 pb-24">
        {/* Jump to Today - subtle indicator */}
        <button
          onClick={scrollToToday}
          className="text-[10px] uppercase tracking-widest text-muted-foreground/50 hover:text-muted-foreground transition-colors mb-6"
        >
          Today ↓
        </button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            {groupedEvents.map((group, groupIndex) => {
              const isToday = isSameDay(group.date, new Date());
              const dayLabel = format(group.date, "EEE");
              const dateLabel = format(group.date, "MMM d");
              
              return (
                <div 
                  key={group.date.toISOString()} 
                  id={isToday ? 'calendar-today' : undefined}
                  className="relative"
                >
                  {/* Day header */}
                  <div className={cn(
                    "flex items-baseline gap-2 mb-2",
                    isToday && "text-foreground",
                    !isToday && "text-muted-foreground"
                  )}>
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary"
                    )}>
                      {dayLabel}
                    </span>
                    <span className="text-[10px] tracking-wide">
                      · {dateLabel}
                    </span>
                    {isToday && (
                      <span className="text-[9px] uppercase tracking-widest text-primary/60 ml-1">
                        today
                      </span>
                    )}
                  </div>
                  
                  {/* Events list */}
                  {group.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground/40 pl-1">
                      (no scheduled events)
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {group.events.map((event) => {
                        const isPastEvent = isPast(event.date) && !isSameDay(event.date, new Date());
                        
                        return (
                          <li key={event.id}>
                            <button
                              onClick={() => handleEventClick(event)}
                              className={cn(
                                "w-full text-left flex items-start gap-2 py-0.5 group transition-opacity",
                                isPastEvent && "opacity-50",
                                event.completed && "opacity-40"
                              )}
                            >
                              {/* Bullet */}
                              <span className={cn(
                                "text-muted-foreground/60 select-none mt-0.5",
                                event.completed && "text-primary/40"
                              )}>
                                •
                              </span>
                              
                              {/* Event content */}
                              <div className="flex-1 min-w-0">
                                <span className={cn(
                                  "text-sm",
                                  event.time 
                                    ? "text-muted-foreground" 
                                    : "sr-only"
                                )}>
                                  {event.time && `${event.time} – `}
                                </span>
                                <span className={cn(
                                  "text-sm text-foreground",
                                  event.completed && "line-through text-muted-foreground"
                                )}>
                                  {event.title}
                                </span>
                                
                                {/* Recurrence indicator */}
                                {event.recurrencePattern && event.recurrencePattern !== 'none' && (
                                  <span className="text-[10px] text-muted-foreground/50 ml-2">
                                    ↻
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Sheet (slide-up for create/edit) */}
      <CalendarEventSheet
        isOpen={isEventSheetOpen}
        onClose={() => {
          setIsEventSheetOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        onToggleComplete={editingEvent ? () => handleToggleComplete(editingEvent.taskId, editingEvent.completed) : undefined}
      />
    </AppLayout>
  );
};

export default Calendar;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Clock, MapPin, CheckCircle } from "lucide-react";
import { hapticLight } from "@/utils/haptics";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  description?: string;
  completed: boolean;
  taskId: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { tasks, isLoading, updateTask } = useTasks();
  
  // Convert tasks with reminder times to calendar events
  const events = useMemo(() => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => task.reminder_time)
      .map(task => ({
        id: task.id,
        title: task.title,
        date: new Date(task.reminder_time!),
        time: format(new Date(task.reminder_time!), "h:mm a"),
        location: task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : undefined,
        description: task.context,
        completed: task.completed,
        taskId: task.id,
      }));
  }, [tasks]);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const upcomingEvents = events
    .filter(event => event.date >= new Date() && !event.completed)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

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

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 pt-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            navigate("/");
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-8 h-8" />
              Calendar
            </h1>
            <Button size="sm" variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
          <p className="text-muted-foreground">
            Your schedule and appointments
          </p>
        </div>

        {/* Week View */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      hapticLight();
                      setSelectedDate(day);
                    }}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg transition-all",
                      "hover:bg-accent/50",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "border-2 border-primary"
                    )}
                  >
                    <span className="text-xs font-medium mb-1">
                      {format(day, "EEE")}
                    </span>
                    <span className={cn(
                      "text-lg font-bold",
                      isToday && !isSelected && "text-primary"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-primary-foreground" : "bg-primary"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Loading events...</p>
              </CardContent>
            </Card>
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add reminder times to your tasks to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer",
                    event.completed && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                        <span className="text-xs font-medium text-primary uppercase">
                          {format(event.date, "MMM")}
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {format(event.date, "d")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(event.date, "EEE")}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn(
                            "font-semibold text-foreground mb-1",
                            event.completed && "line-through"
                          )}>
                            {event.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(event.taskId, event.completed);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className={cn(
                              "w-5 h-5",
                              event.completed ? "fill-primary text-primary" : "text-muted-foreground"
                            )} />
                          </Button>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{event.time}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-xs mt-1 text-muted-foreground/80">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calendar;

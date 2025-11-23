import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Clock, MapPin, CheckCircle } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const { tasks, isLoading, updateTask, createTasks } = useTasks();
  
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
      }]);

      hapticSuccess();
      toast({
        title: "Event created",
        description: "Your calendar event has been added.",
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventDescription("");
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

  const handleEventClick = (event: CalendarEvent) => {
    hapticLight();
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDate(format(event.date, "yyyy-MM-dd"));
    setNewEventTime(format(event.date, "HH:mm"));
    setNewEventDescription(event.description || "");
    setIsEditEventDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEventTitle.trim() || !newEventDate || !newEventTime) {
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
        id: editingEvent.taskId,
        updates: {
          title: newEventTitle,
          reminder_time: reminderDateTime.toISOString(),
          context: newEventDescription || undefined,
        }
      });

      hapticSuccess();
      toast({
        title: "Event updated",
        description: "Your calendar event has been updated.",
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventDescription("");
      setEditingEvent(null);
      setIsEditEventDialogOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
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
            <Button 
              size="sm" 
              variant="default"
              onClick={() => {
                hapticLight();
                setIsNewEventDialogOpen(true);
              }}
            >
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
                  onClick={() => handleEventClick(event)}
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

      {/* New Event Dialog */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="Meeting, Appointment, etc."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes or location..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

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

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                placeholder="Meeting, Appointment, etc."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add notes or location..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  hapticLight();
                  setIsEditEventDialogOpen(false);
                  setEditingEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateEvent}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;

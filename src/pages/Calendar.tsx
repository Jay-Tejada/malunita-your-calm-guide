import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ArrowLeft, Plus, Clock, MapPin, CheckCircle, Trash2, Repeat } from "lucide-react";
import { hapticLight, hapticSuccess } from "@/utils/haptics";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { MapboxLocationPicker } from "@/components/MapboxLocationPicker";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  description?: string;
  completed: boolean;
  taskId: string;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
}

const Calendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventLocationLat, setNewEventLocationLat] = useState<number | null>(null);
  const [newEventLocationLng, setNewEventLocationLng] = useState<number | null>(null);
  const [newEventDescription, setNewEventDescription] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(0);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const { tasks, isLoading, updateTask, createTasks, deleteTask } = useTasks();
  const { token: mapboxToken } = useMapboxToken();
  
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
        recurrencePattern: task.recurrence_pattern || 'none',
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
        location_address: newEventLocation || undefined,
        location_lat: newEventLocationLat,
        location_lng: newEventLocationLng,
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
      setNewEventLocation("");
      setNewEventLocationLat(null);
      setNewEventLocationLng(null);
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

  const handleEventClick = (event: CalendarEvent) => {
    hapticLight();
    const task = tasks?.find(t => t.id === event.taskId);
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDate(format(event.date, "yyyy-MM-dd"));
    setNewEventTime(format(event.date, "HH:mm"));
    setNewEventLocation(task?.location_address || "");
    setNewEventLocationLat(task?.location_lat || null);
    setNewEventLocationLng(task?.location_lng || null);
    setNewEventDescription(event.description || "");
    setRecurrencePattern(task?.recurrence_pattern || 'none');
    setRecurrenceDay(task?.recurrence_day || 0);
    setRecurrenceEndDate(task?.recurrence_end_date ? format(new Date(task.recurrence_end_date), "yyyy-MM-dd") : "");
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
          location_address: newEventLocation || undefined,
          location_lat: newEventLocationLat,
          location_lng: newEventLocationLng,
          recurrence_pattern: recurrencePattern,
          recurrence_day: recurrencePattern === 'weekly' ? recurrenceDay : undefined,
          recurrence_end_date: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
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
      setNewEventLocation("");
      setNewEventLocationLat(null);
      setNewEventLocationLng(null);
      setNewEventDescription("");
      setRecurrencePattern('none');
      setRecurrenceDay(0);
      setRecurrenceEndDate("");
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

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      await deleteTask(editingEvent.taskId);

      hapticSuccess();
      toast({
        title: "Event deleted",
        description: "Your calendar event has been removed.",
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventLocation("");
      setNewEventLocationLat(null);
      setNewEventLocationLng(null);
      setNewEventDescription("");
      setRecurrencePattern('none');
      setRecurrenceDay(0);
      setRecurrenceEndDate("");
      setEditingEvent(null);
      setIsEditEventDialogOpen(false);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
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
                          <div className="flex-1">
                            <h3 className={cn(
                              "font-semibold text-foreground mb-1",
                              event.completed && "line-through"
                            )}>
                              {event.title}
                            </h3>
                            {event.recurrencePattern && event.recurrencePattern !== 'none' && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                <Repeat className="w-3 h-3" />
                                <span className="capitalize">{event.recurrencePattern}</span>
                              </div>
                            )}
                          </div>
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
              <Label htmlFor="location">Location (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  placeholder="660 white plains"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    hapticLight();
                    setIsLocationPickerOpen(true);
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Repeat</Label>
              <Select value={recurrencePattern} onValueChange={(value: any) => setRecurrencePattern(value)}>
                <SelectTrigger id="recurrence">
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
                <Label htmlFor="recurrence-day">Day of Week</Label>
                <Select value={recurrenceDay.toString()} onValueChange={(value) => setRecurrenceDay(parseInt(value))}>
                  <SelectTrigger id="recurrence-day">
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
                <Label htmlFor="recurrence-end">End Date (optional)</Label>
                <Input
                  id="recurrence-end"
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
              <Label htmlFor="edit-location">Location (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-location"
                  placeholder="660 white plains"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    hapticLight();
                    setIsLocationPickerOpen(true);
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add notes..."
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-recurrence">Repeat</Label>
              <Select value={recurrencePattern} onValueChange={(value: any) => setRecurrencePattern(value)}>
                <SelectTrigger id="edit-recurrence">
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
                <Label htmlFor="edit-recurrence-day">Day of Week</Label>
                <Select value={recurrenceDay.toString()} onValueChange={(value) => setRecurrenceDay(parseInt(value))}>
                  <SelectTrigger id="edit-recurrence-day">
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
                <Label htmlFor="edit-recurrence-end">End Date (optional)</Label>
                <Input
                  id="edit-recurrence-end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => {
                  hapticLight();
                  setIsDeleteAlertOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                onClick={() => {
                  hapticLight();
                  setIsEditEventDialogOpen(false);
                  setEditingEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateEvent}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => hapticLight()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location Picker */}
      <MapboxLocationPicker
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        accessToken={mapboxToken}
        onConfirm={(location) => {
          setNewEventLocation(location.address);
          setNewEventLocationLat(location.lat);
          setNewEventLocationLng(location.lng);
          hapticSuccess();
        }}
      />
    </div>
  );
};

export default Calendar;

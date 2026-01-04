import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { hapticLight } from "@/utils/haptics";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string | null;
  completed: boolean;
  taskId: string;
  description?: string;
}

interface CalendarEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onSave: (data: {
    title: string;
    date: string;
    time: string | null;
    description?: string;
  }) => void;
  onDelete?: () => void;
  onToggleComplete?: () => void;
}

export const CalendarEventSheet = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete,
  onToggleComplete,
}: CalendarEventSheetProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState("");

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDate(format(event.date, "yyyy-MM-dd"));
      setTime(event.time || "");
      setIsAllDay(!event.time);
      setDescription(event.description || "");
    } else {
      // New event - default to today
      setTitle("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setTime("09:00");
      setIsAllDay(false);
      setDescription("");
    }
  }, [event, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) return;
    
    hapticLight();
    onSave({
      title: title.trim(),
      date,
      time: isAllDay ? null : time || null,
      description: description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    hapticLight();
    onDelete?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh]">
        <SheetHeader className="sr-only">
          <SheetTitle>{event ? "Edit Event" : "New Event"}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title..."
            autoFocus={!event}
            className="w-full bg-transparent border-b border-border/50 py-3 font-mono text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
          />
          
          {/* Date & Time row */}
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent border border-border/30 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
            
            {!isAllDay && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-28 bg-transparent border border-border/30 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            )}
          </div>
          
          {/* All-day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-border/50 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-muted-foreground">All-day</span>
          </label>
          
          {/* Description (optional) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes (optional)..."
            rows={2}
            className="w-full bg-transparent border border-border/30 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none"
          />
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Left side: delete & complete for existing events */}
            <div className="flex items-center gap-2">
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 text-destructive/70 hover:text-destructive transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {event && onToggleComplete && (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    onToggleComplete();
                  }}
                  className={cn(
                    "p-2 transition-colors",
                    event.completed 
                      ? "text-primary" 
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  )}
                  aria-label={event.completed ? "Mark incomplete" : "Mark complete"}
                >
                  <CheckCircle className={cn(
                    "w-4 h-4",
                    event.completed && "fill-primary"
                  )} />
                </button>
              )}
            </div>
            
            {/* Right side: cancel & save */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !date}
                className="text-sm text-primary font-medium hover:text-primary/80 transition-colors px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {event ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

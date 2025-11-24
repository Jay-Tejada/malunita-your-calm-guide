import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapboxLocationPicker } from "@/components/MapboxLocationPicker";
import { MapPin } from "lucide-react";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Task } from "@/hooks/useTasks";

interface TaskEditDialogProps {
  open: boolean;
  task: Task | null;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

export const TaskEditDialog = ({ open, task, onSave, onClose }: TaskEditDialogProps) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("inbox");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { token: accessToken } = useMapboxToken();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.reminder_time || "");
      setContext(task.context || "");
      setCategory(task.category || "inbox");
      setLocationLat(task.location_lat ?? null);
      setLocationLng(task.location_lng ?? null);
      setLocationAddress(task.location_address ?? null);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    onSave(task.id, {
      title: title.trim() || task.title,
      reminder_time: time.trim() || undefined,
      context: context.trim() || undefined,
      category: category,
      location_lat: locationLat,
      location_lng: locationLng,
      location_address: locationAddress,
    });
    onClose();
  };

  const handleLocationConfirm = (location: { lat: number; lng: number; address: string }) => {
    setLocationLat(location.lat);
    setLocationLng(location.lng);
    setLocationAddress(location.address);
    setShowLocationPicker(false);
  };

  const handleRemoveLocation = () => {
    setLocationLat(null);
    setLocationLng(null);
    setLocationAddress(null);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details of your task
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 10:00 AM"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Work, Personal"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">Inbox</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="gym">Gym</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            {locationAddress ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 text-sm bg-secondary rounded-md flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{locationAddress}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLocation}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowLocationPicker(true)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            )}
          </div>
        </div>

        <MapboxLocationPicker
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onConfirm={handleLocationConfirm}
          accessToken={accessToken}
        />

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

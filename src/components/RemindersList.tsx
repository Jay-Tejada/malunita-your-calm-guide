import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, Edit2, Mic, MicOff, Calendar, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, isFuture, isToday, isTomorrow } from 'date-fns';

interface TaskWithReminder {
  id: string;
  title: string;
  reminder_time: string;
  category: string;
  completed: boolean;
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_day?: number;
}

export function RemindersList() {
  const [reminders, setReminders] = useState<TaskWithReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    fetchReminders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: 'reminder_time=not.is.null'
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, reminder_time, category, completed, recurrence_pattern, recurrence_day')
        .eq('user_id', user.id)
        .not('reminder_time', 'is', null)
        .order('reminder_time', { ascending: true });

      if (error) throw error;

      setReminders((data || []) as TaskWithReminder[]);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "Could not load reminders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceCommand = async (reminderId: string) => {
    setSelectedReminderId(reminderId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceCommand(audioBlob, reminderId);
      };

      mediaRecorder.start();
      setIsListening(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsListening(false);
        }
      }, 5000);

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopVoiceCommand = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (audioBlob: Blob, reminderId: string) => {
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result?.toString().split(',')[1];
          resolve(result || '');
        };
      });

      // Transcribe
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (transcribeError) throw transcribeError;

      const command = transcribeData.text.toLowerCase().trim();
      setVoiceCommand(command);

      // Process command
      if (command.includes('delete') || command.includes('remove') || command.includes('cancel')) {
        await deleteReminder(reminderId);
      } else if (command.includes('change') || command.includes('update') || command.includes('edit') || command.includes('move')) {
        await updateReminderTime(reminderId, command);
      } else {
        toast({
          title: "Command not recognized",
          description: "Say 'delete' to remove or 'change to [time]' to update",
        });
      }
    } catch (error) {
      console.error('Voice command error:', error);
      toast({
        title: "Error",
        description: "Could not process voice command",
        variant: "destructive"
      });
    } finally {
      setSelectedReminderId(null);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ reminder_time: null, has_reminder: false })
        .eq('id', reminderId);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "The reminder has been removed",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Could not delete reminder",
        variant: "destructive"
      });
    }
  };

  const updateReminderTime = async (reminderId: string, command: string) => {
    try {
      // Parse new time using chrono-node (local parsing, no AI needed)
      // TODO: Phase 2A - Removed chat-completion dependency
      const chrono = await import('chrono-node');
      const parsedDate = chrono.parseDate(command, new Date(), { forwardDate: true });
      
      if (!parsedDate) {
        toast({
          title: "Could not parse time",
          description: "Try saying something like '5 PM' or 'tomorrow at 3'",
          variant: "destructive"
        });
        return;
      }

      const newReminderTime = parsedDate.toISOString();

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ reminder_time: newReminderTime })
        .eq('id', reminderId);

      if (updateError) throw updateError;

      toast({
        title: "Reminder updated",
        description: "The reminder time has been changed",
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Could not update reminder time",
        variant: "destructive"
      });
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date)) return 'Overdue';
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const groupedReminders = {
    overdue: reminders.filter(r => isPast(new Date(r.reminder_time)) && !r.completed),
    upcoming: reminders.filter(r => isFuture(new Date(r.reminder_time)) && !r.completed),
    completed: reminders.filter(r => r.completed)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">Reminders</h1>
          <p className="text-muted-foreground mt-1">Manage your scheduled reminders</p>
        </div>
        <Button variant="outline" onClick={fetchReminders}>
          <Calendar className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reminders set</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedReminders.overdue.length > 0 && (
            <div>
              <h2 className="text-xl font-light mb-3 text-destructive">Overdue</h2>
              <div className="space-y-2">
                {groupedReminders.overdue.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    isListening={isListening && selectedReminderId === reminder.id}
                    onVoiceCommand={() => isListening ? stopVoiceCommand() : startVoiceCommand(reminder.id)}
                    onDelete={() => deleteReminder(reminder.id)}
                    getRelativeTime={getRelativeTime}
                    isOverdue
                  />
                ))}
              </div>
            </div>
          )}

          {groupedReminders.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-light mb-3">Upcoming</h2>
              <div className="space-y-2">
                {groupedReminders.upcoming.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    isListening={isListening && selectedReminderId === reminder.id}
                    onVoiceCommand={() => isListening ? stopVoiceCommand() : startVoiceCommand(reminder.id)}
                    onDelete={() => deleteReminder(reminder.id)}
                    getRelativeTime={getRelativeTime}
                  />
                ))}
              </div>
            </div>
          )}

          {showCompleted && groupedReminders.completed.length > 0 && (
            <div>
              <h2 className="text-xl font-light mb-3 text-muted-foreground">Completed</h2>
              <div className="space-y-2">
                {groupedReminders.completed.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    isListening={isListening && selectedReminderId === reminder.id}
                    onVoiceCommand={() => isListening ? stopVoiceCommand() : startVoiceCommand(reminder.id)}
                    onDelete={() => deleteReminder(reminder.id)}
                    getRelativeTime={getRelativeTime}
                    isCompleted
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Show completed toggle */}
          {groupedReminders.completed.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors w-full text-center py-2"
            >
              {showCompleted ? `Hide completed (${groupedReminders.completed.length})` : `Show completed (${groupedReminders.completed.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ReminderCardProps {
  reminder: TaskWithReminder;
  isListening: boolean;
  onVoiceCommand: () => void;
  onDelete: () => void;
  getRelativeTime: (date: string) => string;
  isOverdue?: boolean;
  isCompleted?: boolean;
}

function ReminderCard({ reminder, isListening, onVoiceCommand, onDelete, getRelativeTime, isOverdue, isCompleted }: ReminderCardProps) {
  const getRecurrenceLabel = () => {
    if (!reminder.recurrence_pattern || reminder.recurrence_pattern === 'none') return null;
    
    if (reminder.recurrence_pattern === 'daily') return 'Daily';
    if (reminder.recurrence_pattern === 'monthly') return 'Monthly';
    if (reminder.recurrence_pattern === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return reminder.recurrence_day !== undefined ? `Every ${days[reminder.recurrence_day]}` : 'Weekly';
    }
    return null;
  };

  const recurrenceLabel = getRecurrenceLabel();

  return (
    <Card className={`${isOverdue ? 'border-destructive' : ''} ${isCompleted ? 'opacity-40' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {reminder.title}
              </h3>
              {recurrenceLabel && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Repeat className="w-3 h-3" />
                  {recurrenceLabel}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className={`w-4 h-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                {getRelativeTime(reminder.reminder_time)}
              </span>
              <span className="text-xs text-muted-foreground capitalize">• {reminder.category}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isListening ? "default" : "ghost"}
              size="sm"
              onClick={onVoiceCommand}
              className="relative"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                </>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {isListening && (
          <div className="mt-3 text-xs text-muted-foreground">
            Say "delete" to remove or "change to [time]" to update...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

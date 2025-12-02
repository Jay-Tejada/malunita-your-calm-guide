import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hapticLight, hapticSuccess } from '@/utils/haptics';
import { useHabits } from '@/hooks/useHabits';
import { HabitRow } from '@/components/habits/HabitRow';
import { format, subDays } from 'date-fns';

const HABIT_ICONS = ['💪', '📚', '🧘', '💊', '🏃', '💤', '🥗', '💧', '✍️', '🎯'];

const Habits = () => {
  const navigate = useNavigate();
  const {
    habits,
    isLoading,
    createHabit,
    toggleCompletion,
    getStreak,
    isCompletedToday,
    getWeekCompletions,
  } = useHabits();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'weekdays'>('daily');
  const [newIcon, setNewIcon] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    await createHabit.mutateAsync({
      title: newTitle,
      frequency: newFrequency,
      icon: newIcon || null,
    });

    setNewTitle('');
    setNewFrequency('daily');
    setNewIcon('');
    setIsCreateOpen(false);
    hapticSuccess();
  };

  const handleToggle = (habitId: string) => {
    toggleCompletion.mutate({ habitId });
  };

  // Get day labels for the week header
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'EEE')[0]; // First letter of day
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticLight();
                navigate(-1);
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-mono text-lg font-medium">Habits</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticLight();
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 text-foreground/40 font-mono text-sm">
            Loading...
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/40 font-mono text-sm mb-4">
              No habits yet
            </p>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              className="font-mono"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first habit
            </Button>
          </div>
        ) : (
          <>
            {/* Week header */}
            <div className="flex items-center justify-end gap-1 px-4 mb-2 mr-8">
              {weekDays.map((day, i) => (
                <span
                  key={i}
                  className="w-1.5 text-[8px] text-foreground/30 text-center"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Habit list */}
            <div className="bg-foreground/[0.02] rounded-xl divide-y divide-foreground/5">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  isCompleted={isCompletedToday(habit.id)}
                  streak={getStreak(habit.id)}
                  weekCompletions={getWeekCompletions(habit.id)}
                  onToggle={() => handleToggle(habit.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">New Habit</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Icon selector */}
            <div>
              <label className="text-xs text-foreground/50 mb-2 block">Icon (optional)</label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(newIcon === icon ? '' : icon)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      newIcon === icon
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-foreground/5 hover:bg-foreground/10'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div>
              <label className="text-xs text-foreground/50 mb-2 block">Habit name</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Meditate 10 minutes"
                className="font-mono"
                autoFocus
              />
            </div>

            {/* Frequency selector */}
            <div>
              <label className="text-xs text-foreground/50 mb-2 block">Frequency</label>
              <Select value={newFrequency} onValueChange={(v: any) => setNewFrequency(v)}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createHabit.isPending}
                className="flex-1"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Habits;

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Lightbulb, Check, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useWeeklyPlanContext, PrioritySuggestion, CalendarConstraint } from '@/hooks/useWeeklyPlanContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface WeeklyPlanProps {
  onComplete: () => void;
}

const WeeklyPlan = ({ onComplete }: WeeklyPlanProps) => {
  const { data: context, isLoading } = useWeeklyPlanContext();
  const { toast } = useToast();

  const [priorities, setPriorities] = useState<string[]>(['', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());

  // Pre-fill from suggestions when context loads
  useEffect(() => {
    if (context?.suggestedPriorities && priorities.every((p) => !p)) {
      const topSuggestions = context.suggestedPriorities
        .filter((s) => s.confidence === 'high')
        .slice(0, 3)
        .map((s) => s.text);
      if (topSuggestions.length > 0) {
        const newPriorities = [...priorities];
        topSuggestions.forEach((text, i) => {
          if (i < 3) newPriorities[i] = text;
        });
        setPriorities(newPriorities);
        setAcceptedSuggestions(new Set(topSuggestions));
      }
    }
  }, [context]);

  const handleAcceptSuggestion = (suggestion: PrioritySuggestion) => {
    const emptyIndex = priorities.findIndex((p) => !p.trim());
    if (emptyIndex !== -1) {
      const newPriorities = [...priorities];
      newPriorities[emptyIndex] = suggestion.text;
      setPriorities(newPriorities);
      setAcceptedSuggestions(new Set([...acceptedSuggestions, suggestion.text]));
    }
  };

  const handleRemovePriority = (index: number) => {
    const newPriorities = [...priorities];
    const removed = newPriorities[index];
    newPriorities[index] = '';
    setPriorities(newPriorities);
    if (removed) {
      const newAccepted = new Set(acceptedSuggestions);
      newAccepted.delete(removed);
      setAcceptedSuggestions(newAccepted);
    }
  };

  const handleSave = async () => {
    const filledPriorities = priorities.filter((p) => p.trim());
    if (filledPriorities.length === 0) {
      onComplete();
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      await supabase
        .from('weekly_priorities')
        .upsert({
          user_id: user.id,
          week_start: weekStartStr,
          priority_one: priorities[0] || null,
          priority_two: priorities[1] || null,
          priority_three: priorities[2] || null,
        }, { onConflict: 'user_id,week_start' });

      toast({
        title: 'Weekly priorities saved',
        description: `${filledPriorities.length} priorities set for this week.`,
      });

      onComplete();
    } catch (error) {
      console.error('Error saving priorities:', error);
      toast({
        title: 'Error saving priorities',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-foreground/5 rounded-lg animate-pulse" />
        <div className="h-24 bg-foreground/5 rounded-lg animate-pulse" />
        <div className="h-48 bg-foreground/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  const unusedSuggestions = context?.suggestedPriorities.filter(
    (s) => !acceptedSuggestions.has(s.text)
  ) || [];

  return (
    <div className="space-y-5">
      <div className="text-center py-2">
        <p className="text-sm text-foreground/50">
          Define up to 3 priorities for this week. Keep it focused.
        </p>
      </div>

      {/* Calendar Constraints / Warnings */}
      {context?.calendarConstraints && context.calendarConstraints.length > 0 && (
        <Card className="p-3 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {context.calendarConstraints.map((constraint, i) => (
                <p key={i} className="text-sm text-amber-700 dark:text-amber-300">
                  {constraint.message}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Priority Inputs */}
      <Card className="p-4 bg-foreground/[0.02] border-foreground/5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">
          Weekly Priorities
        </p>
        {priorities.map((priority, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-foreground/30 w-5">{index + 1}.</span>
            <Input
              value={priority}
              onChange={(e) => {
                const newPriorities = [...priorities];
                newPriorities[index] = e.target.value;
                setPriorities(newPriorities);
              }}
              placeholder={`Priority ${index + 1}`}
              className="flex-1 bg-transparent border-foreground/10 focus:border-foreground/20"
              disabled={isSaving}
            />
            {priority && (
              <button
                onClick={() => handleRemovePriority(index)}
                className="p-1 text-foreground/30 hover:text-foreground/60 transition-colors"
                disabled={isSaving}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </Card>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-foreground/40" />
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">
              Suggestions
            </p>
          </div>
          <div className="space-y-2">
            {unusedSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-foreground/[0.02] border border-foreground/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/70 truncate">{suggestion.text}</p>
                  <p className="text-[10px] text-foreground/30 capitalize">
                    From {suggestion.source} • {suggestion.confidence} confidence
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAcceptSuggestion(suggestion)}
                  disabled={priorities.every((p) => p.trim()) || isSaving}
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rollover Tasks Warning */}
      {context?.rolloverTasks && context.rolloverTasks.length > 3 && (
        <Card className="p-3 bg-foreground/[0.02] border-foreground/5">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
            Pending from previous weeks
          </p>
          <div className="space-y-1">
            {context.rolloverTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground/50 truncate flex-1">{task.title}</span>
                <span className="text-foreground/30 text-xs flex-shrink-0 ml-2">
                  {task.age}d ago
                </span>
              </div>
            ))}
            {context.rolloverTasks.length > 3 && (
              <p className="text-xs text-foreground/30">
                +{context.rolloverTasks.length - 3} more
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Set Priorities & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WeeklyPlan;

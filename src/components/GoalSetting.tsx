import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Edit2, Check, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const GoalSetting = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [goal, setGoal] = useState(profile?.current_goal || "");
  const [timeframe, setTimeframe] = useState(profile?.goal_timeframe || "this_week");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!goal.trim()) {
      toast({
        title: "Goal required",
        description: "Please enter a goal before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          current_goal: goal.trim(),
          goal_timeframe: timeframe,
          goal_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Goal set ✓",
        description: "Malunita will now align tasks with this goal",
      });
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          current_goal: null,
          goal_timeframe: null,
          goal_updated_at: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setGoal("");
      setTimeframe("this_week");
      setIsEditing(false);
      toast({
        title: "Goal cleared",
        description: "Tasks will no longer be evaluated for goal alignment",
      });
    } catch (error: any) {
      console.error('Error clearing goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear goal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing && !profile?.current_goal) {
    return (
      <Card className="p-4 border-dashed">
        <Button
          onClick={() => setIsEditing(true)}
          variant="ghost"
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <Target className="w-4 h-4" />
          Set a goal to align your tasks
        </Button>
      </Card>
    );
  }

  if (!isEditing) {
    return (
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {profile?.goal_timeframe === 'this_week' ? 'This Week' : 
                 profile?.goal_timeframe === 'this_month' ? 'This Month' : 'Current Goal'}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{profile?.current_goal}</p>
          </div>
          <Button
            onClick={() => {
              setGoal(profile?.current_goal || "");
              setTimeframe(profile?.goal_timeframe || "this_week");
              setIsEditing(true);
            }}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-medium">Set Your Goal</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="goal-input" className="text-xs">What do you want to focus on?</Label>
          <Input
            id="goal-input"
            placeholder="e.g., Launch PCMH Pro, Get in shape, Finish licensing docs"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeframe-select" className="text-xs">Timeframe</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger id="timeframe-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="flex-1 gap-2"
          >
            <Check className="w-4 h-4" />
            Save Goal
          </Button>
          <Button
            onClick={() => {
              setGoal(profile?.current_goal || "");
              setTimeframe(profile?.goal_timeframe || "this_week");
              setIsEditing(false);
            }}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
          {profile?.current_goal && (
            <Button
              onClick={handleClear}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Malunita will evaluate new tasks against this goal and tag them as goal-aligned, helping you stay focused on what matters.
      </p>
    </Card>
  );
};

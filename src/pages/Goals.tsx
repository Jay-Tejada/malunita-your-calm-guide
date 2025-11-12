import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, CheckCircle2, Circle, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomCategoryManager } from "@/components/CustomCategoryManager";
import { BottomNav } from "@/components/BottomNav";
import { TaskGoalTagging } from "@/components/TaskGoalTagging";
import { GoalSuggestions } from "@/components/GoalSuggestions";

const Goals = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [goal, setGoal] = useState("");
  const [timeframe, setTimeframe] = useState("this_week");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setGoal(profile.current_goal || "");
      setTimeframe(profile.goal_timeframe || "this_week");
    }
  }, [profile]);

  const handleSaveGoal = async () => {
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
        title: "Goal updated ✓",
        description: "Your focus has been set",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSuggestion = (suggestedGoal: string, suggestedTimeframe: string) => {
    setGoal(suggestedGoal);
    setTimeframe(suggestedTimeframe);
    setIsEditing(true);
  };

  // Calculate goal statistics
  const goalAlignedTasks = tasks.filter(t => t.goal_aligned && !t.completed);
  const completedGoalTasks = tasks.filter(t => t.goal_aligned && t.completed);
  const totalGoalTasks = goalAlignedTasks.length + completedGoalTasks.length;
  const progressPercentage = totalGoalTasks > 0 
    ? Math.round((completedGoalTasks.length / totalGoalTasks) * 100) 
    : 0;

  const timeframeLabel = timeframe === "this_week" ? "This Week" : 
                         timeframe === "this_month" ? "This Month" : "This Quarter";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🎯 Goals & Focus</h1>
            <p className="text-muted-foreground mt-1">
              Manage your goals and track task alignment
            </p>
          </div>
        </div>

        <Tabs defaultValue="goal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="goal">Current Goal</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="goal" className="space-y-6">
            {/* AI Suggestions - Show when no goal or editing */}
            {(!profile?.current_goal || isEditing) && (
              <GoalSuggestions onSelectGoal={handleSelectSuggestion} />
            )}

            {/* Goal Setting Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Your Primary Goal
                </CardTitle>
                <CardDescription>
                  Set your main focus. Malunita will help align your tasks toward this goal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing || !profile?.current_goal ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="goal-input">What do you want to achieve?</Label>
                      <Input
                        id="goal-input"
                        placeholder="e.g., Launch my product, Get in shape, Finish certification"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeframe-select">Timeframe</Label>
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

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveGoal}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? "Saving..." : "Save Goal"}
                      </Button>
                      {profile?.current_goal && (
                        <Button
                          onClick={() => {
                            setGoal(profile.current_goal || "");
                            setTimeframe(profile.goal_timeframe || "this_week");
                            setIsEditing(false);
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            {timeframeLabel}
                          </p>
                          <p className="text-lg font-semibold">{profile.current_goal}</p>
                        </div>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="ghost"
                          size="sm"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Goal Progress</span>
                        <span className="font-semibold">{completedGoalTasks.length} / {totalGoalTasks} tasks completed</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {progressPercentage}% of goal-aligned tasks completed
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Tagging Interface */}
            {profile?.current_goal && (
              <TaskGoalTagging />
            )}

            {/* Goal-Aligned Tasks Summary */}
            {profile?.current_goal && completedGoalTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Completed Goal Tasks
                  </CardTitle>
                  <CardDescription>
                    Recent accomplishments toward your goal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedGoalTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-muted/30 rounded-lg border border-muted opacity-60"
                    >
                      <p className="font-medium text-sm line-through">{task.title}</p>
                      {task.alignment_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.alignment_reason}
                        </p>
                      )}
                    </div>
                  ))}
                  {completedGoalTasks.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      + {completedGoalTasks.length - 5} more completed
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{goalAlignedTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Active Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedGoalTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <CustomCategoryManager />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Goals;

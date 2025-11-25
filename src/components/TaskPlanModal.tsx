import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Edit2, Check } from 'lucide-react';

interface PlanStep {
  title: string;
  suggested_category: string;
  suggested_timeframe: string | null;
  is_tiny: boolean;
  parent_task_title?: string;
}

interface PlanResult {
  plan_title: string;
  overall_goal: string;
  estimated_load: 'light' | 'moderate' | 'heavy';
  steps: PlanStep[];
}

interface TaskPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanResult | null;
  isLoading: boolean;
  onConfirm: (planTitle: string, steps: PlanStep[]) => void;
}

export function TaskPlanModal({ 
  open, 
  onOpenChange, 
  plan, 
  isLoading, 
  onConfirm 
}: TaskPlanModalProps) {
  const [planTitle, setPlanTitle] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<Record<number, boolean>>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editedTitles, setEditedTitles] = useState<Record<number, string>>({});

  // Initialize when plan loads
  useEffect(() => {
    if (plan) {
      setPlanTitle(plan.plan_title);
      const allSelected = Object.fromEntries(
        plan.steps.map((_, i) => [i, true])
      );
      setSelectedSteps(allSelected);
    }
  }, [plan]);

  const handleToggleStep = (index: number) => {
    setSelectedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleEditStep = (index: number) => {
    setEditingStep(index);
    setEditedTitles(prev => ({
      ...prev,
      [index]: prev[index] || plan!.steps[index].title
    }));
  };

  const handleSaveEdit = (index: number) => {
    setEditingStep(null);
  };

  const handleConfirm = () => {
    if (!plan) return;

    const finalSteps = plan.steps
      .map((step, i) => ({
        ...step,
        title: editedTitles[i] || step.title
      }))
      .filter((_, i) => selectedSteps[i]);

    onConfirm(planTitle, finalSteps);
    onOpenChange(false);
  };

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'light': return 'bg-green-500/10 text-green-600';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-600';
      case 'heavy': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedCount = Object.values(selectedSteps).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Turn Tasks Into a Plan
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analyzing tasks and creating plan...</span>
          </div>
        ) : plan ? (
          <div className="space-y-4">
            {/* Plan title */}
            <div>
              <label className="text-sm font-medium mb-2 block">Plan Title</label>
              <Input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="Enter plan title..."
              />
            </div>

            {/* Plan metadata */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{plan.overall_goal}</Badge>
              <Badge className={getLoadColor(plan.estimated_load)}>
                {plan.estimated_load} load
              </Badge>
              <Badge variant="outline">{plan.steps.length} steps</Badge>
            </div>

            {/* Steps list */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {plan.steps.map((step, index) => {
                  const isEditing = editingStep === index;
                  const isSelected = selectedSteps[index];

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleStep(index)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editedTitles[index] || step.title}
                                onChange={(e) => setEditedTitles(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(index)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">
                                {editedTitles[index] || step.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStep(index)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {step.is_tiny && (
                              <Badge variant="secondary" className="text-xs">
                                Quick win
                              </Badge>
                            )}
                            {step.suggested_category && (
                              <Badge variant="outline" className="text-xs">
                                {step.suggested_category}
                              </Badge>
                            )}
                            {step.parent_task_title && (
                              <span className="text-xs text-muted-foreground">
                                from: {step.parent_task_title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedCount} of {plan.steps.length} steps selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={selectedCount === 0 || !planTitle.trim()}
                >
                  Create Plan
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No plan generated yet
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

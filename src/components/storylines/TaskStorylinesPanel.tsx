import { useState } from "react";
import { TaskStoryline } from "@/types/storylines";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { cn } from "@/lib/utils";

interface TaskStorylinesProps {
  storylines: TaskStoryline[];
  loading: boolean;
  onStorylineSelect?: (storylineId: string | null) => void;
  selectedStorylineId?: string | null;
}

const moodEmojis = {
  calm: '🌊',
  stressed: '⚡',
  momentum: '🚀',
  stuck: '🪨',
  playful: '🎨',
};

const moodColors = {
  calm: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  stressed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  momentum: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  stuck: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  playful: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
};

const energyIcons = {
  light: '○',
  medium: '◐',
  heavy: '●',
};

export function TaskStorylinesPanel({ 
  storylines, 
  loading,
  onStorylineSelect,
  selectedStorylineId,
}: TaskStorylinesProps) {
  const { onTaskCompleted } = useCompanionEvents();
  
  if (loading) {
    return (
      <div className="w-full mb-6 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Storylines
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card 
              key={i}
              className="p-4 bg-background/50 border-border/50 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-2 bg-muted rounded w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (storylines.length === 0) {
    return (
      <div className="w-full mb-6">
        <Card className="p-6 bg-background/30 border-border/30 text-center">
          <div className="text-sm text-muted-foreground">
            No storylines yet. Once you have a few tasks, I'll show you the arcs they belong to.
          </div>
        </Card>
      </div>
    );
  }
  
  const handleStorylineClick = (storyline: TaskStoryline) => {
    if (selectedStorylineId === storyline.id) {
      onStorylineSelect?.(null);
      return;
    }
    
    onStorylineSelect?.(storyline.id);
    
    // Trigger companion reaction based on progress
    if (storyline.progressPercent >= 70) {
      setTimeout(() => {
        onTaskCompleted?.();
      }, 300);
    }
  };
  
  const handleClearFilter = () => {
    onStorylineSelect?.(null);
  };
  
  return (
    <div className="w-full mb-6 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Storylines
          <Badge variant="secondary" className="ml-2 text-xs">
            {storylines.length} {storylines.length === 1 ? 'arc' : 'arcs'}
          </Badge>
        </h3>
        {selectedStorylineId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="text-xs h-7"
          >
            <X className="w-3 h-3 mr-1" />
            Show all
          </Button>
        )}
      </div>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {storylines.map(storyline => {
          const isSelected = selectedStorylineId === storyline.id;
          
          return (
            <Card
              key={storyline.id}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200",
                "bg-background/50 hover:bg-background/80 border-border/50",
                "hover:border-primary/50 hover:shadow-sm",
                isSelected && "ring-2 ring-primary bg-background/90 border-primary"
              )}
              onClick={() => handleStorylineClick(storyline)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {storyline.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs h-5", moodColors[storyline.mood])}
                    >
                      {moodEmojis[storyline.mood]} {storyline.mood}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {storyline.theme}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  {storyline.energyTag && (
                    <span className="text-xs text-muted-foreground" title={`${storyline.energyTag} load`}>
                      {energyIcons[storyline.energyTag]}
                    </span>
                  )}
                  {storyline.timeHorizon && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {storyline.timeHorizon.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {storyline.completedCount} / {storyline.taskCount} done
                  </span>
                  <span className="font-mono text-foreground">
                    {storyline.progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${storyline.progressPercent}%` }}
                  />
                </div>
              </div>
              
              {/* Suggested Next Step */}
              {storyline.suggestedNextStep && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {storyline.suggestedNextStep}
                  </p>
                </div>
              )}
              
              {/* Friction Note */}
              {storyline.frictionNote && (
                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                    ⚠️ {storyline.frictionNote}
                  </p>
                </div>
              )}
              
              {/* Last Activity */}
              <div className="mt-2 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  Last activity: {storyline.lastActivity}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

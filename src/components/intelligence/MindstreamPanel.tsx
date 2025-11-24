import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Target, Zap, TrendingUp, Brain, Activity, Lightbulb, FileText } from 'lucide-react';
import { useDailyMindstream } from '@/hooks/useDailyMindstream';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCompanionEvents } from '@/hooks/useCompanionEvents';

export function MindstreamPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const mindstream = useDailyMindstream();
  const companionEvents = useCompanionEvents();

  // Auto-collapse after 12 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastInteraction > 12000) {
        setIsOpen(false);
      }
    }, 12000);

    return () => clearTimeout(timer);
  }, [lastInteraction]);

  // Auto-expand each morning (detect day change)
  useEffect(() => {
    const lastShown = localStorage.getItem('mindstream_last_shown');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
      setIsOpen(true);
      localStorage.setItem('mindstream_last_shown', today);
    }
  }, []);

  // Companion reactions based on data
  useEffect(() => {
    if (mindstream.isLoading) return;

    if (mindstream.oneThing) {
      window.dispatchEvent(new CustomEvent('companion:reaction', {
        detail: { expression: 'determined', duration: 2000 }
      }));
    } else if (mindstream.quickWins.length > 0) {
      window.dispatchEvent(new CustomEvent('companion:reaction', {
        detail: { expression: 'happy', duration: 2000 }
      }));
    } else if (mindstream.cognitiveLoad.score > 70) {
      window.dispatchEvent(new CustomEvent('companion:reaction', {
        detail: { expression: 'concerned', duration: 2000 }
      }));
    } else if (mindstream.predictedHabits.length > 0) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
      const matchingHabit = mindstream.predictedHabits.find(h => h.time === currentTime);
      if (matchingHabit) {
        window.dispatchEvent(new CustomEvent('companion:reaction', {
          detail: { expression: 'excited', duration: 2000 }
        }));
      }
    }
  }, [mindstream.oneThing, mindstream.quickWins, mindstream.cognitiveLoad, mindstream.predictedHabits, mindstream.isLoading]);

  const handleInteraction = useCallback(() => {
    setLastInteraction(Date.now());
  }, []);

  if (mindstream.isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 mb-6 animate-fade-in">
        <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if we have any data to show
  const hasData = mindstream.oneThing || 
    mindstream.aiFocus || 
    mindstream.quickWins.length > 0 || 
    mindstream.predictedHabits.length > 0 || 
    mindstream.clusters.length > 0 || 
    mindstream.nudges.length > 0 || 
    mindstream.summaryMarkdown;

  if (!hasData) {
    return null;
  }

  return (
    <div 
      className="w-full max-w-4xl mx-auto px-4 mb-6 animate-fade-in"
      onMouseEnter={handleInteraction}
      onClick={handleInteraction}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg rounded-lg overflow-hidden">
          <CollapsibleTrigger className="w-full" onClick={handleInteraction}>
            <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold font-mono">Malunita Mindstream</h2>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-6 space-y-6 animate-fade-in">
              {/* Your One Thing */}
              {mindstream.oneThing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Your One Thing</h3>
                  </div>
                  <p className="text-foreground/90 pl-6">{mindstream.oneThing}</p>
                </div>
              )}

              {/* Today's Focus */}
              {mindstream.aiFocus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Today's Focus</h3>
                  </div>
                  <p className="text-foreground/90 pl-6">{mindstream.aiFocus}</p>
                </div>
              )}

              {/* Quick Wins */}
              {mindstream.quickWins.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Quick Wins</h3>
                  </div>
                  <div className="space-y-1 pl-6">
                    {mindstream.quickWins.map((win, i) => (
                      <div key={win.id || i} className="text-sm text-foreground/80">
                        • {win.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Habits */}
              {mindstream.predictedHabits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Predicted Habits</h3>
                  </div>
                  <div className="space-y-1 pl-6">
                    {mindstream.predictedHabits.slice(0, 3).map((habit, i) => (
                      <div key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{habit.time}</span>
                        <span>{habit.task}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {Math.round(habit.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Clusters */}
              {mindstream.clusters.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Task Clusters</h3>
                  </div>
                  <div className="space-y-2 pl-6">
                    {mindstream.clusters.slice(0, 3).map((cluster, i) => (
                      <div key={i} className="space-y-1">
                        <div className="font-medium text-sm">{cluster.label}</div>
                        <div className="text-xs text-muted-foreground">{cluster.theme}</div>
                        <div className="text-xs text-muted-foreground">
                          {cluster.tasks.length} task{cluster.tasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Energy & Load */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-mono text-sm font-semibold">Energy & Load</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Cognitive Load</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={mindstream.cognitiveLoad.level === 'HIGH' ? 'destructive' : mindstream.cognitiveLoad.level === 'MEDIUM' ? 'secondary' : 'outline'}>
                        {mindstream.cognitiveLoad.level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{mindstream.cognitiveLoad.score}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Emotional State</div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">Joy {mindstream.emotionalState.joy}</Badge>
                      <Badge variant="outline" className="text-xs">Stress {mindstream.emotionalState.stress}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nudges From Malunita */}
              {mindstream.nudges.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Nudges From Malunita</h3>
                  </div>
                  <div className="space-y-1 pl-6">
                    {mindstream.nudges.slice(0, 3).map((nudge, i) => (
                      <div key={i} className="text-sm text-foreground/80 italic">
                        "{nudge}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Summary */}
              {mindstream.summaryMarkdown && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-mono text-sm font-semibold">Mini Summary</h3>
                  </div>
                  <div className="text-sm text-foreground/80 pl-6 prose prose-sm max-w-none">
                    {mindstream.summaryMarkdown}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

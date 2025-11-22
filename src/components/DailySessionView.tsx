import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useDailySessions } from "@/hooks/useDailySessions";
import { DailySessionStart } from "@/components/DailySessionStart";
import { DailySessionSteps } from "@/components/DailySessionSteps";
import { DailySessionSummary } from "@/components/DailySessionSummary";
import { DailySessionHistory } from "@/components/DailySessionHistory";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'start' | 'morning' | 'evening' | 'summary' | 'history';

interface DailySessionViewProps {
  onClose: () => void;
}

export const DailySessionView = ({ onClose }: DailySessionViewProps) => {
  const { toast } = useToast();
  const { todaySession, sessions, isLoading, createSession, updateSession } = useDailySessions();
  const [viewMode, setViewMode] = useState<ViewMode>('start');
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (todaySession) {
        // Check if session is complete
        const hasReflection = todaySession.reflection_wins || todaySession.reflection_improve;
        if (todaySession.top_focus && hasReflection) {
          setViewMode('summary');
          setSelectedSession(todaySession);
        } else if (todaySession.top_focus && !hasReflection) {
          // Morning done, can do evening
          setViewMode('summary');
          setSelectedSession(todaySession);
        } else {
          // In progress
          setViewMode('morning');
        }
      }
    }
  }, [todaySession, isLoading]);

  const handleStart = async () => {
    try {
      const session = await createSession({});
      const hour = new Date().getHours();
      const isEvening = hour >= 18 || hour < 6;
      setViewMode(isEvening ? 'evening' : 'morning');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSession = async (updates: any) => {
    if (!todaySession) return;
    try {
      await updateSession({ id: todaySession.id, updates });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    setViewMode('summary');
    setSelectedSession(todaySession);
    toast({
      title: "Session complete",
      description: "Your daily session has been saved",
    });
  };

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    setViewMode('summary');
  };

  const handleBack = () => {
    if (viewMode === 'summary' && todaySession?.id === selectedSession?.id) {
      onClose();
    } else {
      setViewMode('start');
      setSelectedSession(null);
    }
  };

  const handleAddReflection = () => {
    if (todaySession) {
      setViewMode('evening');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-card rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-muted/50"
        >
          <X className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-light">Daily Session</h1>
          <p className="text-muted-foreground mt-1">
            Start your day with intention
          </p>
        </div>
      </div>

      {viewMode === 'start' && (
        <div className="space-y-8">
          <DailySessionStart onStart={handleStart} />
          {sessions && sessions.length > 0 && (
            <DailySessionHistory 
              sessions={sessions} 
              onViewSession={handleViewSession}
            />
          )}
        </div>
      )}

      {viewMode === 'morning' && todaySession && (
        <DailySessionSteps
          sessionId={todaySession.id}
          isEvening={false}
          onComplete={handleComplete}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {viewMode === 'evening' && todaySession && (
        <DailySessionSteps
          sessionId={todaySession.id}
          isEvening={true}
          onComplete={handleComplete}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {viewMode === 'summary' && selectedSession && (
        <div className="space-y-6">
          <DailySessionSummary
            session={selectedSession}
            onClose={handleBack}
          />
          
          {/* Add reflection button if morning done but no reflection yet */}
          {selectedSession.id === todaySession?.id && 
           selectedSession.top_focus && 
           !selectedSession.reflection_wins && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddReflection} variant="outline">
                Add Evening Reflection
              </Button>
            </div>
          )}

          {/* Show history below */}
          {sessions && sessions.length > 1 && (
            <div className="pt-8 border-t border-border/40">
              <DailySessionHistory 
                sessions={sessions.filter(s => s.id !== selectedSession.id)} 
                onViewSession={handleViewSession}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: 'feed' | 'inbox' | 'today' | 'journal';
  userName?: string;
  onAction?: (action: string) => void;
}

export function EmptyState({ type, userName = 'there', onAction }: EmptyStateProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  
  const states = {
    feed: {
      morning: {
        icon: '🌅',
        title: `Good ${greeting}, ${userName}`,
        message: "What's on your mind?",
        suggestions: [
          { text: "Set your ONE thing for today", action: "set-one-thing" },
          { text: "Review yesterday's entries", action: "review-yesterday" },
          { text: "Start a journal entry", action: "start-journal" }
        ]
      },
      afternoon: {
        icon: '☀️',
        title: `Hey ${userName}`,
        message: "Nothing captured yet today",
        suggestions: [
          { text: "How's your ONE thing going?", action: "check-one-thing" },
          { text: "Capture a quick thought", action: "quick-capture" },
          { text: "Check your inbox", action: "view-inbox" }
        ]
      },
      evening: {
        icon: '🌙',
        title: `Evening, ${userName}`,
        message: "How did today go?",
        suggestions: [
          { text: "Write a journal entry", action: "start-journal" },
          { text: "Review what you accomplished", action: "review-day" },
          { text: "Plan for tomorrow", action: "plan-tomorrow" }
        ]
      }
    },
    
    inbox: {
      default: {
        icon: '✨',
        title: "Inbox Zero!",
        message: "All clear. Nice work.",
        suggestions: []
      },
      hasStale: {
        icon: '🧹',
        title: "Time to organize",
        message: "You have some tasks that need attention",
        suggestions: [
          { text: "Move tasks to Today", action: "move-to-today" },
          { text: "Schedule for later", action: "schedule-later" },
          { text: "Archive what's not needed", action: "archive-tasks" }
        ]
      }
    },
    
    today: {
      default: {
        icon: '🎯',
        title: "Today is clear",
        message: "Add tasks or check your inbox",
        suggestions: [
          { text: "Set your ONE thing", action: "set-one-thing" },
          { text: "Pull from inbox", action: "view-inbox" },
          { text: "Review upcoming tasks", action: "view-upcoming" }
        ]
      }
    },
    
    journal: {
      default: {
        icon: '📓',
        title: "Start writing",
        message: "What's on your mind?",
        suggestions: [
          { text: "How are you feeling?", action: "prompt-feeling" },
          { text: "What went well today?", action: "prompt-wins" },
          { text: "What's challenging you?", action: "prompt-challenges" }
        ]
      }
    }
  };
  
  // Get the right state based on time and type
  const getState = () => {
    if (type === 'feed') {
      if (hour < 12) return states.feed.morning;
      if (hour < 18) return states.feed.afternoon;
      return states.feed.evening;
    }
    return states[type].default;
  };
  
  const state = getState();
  
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{state.icon}</div>
      <h3 className="empty-state-title">{state.title}</h3>
      <p className="empty-state-message">{state.message}</p>
      
      {state.suggestions.length > 0 && (
        <div className="empty-state-suggestions">
          <p className="text-sm text-muted-foreground mb-2">Try:</p>
          <ul className="space-y-2">
            {state.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 font-normal"
                  onClick={() => onAction?.(suggestion.action)}
                >
                  {suggestion.text}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

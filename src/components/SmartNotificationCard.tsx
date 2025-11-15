import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, X, Sparkles } from "lucide-react";
import { SmartNotification } from "@/hooks/useSmartNotifications";

interface SmartNotificationCardProps {
  notification: SmartNotification;
  onDismiss: (id: string) => void;
}

export const SmartNotificationCard = ({ notification, onDismiss }: SmartNotificationCardProps) => {
  const formatTime = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card className="p-4 bg-card border-border/40 hover:border-accent transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-light mb-1">{notification.title}</h4>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {notification.description}
          </p>

          {(notification.suggested_day || notification.suggested_time) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {notification.suggested_day && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{notification.suggested_day}</span>
                </div>
              )}
              {notification.suggested_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(notification.suggested_time)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={() => onDismiss(notification.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

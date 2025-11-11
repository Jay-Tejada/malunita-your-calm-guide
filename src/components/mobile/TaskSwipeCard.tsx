import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/hooks/useTasks";
import { ChevronUp } from "lucide-react";

interface TaskSwipeCardProps {
  task: Task;
  onToggle: () => void;
  onExpand: () => void;
}

export const TaskSwipeCard = ({ task, onToggle, onExpand }: TaskSwipeCardProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const { deltaY } = eventData;
      if (deltaY < 0) {
        setSwipeOffset(Math.max(deltaY, -100));
      }
    },
    onSwiped: (eventData) => {
      const { deltaY, velocity } = eventData;
      if (deltaY < -50 || velocity > 0.5) {
        onExpand();
      }
      setSwipeOffset(0);
    },
    trackTouch: true,
    trackMouse: false,
  });

  return (
    <div
      {...handlers}
      style={{
        transform: `translateY(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
    >
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1" onClick={onExpand}>
            <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </p>
            {task.context && (
              <p className="text-xs text-muted-foreground mt-1">{task.context}</p>
            )}
          </div>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
};

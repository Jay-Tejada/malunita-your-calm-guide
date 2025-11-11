import { TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TaskStreamProps {
  category: string;
  onClose: () => void;
}

export const TaskStream = ({ category, onClose }: TaskStreamProps) => {
  const getCategoryLabel = (cat: string) => {
    if (cat === "all") return "All Tasks";
    if (cat.startsWith("custom-")) return "Tasks";
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light text-foreground tracking-wide">
          {getCategoryLabel(category)}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <TaskList category={category} />
    </div>
  );
};

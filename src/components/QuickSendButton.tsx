import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface QuickSendButtonProps {
  taskId: string;
  taskTitle: string;
}

export function QuickSendButton({ taskId, taskTitle }: QuickSendButtonProps) {
  const { updateTask } = useTasks();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleQuickSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSending) return;
    
    setIsSending(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      
      await updateTask({
        id: taskId,
        updates: {
          is_focus: true,
          focus_date: today,
          scheduled_bucket: "today",
        },
      });

      toast({
        title: "Sent to Today",
        description: `"${taskTitle}" added to today's focus`,
      });
    } catch (error) {
      console.error("Failed to send task to today:", error);
      toast({
        title: "Failed to send task",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={handleQuickSend}
      disabled={isSending}
      size="sm"
      variant="ghost"
      className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Quick Send to Today"
    >
      <Send className="w-4 h-4" />
    </Button>
  );
}

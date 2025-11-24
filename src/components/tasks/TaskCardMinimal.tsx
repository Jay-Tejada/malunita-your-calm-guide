import { format, isToday, isTomorrow } from "date-fns";

interface TaskCardMinimalProps {
  task: {
    id: string;
    title: string;
    due_date?: string;
    section?: string;
  };
}

export function TaskCardMinimal({ task }: TaskCardMinimalProps) {
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return "Due Today";
    }
    
    if (isTomorrow(date)) {
      return "Due Tomorrow";
    }
    
    return format(date, "MMM d");
  };

  const dueDate = formatDueDate(task.due_date);

  return (
    <div
      className="w-full py-4 transition-opacity hover:opacity-75 cursor-pointer"
      style={{
        borderBottom: "1px solid #E6E1D7",
      }}
    >
      {/* Task Title */}
      <div
        className="font-medium mb-1"
        style={{
          color: "#3B352B",
          fontSize: "15px",
        }}
      >
        {task.title}
      </div>

      {/* Subtext: Due Date and Section */}
      {(dueDate || task.section) && (
        <div
          className="flex items-center gap-3"
          style={{
            color: "#7D7467",
            fontSize: "13px",
          }}
        >
          {dueDate && <span>{dueDate}</span>}
          {task.section && (
            <>
              {dueDate && <span>•</span>}
              <span>{task.section}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

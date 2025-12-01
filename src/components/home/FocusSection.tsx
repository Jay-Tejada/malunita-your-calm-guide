import { useTasks } from '@/hooks/useTasks';

export const FocusSection = () => {
  const { tasks } = useTasks();
  const focusTask = tasks?.find(t => t.is_focus && !t.completed);
  
  if (!focusTask) return null;
  
  return (
    <div className="text-center px-6">
      <p className="text-xl font-light text-foreground/60 font-mono leading-relaxed">
        {focusTask.title}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mt-3">
        Today's Main Focus
      </p>
    </div>
  );
};

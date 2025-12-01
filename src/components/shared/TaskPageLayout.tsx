import { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { TaskCaptureInput } from "./TaskCaptureInput";

interface TaskPageLayoutProps {
  title: string;
  placeholder?: string;
  category?: string;
  showCapture?: boolean;
  children: ReactNode;
}

export const TaskPageLayout = ({ 
  title, 
  placeholder = "Capture a thought...",
  category,
  showCapture = true,
  children 
}: TaskPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={title} />
      
      <div className="px-4 pt-16">
        {showCapture && (
          <div className="mb-4">
            <TaskCaptureInput 
              placeholder={placeholder} 
              category={category}
            />
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};

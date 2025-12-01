import { ReactNode } from "react";
import { SimpleHeader } from "@/components/SimpleHeader";

interface TaskPageLayoutProps {
  title: string;
  children: ReactNode;
}

export const TaskPageLayout = ({ title, children }: TaskPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <SimpleHeader title={title} />
      </div>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
};

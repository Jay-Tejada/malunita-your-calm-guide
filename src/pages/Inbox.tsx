import { useState } from "react";
import { TaskList } from "@/components/TaskList";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";


const Inbox = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">📥 Inbox</h1>
            <p className="text-muted-foreground mt-1">
              Uncategorized tasks waiting to be organized
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Inbox Actions */}
          {!isLoading && tasks && <InboxActions tasks={tasks} />}
          
          <TaskList category="inbox" />
        </div>
      </main>
    </div>
  );
};

export default Inbox;

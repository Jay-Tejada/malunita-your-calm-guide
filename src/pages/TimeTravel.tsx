import { TimeTravelView } from "@/features/timetravel/TimeTravelView";
import { SimpleHeader } from "@/components/SimpleHeader";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

export default function TimeTravel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 max-w-full">
        <SimpleHeader title="Time Travel" />
      </div>
      <main className="flex-1 container mx-auto px-4 py-6 max-w-full pb-20 md:pb-6">
        <div className="mb-4 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              hapticLight();
              navigate('/');
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold">⏳ Time Travel</h1>
          <p className="text-muted-foreground mt-1">
            Explore your tasks across time and space
          </p>
        </div>
        <div className="h-[calc(100vh-200px)] rounded-lg border border-border overflow-hidden">
          <TimeTravelView />
        </div>
      </main>
    </div>
  );
}

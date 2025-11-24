import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DailyIntelligence } from "./DailyIntelligence";
import { TaskStream } from "./TaskStream";

interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [quickWins, setQuickWins] = useState<Array<{ id: string; title: string }>>([]);

  // Fetch guidance message on mount
  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('daily-command-center', {
          body: { mode: 'home_screen' }
        });
        
        if (error) {
          console.error('Error fetching guidance:', error);
          return;
        }
        
        // Map response to state
        if (data) {
          setDailySummary(data.summary_markdown || null);
          setQuickWins(data.quick_wins || []);
        }
      } catch (error) {
        console.error('Failed to fetch guidance:', error);
      }
    };

    fetchGuidance();
  }, []);


  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <DailyIntelligence
          summary={dailySummary}
          quickWins={quickWins}
        />
        
        <TaskStream />
        
        {children}
      </div>
    </div>
  );
}



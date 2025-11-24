import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GuidanceBillboard } from "./GuidanceBillboard";
import { DailyIntelligence } from "./DailyIntelligence";
import { TaskStream } from "./TaskStream";

interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  const [billboardMessage, setBillboardMessage] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [quickWins, setQuickWins] = useState<Array<{ id: string; title: string }>>([]);
  const [focusSuggestion, setFocusSuggestion] = useState<string | null>(null);

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
          const message = data.headline || data.focus_message;
          if (message) {
            setBillboardMessage(message);
          }
          
          setDailySummary(data.summary_markdown || null);
          setQuickWins(data.quick_wins || []);
          setFocusSuggestion(data.focus_message || null);
        }
      } catch (error) {
        console.error('Failed to fetch guidance:', error);
      }
    };

    fetchGuidance();
  }, []);

  // Auto-clear billboard after 4 seconds
  useEffect(() => {
    if (!billboardMessage) return;
    
    const timer = setTimeout(() => {
      setBillboardMessage(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [billboardMessage]);

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      {billboardMessage && (
        <div className="flex justify-center mb-6">
          <GuidanceBillboard message={billboardMessage} />
        </div>
      )}
      
      <div className="max-w-4xl mx-auto space-y-6">
        <DailyIntelligence
          summary={dailySummary}
          quickWins={quickWins}
        />
        
        <TaskStream />
      </div>
      
      {children}
    </div>
  );
}



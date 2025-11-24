import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GuidanceBillboard } from "./GuidanceBillboard";
import { TaskStream } from "./TaskStream";

interface HomeCanvasProps {
  children?: React.ReactNode;
}

export function HomeCanvas({ children }: HomeCanvasProps) {
  const [billboardMessage, setBillboardMessage] = useState<string | null>(null);

  // Fetch guidance message on mount
  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('suggest-focus');
        if (error) {
          console.error('Error fetching guidance:', error);
          return;
        }
        if (data?.message) {
          setBillboardMessage(data.message);
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
    <div className="w-full h-full overflow-y-auto flex flex-col items-center p-6 md:p-10" style={{ gap: "20px" }}>
      {billboardMessage && <GuidanceBillboard message={billboardMessage} />}
      
      <TaskStream />
      
      {children}
    </div>
  );
}



import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type GuidanceBillboardProps = {
  message: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  useDeepReasoning?: boolean; // Enable deep reasoning for morning guidance
};

export function GuidanceBillboard({ 
  message, 
  subtitle, 
  ctaLabel, 
  onCtaClick,
  useDeepReasoning = false
}: GuidanceBillboardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [enhancedMessage, setEnhancedMessage] = useState(message);

  useEffect(() => {
    // Apply DEEP REASONING on mornings if enabled
    const applyDeepReasoning = async () => {
      if (!useDeepReasoning) return;
      
      const hour = new Date().getHours();
      const isMorning = hour >= 6 && hour < 12;
      
      if (!isMorning) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const reasoningInput = `Generate a deep, thoughtful morning guidance message.

Current message: "${message}"
${subtitle ? `Subtitle: "${subtitle}"` : ''}

What is a more insightful, strategic version that helps the user start their day with clarity?`;

        const { data: deepData, error: deepError } = await supabase.functions.invoke('long-reasoning', {
          body: {
            input: reasoningInput,
            context: {
              timeOfDay: 'morning',
              currentMessage: message,
              hasSubtitle: !!subtitle
            }
          }
        });

        if (!deepError && deepData?.final_answer) {
          setEnhancedMessage(deepData.final_answer);
          console.log('✨ Deep reasoning applied to guidance billboard');
        }
      } catch (error) {
        console.error('Error applying deep reasoning to guidance:', error);
      }
    };

    applyDeepReasoning();
  }, [message, subtitle, useDeepReasoning]);

  useEffect(() => {
    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Check if rich content is provided
  const hasRichContent = subtitle || ctaLabel;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full px-4"
        >
          <div
            style={{
              backgroundColor: "#F8F4EC",
              color: "#3D3325",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            className={`px-6 py-4 ${hasRichContent ? 'flex items-center justify-between gap-4' : 'text-center'}`}
          >
            <div className={hasRichContent ? 'flex-1' : ''}>
              <p className="text-sm font-semibold">{enhancedMessage}</p>
              {subtitle && (
                <p 
                  style={{ 
                    color: "#7D7467", 
                    fontSize: "13px" 
                  }}
                  className="mt-1"
                >
                  {subtitle}
                </p>
              )}
            </div>
            
            {ctaLabel && onCtaClick && (
              <button
                onClick={onCtaClick}
                style={{
                  backgroundColor: "#E5D7C2",
                  borderRadius: "999px",
                  padding: "6px 10px",
                  fontSize: "13px",
                  color: "#3D3325",
                  fontWeight: 500,
                }}
                className="transition-all hover:brightness-90 whitespace-nowrap"
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

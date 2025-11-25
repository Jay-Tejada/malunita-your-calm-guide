import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface MicroSuggestionsResult {
  steps: string[];
}

export const useMicroSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const generateSuggestions = async (taskTitle: string, taskContext?: string | null) => {
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate suggestions.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke<MicroSuggestionsResult>(
        'suggest-micro-steps',
        {
          body: {
            taskTitle,
            taskContext: taskContext || undefined,
          }
        }
      );

      if (error) {
        console.error('Error generating micro-suggestions:', error);
        
        // Handle specific error cases
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
          toast({
            title: "Payment required",
            description: "Please add credits to your workspace.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to generate suggestions. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.steps && Array.isArray(data.steps)) {
        setSuggestions(data.steps);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    isLoading,
    generateSuggestions,
    clearSuggestions,
  };
};

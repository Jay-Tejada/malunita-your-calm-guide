import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Check } from "lucide-react";

const MODEL_INFO = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    description: 'Fast and affordable',
    speed: 'Fastest',
    cost: 'Lowest',
  },
  'gpt-4': {
    name: 'GPT-4',
    description: 'Most capable, slower',
    speed: 'Slower',
    cost: 'Higher',
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    description: 'Best balance of speed and quality',
    speed: 'Fast',
    cost: 'Moderate',
  },
  'gpt-4o': {
    name: 'GPT-4o',
    description: 'Latest optimized model',
    speed: 'Fast',
    cost: 'Moderate',
  },
};

export const ModelSelector = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(
    profile?.preferred_gpt_model || 'gpt-4-turbo'
  );

  const currentModel = profile?.preferred_gpt_model || 'gpt-4-turbo';
  const modelInfo = MODEL_INFO[currentModel as keyof typeof MODEL_INFO];

  const handleModelChange = async (newModel: string) => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ preferred_gpt_model: newModel })
        .eq('id', user.id);

      if (error) throw error;

      setSelectedModel(newModel);
      
      toast({
        title: "Model updated ✅",
        description: `Now using ${MODEL_INFO[newModel as keyof typeof MODEL_INFO].name}`,
      });
    } catch (error: any) {
      console.error('Error updating model:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update model",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-light">AI Model</h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{modelInfo?.name}</span>
            <Check className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">{modelInfo?.description}</p>
          <div className="flex gap-4 text-xs">
            <span>Speed: <span className="text-foreground">{modelInfo?.speed}</span></span>
            <span>Cost: <span className="text-foreground">{modelInfo?.cost}</span></span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Switch Model</label>
          <Select
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-3.5-turbo">
                <div className="flex flex-col items-start">
                  <span>GPT-3.5 Turbo</span>
                  <span className="text-xs text-muted-foreground">Fast & affordable</span>
                </div>
              </SelectItem>
              <SelectItem value="gpt-4">
                <div className="flex flex-col items-start">
                  <span>GPT-4</span>
                  <span className="text-xs text-muted-foreground">Most capable</span>
                </div>
              </SelectItem>
              <SelectItem value="gpt-4-turbo">
                <div className="flex flex-col items-start">
                  <span>GPT-4 Turbo</span>
                  <span className="text-xs text-muted-foreground">Best balance (recommended)</span>
                </div>
              </SelectItem>
              <SelectItem value="gpt-4o">
                <div className="flex flex-col items-start">
                  <span>GPT-4o</span>
                  <span className="text-xs text-muted-foreground">Latest optimized</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          Changes apply to task extraction, focus suggestions, and chat responses.
        </p>
      </div>
    </Card>
  );
};

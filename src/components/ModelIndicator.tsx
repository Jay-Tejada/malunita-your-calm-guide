import { useProfile } from "@/hooks/useProfile";
import { Sparkles } from "lucide-react";

const MODEL_DISPLAY = {
  'gpt-3.5-turbo': 'GPT-3.5',
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4o': 'GPT-4o',
};

export const ModelIndicator = () => {
  const { profile } = useProfile();
  const currentModel = profile?.preferred_gpt_model || 'gpt-4-turbo';
  const displayName = MODEL_DISPLAY[currentModel];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground border border-border/50">
        <Sparkles className="w-3 h-3" />
        <span>GPT: {displayName}</span>
      </div>
    </div>
  );
};

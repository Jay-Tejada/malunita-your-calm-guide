import { Heart } from "lucide-react";
import { useBondingMeter } from "@/hooks/useBondingMeter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const BondingMeter = () => {
  const { bonding, isLoading } = useBondingMeter();

  if (isLoading) return null;

  const { score, tier } = bonding;
  const progress = ((score - tier.minScore) / (tier.maxScore - tier.minScore)) * 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-border shadow-sm">
            <Heart
              className="w-4 h-4 transition-colors"
              style={{ color: tier.color }}
              fill={tier.color}
            />
            <div className="flex flex-col gap-1 min-w-[80px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: tier.color }}>
                  {tier.name}
                </span>
                <span className="text-muted-foreground">{score}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    backgroundColor: tier.color,
                    width: `${Math.min(progress, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-medium mb-1">{tier.description}</p>
          <p className="text-xs text-muted-foreground">
            Your bond grows when you take care of yourself and spend time with Malunita.
          </p>
          <div className="mt-2 text-xs">
            <p className="font-medium mb-1">Unlocked:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {tier.unlocks.map((unlock, idx) => (
                <li key={idx}>{unlock}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

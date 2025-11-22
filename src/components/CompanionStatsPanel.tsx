import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanionStatsPanelProps {
  emotion: string;
  reactionState: string;
  stage: number;
  stageName: string;
  xp: number;
  progressToNextStage: number;
  audioLevel: number;
  onClose: () => void;
}

export const CompanionStatsPanel = ({
  emotion,
  reactionState,
  stage,
  stageName,
  xp,
  progressToNextStage,
  audioLevel,
  onClose,
}: CompanionStatsPanelProps) => {
  return (
    <Card className="absolute top-4 right-4 w-64 shadow-lg border-border/50 backdrop-blur-sm bg-card/95 animate-in slide-in-from-right duration-300 z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Companion Stats
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Emotion:</span>
            <span className="font-medium capitalize">{emotion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">State:</span>
            <span className="font-medium capitalize">{reactionState}</span>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stage:</span>
            <span className="font-medium">{stage}: {stageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">XP:</span>
            <span className="font-medium">{xp} XP</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">{Math.round(progressToNextStage * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressToNextStage * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Audio Level:</span>
            <span className="font-medium">{Math.round(audioLevel * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

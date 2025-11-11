import { Home, Briefcase, Dumbbell, FolderKanban, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FolderPrediction {
  category: string;
  confidence: number;
  reason: string;
}

interface FolderSuggestionProps {
  open: boolean;
  taskText: string;
  predictions: FolderPrediction[];
  onSelectFolder: (category: string) => void;
  onKeepInInbox: () => void;
}

const FOLDER_ICONS: Record<string, React.ComponentType<any>> = {
  inbox: Inbox,
  home: Home,
  work: Briefcase,
  gym: Dumbbell,
  projects: FolderKanban,
};

export const FolderSuggestion = ({
  open,
  taskText,
  predictions,
  onSelectFolder,
  onKeepInInbox,
}: FolderSuggestionProps) => {
  // Filter out inbox from predictions and take top 3
  const topPredictions = predictions
    .filter(p => p.category !== 'inbox')
    .slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onKeepInInbox()}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-base lowercase text-foreground">
            should this go in a specific folder?
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-foreground/60 lowercase">
            "{taskText}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          {topPredictions.map((prediction, index) => {
            const Icon = FOLDER_ICONS[prediction.category] || Inbox;
            const confidencePercent = Math.round(prediction.confidence * 100);
            
            return (
              <Button
                key={prediction.category}
                variant="outline"
                onClick={() => onSelectFolder(prediction.category)}
                className="w-full justify-start gap-3 h-auto py-3 px-4 border-border hover:bg-foreground/5 transition-colors font-mono"
              >
                <Icon className="w-4 h-4 shrink-0 text-foreground" />
                <div className="flex flex-col items-start text-left flex-1">
                  <span className="text-sm font-medium lowercase text-foreground">
                    {prediction.category}
                  </span>
                  <span className="text-xs text-foreground/50 lowercase">
                    {prediction.reason}
                  </span>
                </div>
                <span className="text-xs text-foreground/40 font-mono">
                  {confidencePercent}%
                </span>
              </Button>
            );
          })}
          
          <Button
            variant="ghost"
            onClick={onKeepInInbox}
            className="w-full mt-2 font-mono lowercase text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          >
            keep in inbox
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

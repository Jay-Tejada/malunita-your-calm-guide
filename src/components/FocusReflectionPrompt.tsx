import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FocusReflectionPromptProps {
  focusTask: string;
  onSubmit: (outcome: 'done' | 'partial' | 'missed', note?: string) => Promise<void>;
  onDismiss: () => void;
}

export const FocusReflectionPrompt = ({ 
  focusTask, 
  onSubmit, 
  onDismiss 
}: FocusReflectionPromptProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'done' | 'partial' | 'missed' | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOutcomeClick = (outcome: 'done' | 'partial' | 'missed') => {
    setSelectedOutcome(outcome);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedOutcome) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedOutcome, note.trim() || undefined);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Minimal prompt */}
      <div className="flex items-start gap-2 mb-6 group">
        <button
          onClick={onDismiss}
          className="mt-0.5 p-1 hover:bg-muted/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Dismiss"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            Yesterday's focus: <span className="text-foreground font-medium">{focusTask}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOutcomeClick('done')}
              className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => handleOutcomeClick('partial')}
              className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
            >
              Made progress
            </button>
            <button
              onClick={() => handleOutcomeClick('missed')}
              className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
            >
              Didn't get to it
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">How did it go?</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              {selectedOutcome === 'done' && "Great job! 🎉"}
              {selectedOutcome === 'partial' && "Progress is progress! 💪"}
              {selectedOutcome === 'missed' && "That's okay, tomorrow's a new day"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-mono text-muted-foreground">
                Any notes? (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What went well? What could be better?"
                className="font-mono text-sm resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

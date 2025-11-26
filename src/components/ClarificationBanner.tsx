import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ClarificationBannerProps {
  question: string;
  type: 'deadline' | 'category' | 'project' | 'priority' | 'agenda';
  onAnswer: (answer: string) => void;
  onDismiss: () => void;
}

const getQuickReplies = (type: string): string[] => {
  switch (type) {
    case 'deadline':
      return ['Today', 'Tomorrow', 'This week'];
    case 'category':
      return ['Work', 'Personal', 'Home'];
    case 'priority':
      return ['Must do', 'Should do', 'Nice to have'];
    case 'project':
      return ['Yes', 'No'];
    case 'agenda':
      return ['Yes', 'Not yet'];
    default:
      return [];
  }
};

export function ClarificationBanner({ question, type, onAnswer, onDismiss }: ClarificationBannerProps) {
  const quickReplies = getQuickReplies(type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-sm text-foreground flex-1">{question}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-6 w-6 shrink-0 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="secondary"
                size="sm"
                onClick={() => onAnswer(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

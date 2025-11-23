import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HelperBubbleProps {
  message: string | null;
  onDismiss?: () => void;
}

export const HelperBubble = ({ message, onDismiss }: HelperBubbleProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      
      // Auto-dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onDismiss?.();
        }, 300); // Wait for exit animation
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute -top-6 right-0 bg-background/90 backdrop-blur-sm shadow-lg rounded-2xl px-4 py-2 text-sm max-w-[220px] border border-primary/20 z-50"
        >
          <div className="relative">
            <p className="text-foreground font-medium">{message}</p>
            
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-3 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-background/90" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Message queue manager
class MessageQueue {
  private queue: string[] = [];
  private isProcessing = false;
  private onMessageChange: (message: string | null) => void;

  constructor(onMessageChange: (message: string | null) => void) {
    this.onMessageChange = onMessageChange;
  }

  enqueue(message: string) {
    this.queue.push(message);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.onMessageChange(null);
      return;
    }

    this.isProcessing = true;
    const message = this.queue.shift()!;
    this.onMessageChange(message);

    // Wait for bubble to dismiss (3.5s display + 0.3s animation)
    setTimeout(() => {
      this.processNext();
    }, 3800);
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
    this.onMessageChange(null);
  }

  get length() {
    return this.queue.length;
  }
}

export const createMessageQueue = (onMessageChange: (message: string | null) => void) => {
  return new MessageQueue(onMessageChange);
};

// Helper messages based on mood
export const MOOD_MESSAGES: Record<string, string> = {
  loving: "I'm so happy to see you! 💛",
  excited: "Yes!! Let's do this! 🎉",
  worried: "Maybe start with one small step?",
  sleepy: "I'm a little tired…",
  overjoyed: "This is amazing! ✨",
  concerned: "Is everything okay?",
  surprised: "Oh! What's happening?",
  surprised2: "Whoa! You surprised me!",
  welcoming: "Hey there! Ready to go?",
  happy: "Feeling good today! 😊",
  neutral: "What should we do next?",
};

// Action-based messages
export const ACTION_MESSAGES = {
  taskCompleted: "Great job ✨",
  taskCreated: "Added to your list!",
  inactivityNudge: "Want help planning something?",
  morningGreeting: "Good morning! Let's make today great!",
  eveningGreeting: "How was your day?",
  goalSet: "I'll help you reach that goal!",
  streakMilestone: "You're on fire! 🔥",
};

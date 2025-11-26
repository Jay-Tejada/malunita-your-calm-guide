import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PersonalFeedMessageProps {
  insight: string;
  pattern: string | null;
  flashback: string | null;
  show: boolean;
}

export function PersonalFeedMessage({ insight, pattern, flashback, show }: PersonalFeedMessageProps) {
  const messages = [insight, pattern, flashback].filter(Boolean);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            className="relative max-w-md mx-4 p-6 bg-background/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-primary/20"
            initial={{ boxShadow: "0 0 0 0 rgba(247, 217, 141, 0)" }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(247, 217, 141, 0)",
                "0 0 30px 5px rgba(247, 217, 141, 0.2)",
                "0 0 0 0 rgba(247, 217, 141, 0)",
              ],
            }}
            transition={{ duration: 2, repeat: 2, ease: "easeInOut" }}
          >
            {/* Sparkle icon */}
            <motion.div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>

            {/* Content */}
            <div className="space-y-3 mt-4">
              {messages.map((message, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}
                  className="text-sm text-foreground/90 leading-relaxed"
                >
                  {message}
                </motion.p>
              ))}
            </div>

            {/* Bottom gradient accent */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
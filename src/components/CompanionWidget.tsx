import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { MessageCircle, Settings, TrendingUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompanionWidgetProps {
  onTalkToMalunita?: () => void;
  onCompanionSettings?: () => void;
}

export function CompanionWidget({
  onTalkToMalunita,
  onCompanionSettings,
}: CompanionWidgetProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Companion Dock - Small Avatar Bottom Right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsPanelOpen(true)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border-2 border-primary/20 shadow-lg hover:scale-110 transition-all hover:shadow-xl group"
          title="Talk to Malunita"
        >
          <div className="absolute inset-2">
            <CompanionAvatar mode="idle" />
          </div>
          {/* Subtle breathing animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </button>
      </motion.div>

      {/* Companion Panel - Slides up from bottom-right */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 100, x: 100 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12">
                    <CompanionAvatar mode="idle" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Malunita</h3>
                    <p className="text-xs text-muted-foreground">Your companion</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsPanelOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <Button
                  onClick={() => {
                    onTalkToMalunita?.();
                    setIsPanelOpen(false);
                  }}
                  variant="secondary"
                  className="w-full justify-start gap-3 h-12"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Talk to Malunita</span>
                </Button>

                <Button
                  onClick={() => {
                    navigate("/weekly-insights");
                    setIsPanelOpen(false);
                  }}
                  variant="secondary"
                  className="w-full justify-start gap-3 h-12"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Insights & Suggestions</span>
                </Button>

                <Button
                  onClick={() => {
                    onCompanionSettings?.();
                    setIsPanelOpen(false);
                  }}
                  variant="secondary"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Settings className="w-5 h-5" />
                  <span>Companion Settings</span>
                </Button>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/30">
                <p className="text-xs text-center text-muted-foreground">
                  Tap to chat or get personalized insights
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

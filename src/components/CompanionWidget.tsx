import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Settings, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompanionWidgetProps {
  onTalkToMalunita?: () => void;
  onCompanionSettings?: () => void;
}

export function CompanionWidget({
  onTalkToMalunita,
  onCompanionSettings,
}: CompanionWidgetProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Companion Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="relative w-20 h-20 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-lg hover:shadow-xl transition-all hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <CompanionAvatar mode="idle" />
          </div>
        </button>
      </motion.div>

      {/* Radial Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-28 right-6 z-50 bg-card border border-border rounded-[10px] shadow-xl p-2 min-w-[200px]"
            >
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onTalkToMalunita?.();
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Talk to Malunita
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/weekly-insights");
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Insights & Suggestions
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onCompanionSettings?.();
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Companion Settings
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

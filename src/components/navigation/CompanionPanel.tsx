import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Star, Egg } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCompanionIdentity } from "@/hooks/useCompanionIdentity";
import { useLevelSystem } from "@/state/levelSystem";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { useNavigate } from "react-router-dom";

interface CompanionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanionPanel = ({ isOpen, onClose }: CompanionPanelProps) => {
  const { companion } = useCompanionIdentity();
  const { xp, level, nextLevelXp, evolutionStage } = useLevelSystem();
  const navigate = useNavigate();

  const xpProgress = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[70%] z-50 overflow-y-auto shadow-2xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(36 40% 94%) 100%)",
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
              <h2 
                className="text-xl font-semibold text-foreground"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Companion Universe
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Companion Display */}
            <div className="flex flex-col items-center p-8 space-y-6">
              {/* Companion Character */}
              <div className="relative flex items-center justify-center">
                <div className="w-48 md:w-64">
                  <CompanionAvatar mode="idle" />
                </div>
              </div>

              {/* Name */}
              {companion?.name && (
                <h3 
                  className="text-2xl font-semibold text-foreground"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {companion.name}
                </h3>
              )}

              {/* Stats Card */}
              <div className="w-full max-w-md bg-card rounded-2xl p-6 shadow-malunita-card space-y-4">
                {/* Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-orb-amber" fill="hsl(var(--orb-amber))" />
                    <span 
                      className="text-sm font-medium text-foreground"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Level {level}
                    </span>
                  </div>
                  <span 
                    className="text-xs text-foreground-soft"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Stage {evolutionStage}
                  </span>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-foreground-soft">
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>XP</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {xp} / {nextLevelXp}
                    </span>
                  </div>
                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* Bonding */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-destructive" fill="hsl(var(--destructive))" />
                    <span 
                      className="text-sm font-medium text-foreground"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Bond
                    </span>
                  </div>
                  <span 
                    className="text-xs text-foreground-soft"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Growing
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-md space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/hatching-gallery");
                    onClose();
                  }}
                >
                  <Egg className="w-4 h-4 mr-2" />
                  View Growth Moments
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/customization");
                    onClose();
                  }}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

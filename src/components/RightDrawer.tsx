import { motion, AnimatePresence } from "framer-motion";
import { CompanionAvatar } from "@/components/companion/CompanionAvatar";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Globe, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightDrawer = ({ isOpen, onClose }: RightDrawerProps) => {
  const { xp, stage, stageConfig, progressToNextStage, addXp } = useCompanionGrowth();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-md border-l border-border/50 shadow-2xl z-50"
          >
            <div className="h-full flex flex-col py-8 px-6">
              {/* Companion Visual - COMMENTED OUT - now lives in CompanionSidebar */}
              {/* <div className="flex-shrink-0 flex justify-center mb-6">
                <CompanionAvatar mode="idle" />
              </div> */}

              {/* Stats Section */}
              <div className="flex-shrink-0 space-y-4 mb-6">
                <div className="text-center">
                  <p className="text-xs font-mono text-foreground/60 uppercase tracking-wider mb-1">
                    Stage {stage}
                  </p>
                  <h3 className="text-lg font-mono font-medium">{stageConfig.name}</h3>
                </div>

                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-foreground/60">XP</span>
                    <span className="text-foreground/80">{xp} / {stageConfig.maxXp === Infinity ? '∞' : stageConfig.maxXp}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNextStage * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Test XP Button */}
                <Button
                  onClick={() => addXp(10, "Test XP")}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  Feed XP (+10)
                </Button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex-1 space-y-2">
                <Button
                  onClick={() => handleNavigate("/customization")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Palette className="w-4 h-4 mr-3" />
                  Customize
                </Button>
                <Button
                  onClick={() => handleNavigate("/ambient-worlds")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Globe className="w-4 h-4 mr-3" />
                  Worlds
                </Button>
                <Button
                  onClick={() => handleNavigate("/notifications")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
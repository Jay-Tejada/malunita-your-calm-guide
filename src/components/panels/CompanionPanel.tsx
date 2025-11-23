import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCompanionIdentity } from "@/hooks/useCompanionIdentity";
import { CompanionVisual } from "@/components/CompanionVisual";
import { useLevelSystem } from "@/state/levelSystem";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CompanionPanelProps {
  onClose: () => void;
}

export const CompanionPanel: React.FC<CompanionPanelProps> = ({ onClose }) => {
  const { companion } = useCompanionIdentity();
  const { level, xp, nextLevelXp, evolutionStage } = useLevelSystem();

  const xpProgress = (xp / nextLevelXp) * 100;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-[70%] md:w-[450px] bg-gradient-to-br from-amber-50 to-card border-l border-border/30 shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 p-6 z-10">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-lg font-medium text-foreground">
            {companion?.name || "Companion"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Companion Visual */}
      <div className="flex items-center justify-center py-12">
        <div className="scale-110">
          <CompanionVisual size="lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pb-6 space-y-6">
        {/* XP Bar */}
        <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-foreground/70">Level {level}</span>
          <span className="text-foreground-soft">{xp} / {nextLevelXp} XP</span>
        </div>
          <Progress value={xpProgress} className="h-2" />
        </div>

        {/* Evolution Stage */}
        <div className="bg-card rounded-lg p-4 border border-border/30">
          <p className="text-sm font-mono text-foreground/70 mb-1">Evolution Stage</p>
          <p className="text-lg font-mono font-medium text-foreground">
            Stage {evolutionStage}
          </p>
        </div>

        {/* Personality Type */}
        {companion?.personalityType && (
          <div className="bg-card rounded-lg p-4 border border-border/30">
            <p className="text-sm font-mono text-foreground/70 mb-1">Personality</p>
            <p className="text-lg font-mono font-medium text-foreground capitalize">
              {companion.personalityType}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full font-mono"
            onClick={onClose}
          >
            View Stats
          </Button>
          <Button 
            variant="outline" 
            className="w-full font-mono"
            onClick={onClose}
          >
            Customize
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

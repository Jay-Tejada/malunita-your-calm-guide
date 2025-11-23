import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { TasksPanel } from "./panels/TasksPanel";
import { CompanionPanel } from "./panels/CompanionPanel";
import { InsightsPanel } from "./panels/InsightsPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { PlanetIcon } from "./PlanetIcon";

type PanelType = "none" | "tasks" | "companion" | "insights" | "settings";

export const OrbitalHome = () => {
  const [activePanel, setActivePanel] = useState<PanelType>("none");

  const openPanel = (panel: PanelType) => {
    setActivePanel(panel);
  };

  const closePanel = () => {
    setActivePanel("none");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#F7F2E8]">
      {/* Dimmed overlay when panels are open */}
      <AnimatePresence>
        {activePanel !== "none" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={closePanel}
          />
        )}
      </AnimatePresence>

      {/* Central Capture Orb */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-6">
          {/* Large Glowing Orb */}
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Outer glow layers */}
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-amber-300/40 via-amber-200/20 to-transparent blur-2xl scale-150" />
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-amber-300/30 via-amber-200/15 to-transparent blur-xl scale-125" />
            
            {/* Main orb */}
            <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-2xl">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 opacity-80" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-100 via-amber-100 to-amber-200 opacity-60" />
              
              {/* Inner sparkle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-600/40" />
              </div>
            </div>
          </motion.div>

          {/* Text below orb */}
          <p className="font-mono text-sm md:text-base text-foreground/70 tracking-wide">
            What's on your mind?
          </p>
        </div>
      </div>

      {/* Four Planet Icons - Positioned at Cardinal Directions */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {/* TOP Planet (North) - Insights */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <PlanetIcon
            position="top"
            onClick={() => openPanel("insights")}
            isActive={activePanel === "insights"}
          />
        </div>

        {/* RIGHT Planet (East) - Companion */}
        <div className="absolute top-1/2 right-24 -translate-y-1/2 pointer-events-auto">
          <PlanetIcon
            position="right"
            onClick={() => openPanel("companion")}
            isActive={activePanel === "companion"}
          />
        </div>

        {/* BOTTOM Planet (South) - Settings */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto">
          <PlanetIcon
            position="bottom"
            onClick={() => openPanel("settings")}
            isActive={activePanel === "settings"}
          />
        </div>

        {/* LEFT Planet (West) - Tasks */}
        <div className="absolute top-1/2 left-24 -translate-y-1/2 pointer-events-auto">
          <PlanetIcon
            position="left"
            onClick={() => openPanel("tasks")}
            isActive={activePanel === "tasks"}
          />
        </div>
      </div>

      {/* Slide-in Panels */}
      <AnimatePresence mode="wait">
        {activePanel === "tasks" && (
          <TasksPanel key="tasks" onClose={closePanel} />
        )}
        {activePanel === "companion" && (
          <CompanionPanel key="companion" onClose={closePanel} />
        )}
        {activePanel === "insights" && (
          <InsightsPanel key="insights" onClose={closePanel} />
        )}
        {activePanel === "settings" && (
          <SettingsPanel key="settings" onClose={closePanel} />
        )}
      </AnimatePresence>
    </div>
  );
};

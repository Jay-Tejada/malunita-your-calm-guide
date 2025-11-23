import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Check } from "lucide-react";
import { AMBIENT_WORLDS, WorldId } from "./worldDefinitions";
import { useAmbientWorld } from "@/hooks/useAmbientWorld";
import { motion } from "framer-motion";

export const WorldSelector = () => {
  const { currentWorld, unlockedWorlds, setWorld, level } = useAmbientWorld();

  const worldOrder: WorldId[] = ['cozy-room', 'forest-clearing', 'pastel-meadow', 'crystal-nebula', 'minimalist-studio'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Environment</h2>
        <p className="text-muted-foreground">
          Unlock new worlds by leveling up your companion
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worldOrder.map((worldId) => {
          const world = AMBIENT_WORLDS[worldId];
          const isUnlocked = unlockedWorlds.some(w => w.id === worldId);
          const isSelected = currentWorld === worldId;

          return (
            <motion.div
              key={worldId}
              whileHover={isUnlocked ? { scale: 1.02 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                } ${!isUnlocked ? 'opacity-60' : ''}`}
                onClick={() => isUnlocked && setWorld(worldId)}
              >
                <CardContent className="p-6">
                  {/* Preview thumbnail */}
                  <div 
                    className="relative w-full h-32 rounded-lg mb-4 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${world.colors.primary}, ${world.colors.secondary})`,
                    }}
                  >
                    {/* Locked overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    {/* Interaction indicator */}
                    {world.hasIdleInteraction && isUnlocked && (
                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-2 left-2 text-xs"
                      >
                        Interactive
                      </Badge>
                    )}
                  </div>

                  {/* World info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{world.name}</h3>
                      {!isUnlocked && (
                        <Badge variant="outline" className="text-xs">
                          Level {world.unlockLevel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {world.description}
                    </p>
                  </div>

                  {/* Select button */}
                  {isUnlocked && (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full mt-4"
                      onClick={() => setWorld(worldId)}
                    >
                      {isSelected ? "Current World" : "Select"}
                    </Button>
                  )}

                  {!isUnlocked && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4"
                      disabled
                    >
                      Unlock at Level {world.unlockLevel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Current level progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your Level: {level}</p>
              <p className="text-xs text-muted-foreground">
                {unlockedWorlds.length} / {worldOrder.length} worlds unlocked
              </p>
            </div>
            <div className="text-right">
              {level < 16 && (
                <p className="text-xs text-muted-foreground">
                  Next unlock at level {worldOrder.find(id => !unlockedWorlds.some(w => w.id === id)) 
                    ? AMBIENT_WORLDS[worldOrder.find(id => !unlockedWorlds.some(w => w.id === id))!].unlockLevel 
                    : 16}
                </p>
              )}
              {level >= 16 && (
                <p className="text-xs text-primary font-medium">
                  All worlds unlocked! 🎉
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

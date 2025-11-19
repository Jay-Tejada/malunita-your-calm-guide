import { useState } from 'react';
import { X } from 'lucide-react';
import { useCompanionCosmetics, Colorway, Aura, Trail } from '@/hooks/useCompanionCosmetics';
import { useCompanionGrowth } from '@/hooks/useCompanionGrowth';
import { CompanionPreview } from './CompanionPreview';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface CompanionCustomizationProps {
  onClose: () => void;
}

const COLORWAY_COLORS: Record<Colorway, { core: string; glow: string }> = {
  'zen-default': { core: 'hsl(280, 65%, 60%)', glow: 'hsl(280, 75%, 70%)' },
  'dawn-peach': { core: 'hsl(20, 85%, 65%)', glow: 'hsl(25, 90%, 75%)' },
  'galaxy-indigo': { core: 'hsl(240, 70%, 55%)', glow: 'hsl(245, 80%, 70%)' },
  'solar-gold': { core: 'hsl(45, 100%, 60%)', glow: 'hsl(50, 100%, 70%)' },
  'mist-blue': { core: 'hsl(200, 60%, 55%)', glow: 'hsl(205, 70%, 70%)' },
  'onyx-shadow': { core: 'hsl(270, 20%, 25%)', glow: 'hsl(270, 30%, 45%)' },
};

export const CompanionCustomization = ({ onClose }: CompanionCustomizationProps) => {
  const cosmetics = useCompanionCosmetics();
  const growth = useCompanionGrowth();
  const [activeTab, setActiveTab] = useState<'colorways' | 'auras' | 'trails'>('colorways');

  if (cosmetics.isLoading) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-foreground">Companion Cosmetics</h2>
            <p className="text-xs text-muted-foreground">Customize your companion's appearance</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Live Preview */}
        <div className="border-b border-border bg-muted/20 py-6 flex justify-center">
          <CompanionPreview 
            colorway={cosmetics.selectedColorway}
            aura={cosmetics.selectedAura}
            stage={growth.stage}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['colorways', 'auras', 'trails'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {activeTab === 'colorways' && (
              <>
                {(Object.keys(COLORWAY_COLORS) as Colorway[])
                  .filter(colorway => cosmetics.unlockedColorways.includes(colorway))
                  .map((colorway) => {
                  const isSelected = cosmetics.selectedColorway === colorway;
                  const info = cosmetics.getColorwayInfo(colorway);
                  const colors = COLORWAY_COLORS[colorway];

                  return (
                    <button
                      key={colorway}
                      onClick={() => cosmetics.selectColorway(colorway)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      {/* Color Preview */}
                      <div className="relative w-12 h-12 rounded-full flex-shrink-0">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, ${colors.core}, ${colors.glow})`,
                            boxShadow: `0 0 20px ${colors.glow}80`,
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">{info.name}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>

                      {/* Status */}
                      {isSelected && (
                        <div className="text-xs text-primary font-medium">Selected</div>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'auras' && (
              <>
                {(Object.keys(cosmetics.getAuraInfo('calm-bloom') ? { 'calm-bloom': true, 'pulse-ring': true, 'dreamwave': true, 'starlight-halo': true } : {}) as Aura[])
                  .filter(aura => cosmetics.unlockedAuras.includes(aura))
                  .map((aura) => {
                  const isSelected = cosmetics.selectedAura === aura;
                  const info = cosmetics.getAuraInfo(aura);

                  return (
                    <button
                      key={aura}
                      onClick={() => cosmetics.selectAura(aura)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">{info.name}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>

                      {isSelected && (
                        <div className="text-xs text-primary font-medium">Selected</div>
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {activeTab === 'trails' && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Particle trails are available at Stage 4 (Cosmic) only
                </p>
                
                {/* None option */}
                <button
                  onClick={() => cosmetics.selectTrail(null)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    cosmetics.selectedTrail === null
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">None</p>
                    <p className="text-xs text-muted-foreground">No particle trail</p>
                  </div>
                  {cosmetics.selectedTrail === null && (
                    <div className="text-xs text-primary font-medium">Selected</div>
                  )}
                </button>

                <Separator />

                {(Object.keys(cosmetics.getTrailInfo('subtle-drift') ? { 'subtle-drift': true, 'star-flecks': true, 'ascending-dust': true } : {}) as Trail[])
                  .filter(trail => cosmetics.unlockedTrails.includes(trail))
                  .map((trail) => {
                  const isSelected = cosmetics.selectedTrail === trail;
                  const info = cosmetics.getTrailInfo(trail);

                  return (
                    <button
                      key={trail}
                      onClick={() => cosmetics.selectTrail(trail)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">{info.name}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>

                      {isSelected && (
                        <div className="text-xs text-primary font-medium">Selected</div>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCustomizationStore, type Cosmetic } from './useCustomizationStore';
import { useLevelSystem } from '@/state/levelSystem';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useMoodStore } from '@/state/moodMachine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Lock, Check, ShoppingBag, Sparkles, Palette, Star, Smile } from 'lucide-react';
import { CreatureSprite } from '@/components/CreatureSprite';
import { bondingMeter, BONDING_INCREMENTS } from '@/state/bondingMeter';

export const CustomizationMenu = () => {
  const { toast } = useToast();
  const [previewItem, setPreviewItem] = useState<Cosmetic | null>(null);
  
  const customization = useCustomizationStore();
  const levelSystem = useLevelSystem();
  const emotionalMemory = useEmotionalMemory();
  const moodStore = useMoodStore();

  const availableCosmetics = customization.getAvailableCosmetics(levelSystem.level);

  const handlePurchase = async (cosmetic: Cosmetic) => {
    const success = await customization.purchaseCosmetic(
      cosmetic,
      levelSystem.xp,
      levelSystem.level
    );

    if (success) {
      toast({
        title: '✨ Unlocked!',
        description: `${cosmetic.name} is now available!`,
      });
      
      // Update XP in level system
      levelSystem.setXp(levelSystem.xp - cosmetic.cost);
      
      // Emotional impact
      emotionalMemory.adjustAffection(3);
      moodStore.updateMood('happy');
      
      // Bonding increment for customization
      bondingMeter.incrementBonding(
        BONDING_INCREMENTS.CUSTOMIZATION_CHANGED,
        "Malunita loves her new look!"
      );
    } else {
      toast({
        title: 'Cannot unlock',
        description: 'Not enough XP or level requirement not met.',
        variant: 'destructive',
      });
    }
  };

  const handleEquip = async (cosmetic: Cosmetic) => {
    switch (cosmetic.category) {
      case 'colorway':
        await customization.equipColorway(cosmetic.id);
        break;
      case 'accessory':
        await customization.equipAccessory(cosmetic.id);
        break;
      case 'particle':
        await customization.equipParticle(cosmetic.id);
        break;
    }

    toast({
      title: 'Equipped!',
      description: `${cosmetic.name} is now active.`,
    });

    // Emotional impact when equipping
    emotionalMemory.adjustAffection(3);
    moodStore.updateMood('happy');
    
    setPreviewItem(null);
  };

  const handleUnequip = async (category: string) => {
    if (category === 'accessory') {
      await customization.equipAccessory(null);
      toast({
        title: 'Unequipped',
        description: 'Accessory removed.',
      });
    }
  };

  const isUnlocked = (cosmetic: Cosmetic): boolean => {
    switch (cosmetic.category) {
      case 'colorway':
        return customization.unlockedColorways.includes(cosmetic.id);
      case 'accessory':
        return customization.unlockedAccessories.includes(cosmetic.id);
      case 'particle':
        return customization.unlockedParticles.includes(cosmetic.id);
      case 'expression':
        return customization.unlockedExpressions.includes(cosmetic.id);
      default:
        return false;
    }
  };

  const isEquipped = (cosmetic: Cosmetic): boolean => {
    switch (cosmetic.category) {
      case 'colorway':
        return customization.equippedColorway === cosmetic.id;
      case 'accessory':
        return customization.equippedAccessory === cosmetic.id;
      case 'particle':
        return customization.equippedParticle === cosmetic.id;
      default:
        return false;
    }
  };

  const CosmeticCard = ({ cosmetic }: { cosmetic: Cosmetic }) => {
    const unlocked = isUnlocked(cosmetic);
    const equipped = isEquipped(cosmetic);
    const canUnlock = levelSystem.level >= cosmetic.unlockLevel;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className={`cursor-pointer transition-all ${
            equipped ? 'ring-2 ring-primary' : ''
          } ${previewItem?.id === cosmetic.id ? 'ring-2 ring-accent' : ''}`}
          onClick={() => setPreviewItem(cosmetic)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base flex items-center gap-2">
                {cosmetic.emoji && <span className="text-2xl">{cosmetic.emoji}</span>}
                {cosmetic.primaryColor && (
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{ backgroundColor: cosmetic.primaryColor }}
                  />
                )}
                {cosmetic.name}
              </CardTitle>
              {equipped && (
                <Badge variant="default" className="gap-1">
                  <Check className="w-3 h-3" />
                  Equipped
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">{cosmetic.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3" />
                Level {cosmetic.unlockLevel}
                {cosmetic.cost > 0 && (
                  <>
                    <span>•</span>
                    <Sparkles className="w-3 h-3" />
                    {cosmetic.cost} XP
                  </>
                )}
              </div>
              {!unlocked && !canUnlock && (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="mt-3 flex gap-2">
              {!unlocked && canUnlock && cosmetic.cost > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(cosmetic);
                  }}
                  className="w-full"
                  disabled={levelSystem.xp < cosmetic.cost}
                >
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  Unlock
                </Button>
              )}
              
              {unlocked && !equipped && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEquip(cosmetic);
                  }}
                  className="w-full"
                >
                  Equip
                </Button>
              )}
              
              {equipped && cosmetic.category === 'accessory' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnequip(cosmetic.category);
                  }}
                  className="w-full"
                >
                  Unequip
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Preview
          </CardTitle>
          <CardDescription>
            {previewItem 
              ? `Previewing: ${previewItem.name}` 
              : 'Click any item to preview'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="relative">
            <CreatureSprite
              emotion="happy"
              size={120}
              className="mx-auto"
            />
            {previewItem?.emoji && previewItem.category === 'accessory' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl"
              >
                {previewItem.emoji}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* XP Display */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Available XP</span>
            </div>
            <span className="text-lg font-bold">{levelSystem.xp}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cosmetics Tabs */}
      <Tabs defaultValue="colorways">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colorways" className="gap-1">
            <Palette className="w-3 h-3" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="accessories" className="gap-1">
            <ShoppingBag className="w-3 h-3" />
            Items
          </TabsTrigger>
          <TabsTrigger value="particles" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Effects
          </TabsTrigger>
          <TabsTrigger value="expressions" className="gap-1">
            <Smile className="w-3 h-3" />
            Faces
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colorways" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCosmetics.colorways.map((cosmetic) => (
              <CosmeticCard key={cosmetic.id} cosmetic={cosmetic} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accessories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCosmetics.accessories.map((cosmetic) => (
              <CosmeticCard key={cosmetic.id} cosmetic={cosmetic} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="particles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCosmetics.particles.map((cosmetic) => (
              <CosmeticCard key={cosmetic.id} cosmetic={cosmetic} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expressions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCosmetics.expressions.map((cosmetic) => (
              <CosmeticCard key={cosmetic.id} cosmetic={cosmetic} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

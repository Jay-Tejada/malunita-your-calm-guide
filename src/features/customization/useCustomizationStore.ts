import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import cosmeticsData from './cosmetics.json';

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  cost: number;
  category: 'colorway' | 'accessory' | 'particle' | 'expression';
  primaryColor?: string;
  secondaryColor?: string;
  emoji?: string;
  position?: string;
  effect?: string;
  color?: string;
  expressions?: string[];
}

interface CustomizationState {
  // Current equipped items
  equippedColorway: string;
  equippedAccessory: string | null;
  equippedParticle: string;
  
  // Unlocked items
  unlockedColorways: string[];
  unlockedAccessories: string[];
  unlockedParticles: string[];
  unlockedExpressions: string[];
  
  // Actions
  equipColorway: (id: string) => Promise<void>;
  equipAccessory: (id: string | null) => Promise<void>;
  equipParticle: (id: string) => Promise<void>;
  purchaseCosmetic: (cosmetic: Cosmetic, currentXp: number, currentLevel: number) => Promise<boolean>;
  unlockCosmetic: (category: 'colorway' | 'accessory' | 'particle' | 'expression', cosmeticId: string) => Promise<void>;
  loadFromProfile: (profile: any) => void;
  getAvailableCosmetics: (currentLevel: number) => {
    colorways: Cosmetic[];
    accessories: Cosmetic[];
    particles: Cosmetic[];
    expressions: Cosmetic[];
  };
}

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  equippedColorway: 'zen-default',
  equippedAccessory: null,
  equippedParticle: 'calm-bloom',
  unlockedColorways: ['zen-default'],
  unlockedAccessories: [],
  unlockedParticles: ['calm-bloom'],
  unlockedExpressions: ['basic-pack'],

  loadFromProfile: (profile) => {
    set({
      equippedColorway: profile.selected_colorway || 'zen-default',
      equippedAccessory: profile.selected_accessory || null,
      equippedParticle: profile.selected_aura || 'calm-bloom',
      unlockedColorways: profile.unlocked_colorways || ['zen-default'],
      unlockedAccessories: profile.unlocked_accessories || [],
      unlockedParticles: profile.unlocked_auras || ['calm-bloom'],
      unlockedExpressions: profile.unlocked_expressions || ['basic-pack'],
    });
  },

  equipColorway: async (id: string) => {
    const { unlockedColorways } = get();
    if (!unlockedColorways.includes(id)) return;

    set({ equippedColorway: id });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_colorway: id })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to save colorway:', error);
    }
  },

  equipAccessory: async (id: string | null) => {
    const { unlockedAccessories } = get();
    if (id && !unlockedAccessories.includes(id)) return;

    set({ equippedAccessory: id });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_accessory: id })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to save accessory:', error);
    }
  },

  equipParticle: async (id: string) => {
    const { unlockedParticles } = get();
    if (!unlockedParticles.includes(id)) return;

    set({ equippedParticle: id });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ selected_aura: id })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to save particle:', error);
    }
  },

  purchaseCosmetic: async (cosmetic: Cosmetic, currentXp: number, currentLevel: number) => {
    const state = get();
    
    // Check if already unlocked
    const unlockedKey = `unlocked${cosmetic.category.charAt(0).toUpperCase() + cosmetic.category.slice(1)}s` as keyof CustomizationState;
    const unlocked = state[unlockedKey] as string[];
    if (unlocked.includes(cosmetic.id)) {
      return false;
    }

    // Check level requirement
    if (currentLevel < cosmetic.unlockLevel) {
      return false;
    }

    // Check XP cost
    if (currentXp < cosmetic.cost) {
      return false;
    }

    // Purchase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const newUnlocked = [...unlocked, cosmetic.id];
      
      let updateData: any = {};
      
      switch (cosmetic.category) {
        case 'colorway':
          updateData.unlocked_colorways = newUnlocked;
          set({ unlockedColorways: newUnlocked });
          break;
        case 'accessory':
          updateData.unlocked_accessories = newUnlocked;
          set({ unlockedAccessories: newUnlocked });
          break;
        case 'particle':
          updateData.unlocked_auras = newUnlocked;
          set({ unlockedParticles: newUnlocked });
          break;
        case 'expression':
          updateData.unlocked_expressions = newUnlocked;
          set({ unlockedExpressions: newUnlocked });
          break;
      }

      // Deduct XP
      const newXp = currentXp - cosmetic.cost;
      updateData.companion_xp = newXp;

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      return true;
    } catch (error) {
      console.error('Failed to purchase cosmetic:', error);
      return false;
    }
  },

  unlockCosmetic: async (category: 'colorway' | 'accessory' | 'particle' | 'expression', cosmeticId: string) => {
    const state = get();
    
    // Get the correct unlocked array key
    const unlockedKey = `unlocked${category.charAt(0).toUpperCase() + category.slice(1)}s` as keyof CustomizationState;
    const unlocked = state[unlockedKey] as string[];
    
    // Check if already unlocked
    if (unlocked.includes(cosmeticId)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newUnlocked = [...unlocked, cosmeticId];
      
      let updateData: any = {};
      
      switch (category) {
        case 'colorway':
          updateData.unlocked_colorways = newUnlocked;
          set({ unlockedColorways: newUnlocked });
          break;
        case 'accessory':
          updateData.unlocked_accessories = newUnlocked;
          set({ unlockedAccessories: newUnlocked });
          break;
        case 'particle':
          updateData.unlocked_auras = newUnlocked;
          set({ unlockedParticles: newUnlocked });
          break;
        case 'expression':
          updateData.unlocked_expressions = newUnlocked;
          set({ unlockedExpressions: newUnlocked });
          break;
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to unlock cosmetic:', error);
    }
  },

  getAvailableCosmetics: (currentLevel: number) => {
    return {
      colorways: cosmeticsData.colorways.filter(c => c.unlockLevel <= currentLevel) as Cosmetic[],
      accessories: cosmeticsData.accessories.filter(c => c.unlockLevel <= currentLevel) as Cosmetic[],
      particles: cosmeticsData.particles.filter(c => c.unlockLevel <= currentLevel) as Cosmetic[],
      expressions: cosmeticsData.expressions.filter(c => c.unlockLevel <= currentLevel) as Cosmetic[],
    };
  },
}));

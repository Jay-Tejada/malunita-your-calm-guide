export type WorldId = 'cozy-room' | 'forest-clearing' | 'crystal-nebula' | 'pastel-meadow' | 'minimalist-studio';

export interface AmbientWorld {
  id: WorldId;
  name: string;
  description: string;
  unlockLevel: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  hasIdleInteraction: boolean;
  interactionType?: 'fireflies' | 'orbs' | 'flicker' | 'petals';
}

export const AMBIENT_WORLDS: Record<WorldId, AmbientWorld> = {
  'cozy-room': {
    id: 'cozy-room',
    name: 'Cozy Room',
    description: 'A warm, inviting study with soft lighting and books',
    unlockLevel: 1,
    colors: {
      primary: 'hsl(30, 50%, 85%)',
      secondary: 'hsl(25, 45%, 75%)',
      accent: 'hsl(35, 60%, 70%)',
    },
    hasIdleInteraction: true,
    interactionType: 'flicker',
  },
  'forest-clearing': {
    id: 'forest-clearing',
    name: 'Forest Clearing',
    description: 'A peaceful forest glade with dappled sunlight',
    unlockLevel: 4,
    colors: {
      primary: 'hsl(120, 40%, 85%)',
      secondary: 'hsl(110, 35%, 75%)',
      accent: 'hsl(130, 45%, 70%)',
    },
    hasIdleInteraction: true,
    interactionType: 'fireflies',
  },
  'pastel-meadow': {
    id: 'pastel-meadow',
    name: 'Pastel Meadow',
    description: 'A dreamy field of soft flowers and floating petals',
    unlockLevel: 7,
    colors: {
      primary: 'hsl(340, 60%, 92%)',
      secondary: 'hsl(320, 55%, 88%)',
      accent: 'hsl(300, 50%, 85%)',
    },
    hasIdleInteraction: true,
    interactionType: 'petals',
  },
  'crystal-nebula': {
    id: 'crystal-nebula',
    name: 'Crystal Nebula',
    description: 'A cosmic expanse of stars and nebula clouds',
    unlockLevel: 12,
    colors: {
      primary: 'hsl(260, 60%, 25%)',
      secondary: 'hsl(280, 55%, 35%)',
      accent: 'hsl(300, 65%, 45%)',
    },
    hasIdleInteraction: true,
    interactionType: 'orbs',
  },
  'minimalist-studio': {
    id: 'minimalist-studio',
    name: 'Minimalist Studio',
    description: 'A clean, zen space with subtle shadows',
    unlockLevel: 16,
    colors: {
      primary: 'hsl(0, 0%, 97%)',
      secondary: 'hsl(0, 0%, 92%)',
      accent: 'hsl(0, 0%, 85%)',
    },
    hasIdleInteraction: false,
  },
};

export const getUnlockedWorlds = (level: number): AmbientWorld[] => {
  return Object.values(AMBIENT_WORLDS).filter(world => world.unlockLevel <= level);
};

export const isWorldUnlocked = (worldId: WorldId, level: number): boolean => {
  return AMBIENT_WORLDS[worldId].unlockLevel <= level;
};

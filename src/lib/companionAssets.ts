import malunitaHappy from '@/assets/companions/malunita-happy.png';
import malunitaExcited from '@/assets/companions/malunita-excited.png';
import malunitaCalm from '@/assets/companions/malunita-calm.png';
import malunitaCurious from '@/assets/companions/malunita-curious.png';

export type CompanionVisualState = 
  | 'happy' 
  | 'excited' 
  | 'calm' 
  | 'curious' 
  | 'neutral';

export const companionAssets: Record<CompanionVisualState, string> = {
  happy: malunitaHappy,
  excited: malunitaExcited,
  calm: malunitaCalm,
  curious: malunitaCurious,
  neutral: malunitaCurious, // Default to curious for neutral
};

// Map emotion states to visual assets
export const emotionToVisualState = (emotion: string): CompanionVisualState => {
  switch (emotion) {
    case 'excited':
    case 'motivated':
    case 'accomplished':
      return 'excited';
    case 'happy':
    case 'content':
    case 'playful':
      return 'happy';
    case 'calm':
    case 'peaceful':
    case 'sleepy':
      return 'calm';
    case 'curious':
    case 'focused':
    case 'neutral':
    default:
      return 'curious';
  }
};

// Map motion states to visual assets
export const motionToVisualState = (motion: string): CompanionVisualState => {
  switch (motion) {
    case 'excited':
    case 'fiesta':
      return 'excited';
    case 'curious':
      return 'curious';
    case 'sleepy':
      return 'calm';
    case 'idle':
    default:
      return 'happy';
  }
};

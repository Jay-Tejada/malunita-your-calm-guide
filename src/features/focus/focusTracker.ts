import { questTracker } from '@/lib/questTracker';

// Helper to track focus sessions for quest progress
export const trackFocusSession = () => {
  questTracker.trackFocusSession();
};

// Helper to track mini-game plays for quest progress
export const trackMiniGame = () => {
  questTracker.trackMiniGame();
};

import { useState, useEffect } from 'react';
import { getCurrentSeason, isSeasonActive, getNextSeasonStartDate, type SeasonConfig, type SeasonType } from '@/features/seasons/seasonConfig';
import { useProfile } from './useProfile';

export const useSeasonalEvent = () => {
  const [currentSeason, setCurrentSeason] = useState<SeasonConfig | null>(getCurrentSeason());
  const { profile } = useProfile();
  
  // Check if seasonal visuals are enabled
  const seasonalVisualsEnabled = profile?.ritual_preferences?.seasonal_visuals !== false;
  
  useEffect(() => {
    // Update season every hour
    const interval = setInterval(() => {
      setCurrentSeason(getCurrentSeason());
    }, 1000 * 60 * 60); // Check every hour
    
    return () => clearInterval(interval);
  }, []);
  
  const getSeasonalMultiplier = (type: 'joy' | 'xp'): number => {
    if (!currentSeason || !seasonalVisualsEnabled) return 1;
    
    if (type === 'joy') {
      return currentSeason.effects.joyMultiplier || 1;
    }
    if (type === 'xp') {
      return currentSeason.effects.xpMultiplier || 1;
    }
    return 1;
  };
  
  const isStarfallNight = currentSeason?.type === 'starfall';
  const nextSeasonStart = getNextSeasonStartDate();
  
  return {
    currentSeason: seasonalVisualsEnabled ? currentSeason : null,
    isSeasonActive: (seasonType: SeasonType) => seasonalVisualsEnabled && isSeasonActive(seasonType),
    getSeasonalMultiplier,
    isStarfallNight,
    nextSeasonStart,
    seasonalVisualsEnabled,
  };
};

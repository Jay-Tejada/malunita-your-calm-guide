import { useEffect } from 'react';
import { useOrbStore } from '@/state/orbState';
import { checkEvolution, fetchEvolutionMetrics, saveEvolution } from '@/lib/orbEvolution';

export function useOrbEvolution(userId: string | undefined) {
  const { stage, evolve } = useOrbStore();

  useEffect(() => {
    if (!userId) return;

    const checkForEvolution = async () => {
      try {
        const metrics = await fetchEvolutionMetrics(userId);
        const { shouldEvolve, newStage } = await checkEvolution(userId, stage, metrics);
        
        if (shouldEvolve) {
          evolve();
          await saveEvolution(userId, newStage);
          console.log(`🌟 Orb evolved to stage ${newStage}!`);
        }
      } catch (error) {
        console.error('Evolution check failed:', error);
      }
    };

    // Check on mount and every 5 minutes
    checkForEvolution();
    const interval = setInterval(checkForEvolution, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId, stage, evolve]);
}

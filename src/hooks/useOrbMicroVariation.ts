import { useEffect, useState } from 'react';

interface MicroVariation {
  scaleOffset: number;
  glowOffset: number;
  rotationOffset: number;
}

export function useOrbMicroVariation() {
  const [variation, setVariation] = useState<MicroVariation>({
    scaleOffset: 0,
    glowOffset: 0,
    rotationOffset: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVariation({
        scaleOffset: (Math.random() - 0.5) * 0.02,      // ±1% scale
        glowOffset: (Math.random() - 0.5) * 0.1,        // ±5% glow
        rotationOffset: (Math.random() - 0.5) * 2       // ±1deg rotation
      });
    }, 3000); // Subtle shift every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return variation;
}

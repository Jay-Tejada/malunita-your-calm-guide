import { useRef, useCallback } from 'react';

/**
 * Audio amplitude smoothing utility
 * Uses exponential smoothing to prevent jittery animations
 */
export const useAudioSmoothing = () => {
  const smoothedAmplitudeRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  /**
   * Apply exponential smoothing to audio amplitude
   * @param rawAmplitude - Raw amplitude value (0-1)
   * @param smoothingFactor - How much to weight previous value (0.7-0.9 recommended)
   * @returns Smoothed amplitude clamped between 0.1 and 0.8
   */
  const smoothAmplitude = useCallback((rawAmplitude: number, smoothingFactor: number = 0.85): number => {
    const now = Date.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = now;

    // Adjust smoothing based on frame time for consistent behavior
    const adjustedSmoothing = Math.min(smoothingFactor, 1 - (deltaTime / 100));

    // Apply exponential smoothing
    smoothedAmplitudeRef.current = 
      (smoothedAmplitudeRef.current * adjustedSmoothing) + 
      (rawAmplitude * (1 - adjustedSmoothing));

    // Clamp between 0.1 and 0.8 to prevent extremes
    return Math.max(0.1, Math.min(0.8, smoothedAmplitudeRef.current));
  }, []);

  /**
   * Reset smoothing state (call when starting/stopping recording)
   */
  const reset = useCallback(() => {
    smoothedAmplitudeRef.current = 0;
    lastUpdateTimeRef.current = Date.now();
  }, []);

  return { smoothAmplitude, reset };
};

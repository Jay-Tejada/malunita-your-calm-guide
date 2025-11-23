/**
 * Haptic feedback utility using the Web Vibration API
 * Works best on Android, limited support on iOS Safari
 */

const isHapticsSupported = 'vibrate' in navigator;

/**
 * Light tap feedback for subtle interactions
 */
export const hapticLight = () => {
  if (isHapticsSupported) {
    navigator.vibrate(10);
  }
};

/**
 * Medium feedback for button presses
 */
export const hapticMedium = () => {
  if (isHapticsSupported) {
    navigator.vibrate(20);
  }
};

/**
 * Success pattern for completed actions
 */
export const hapticSuccess = () => {
  if (isHapticsSupported) {
    navigator.vibrate([15, 50, 15]);
  }
};

/**
 * Swipe feedback for gesture navigation
 */
export const hapticSwipe = () => {
  if (isHapticsSupported) {
    navigator.vibrate(15);
  }
};

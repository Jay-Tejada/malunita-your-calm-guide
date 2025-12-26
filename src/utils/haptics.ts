/**
 * Haptic feedback utility using the Web Vibration API
 * Works best on Android, limited support on iOS Safari
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isHapticsSupported = 'vibrate' in navigator;

// Check if running in Capacitor native context
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

/**
 * Light tap feedback for subtle interactions
 */
export const hapticLight = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if (isHapticsSupported) {
    navigator.vibrate(10);
  }
};

/**
 * Medium feedback for button presses
 */
export const hapticMedium = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else if (isHapticsSupported) {
    navigator.vibrate(20);
  }
};

/**
 * Heavy feedback for significant actions
 */
export const hapticHeavy = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } else if (isHapticsSupported) {
    navigator.vibrate(30);
  }
};

/**
 * Success pattern for completed actions
 */
export const hapticSuccess = async () => {
  if (isCapacitor) {
    await Haptics.notification({ type: NotificationType.Success });
  } else if (isHapticsSupported) {
    navigator.vibrate([15, 50, 15]);
  }
};

/**
 * Swipe feedback for gesture navigation
 */
export const hapticSwipe = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if (isHapticsSupported) {
    navigator.vibrate(15);
  }
};

/**
 * Gentle hint pattern for onboarding/tips - two soft taps
 */
export const hapticHint = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Light }), 80);
  } else if (isHapticsSupported) {
    navigator.vibrate([8, 80, 8]);
  }
};

// ============================================
// CONTEXT-AWARE COMPLETION HAPTICS
// ============================================

/**
 * INBOX: Ultra-light single tap - completion as release, not achievement
 * Barely perceptible, acknowledges without celebrating
 */
export const hapticCompleteInbox = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if (isHapticsSupported) {
    navigator.vibrate(8);
  }
};

/**
 * WORK/HOME/SOMEDAY: Standard completion - satisfying confirmation
 * Single medium tap that feels like progress
 */
export const hapticCompleteWork = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else if (isHapticsSupported) {
    navigator.vibrate([12, 40, 12]);
  }
};

/**
 * TODAY: Momentum double-tap - keeps the flow going
 * Quick succession feels like forward motion
 */
export const hapticCompleteToday = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 60);
  } else if (isHapticsSupported) {
    navigator.vibrate([8, 60, 15]);
  }
};

/**
 * STREAK: Celebratory triple-tap for task streaks
 * Reserved for 3+ task completion streaks
 */
export const hapticStreak = async () => {
  if (isCapacitor) {
    await Haptics.impact({ style: ImpactStyle.Light });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 80);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 180);
  } else if (isHapticsSupported) {
    navigator.vibrate([10, 60, 15, 60, 20]);
  }
};

// Context-based haptic selector
export type HapticContext = 'inbox' | 'today' | 'work' | 'home' | 'someday' | 'project';

export const hapticCompleteForContext = async (context: HapticContext, isStreak: boolean = false) => {
  if (isStreak) {
    await hapticStreak();
    return;
  }
  
  switch (context) {
    case 'inbox':
      await hapticCompleteInbox();
      break;
    case 'today':
      await hapticCompleteToday();
      break;
    case 'work':
    case 'home':
    case 'someday':
    case 'project':
    default:
      await hapticCompleteWork();
      break;
  }
};

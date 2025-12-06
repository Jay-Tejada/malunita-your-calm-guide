import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Hook for haptic feedback on native platforms
 * Falls back gracefully on web
 */
export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  /**
   * Light tap - for subtle interactions like toggles, selections
   */
  const lightTap = async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Silently fail on unsupported platforms
    }
  };

  /**
   * Medium tap - for button presses, confirmations
   */
  const mediumTap = async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Silently fail
    }
  };

  /**
   * Heavy tap - for important actions, deletions
   */
  const heavyTap = async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Silently fail
    }
  };

  /**
   * Success notification - task completed, goal achieved
   */
  const success = async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // Silently fail
    }
  };

  /**
   * Warning notification - alerts, reminders
   */
  const warning = async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      // Silently fail
    }
  };

  /**
   * Error notification - failures, destructive actions
   */
  const error = async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      // Silently fail
    }
  };

  /**
   * Selection changed - for pickers, sliders
   */
  const selectionChanged = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      // Silently fail
    }
  };

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    selectionChanged,
    isNative,
  };
};

// Standalone functions for use outside of React components
export const haptics = {
  lightTap: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  },
  mediumTap: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {}
  },
  heavyTap: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
  },
  success: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {}
  },
  warning: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {}
  },
  error: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {}
  },
  selectionChanged: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {}
  },
};

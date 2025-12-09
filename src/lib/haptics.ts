// src/lib/haptics.ts

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function haptic(style: HapticStyle = "light") {
  // Check if device supports vibration
  if (!("vibrate" in navigator)) return;

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [10, 50, 20],
    warning: [20, 40, 20],
    error: [30, 50, 30, 50, 30],
  };

  navigator.vibrate(patterns[style]);
}

// iOS-style haptics using AudioContext for subtle click
let audioContext: AudioContext | null = null;

export function hapticTap() {
  haptic("light");
  playTapSound();
}

export function hapticSuccess() {
  haptic("success");
}

export function hapticError() {
  haptic("error");
}

function playTapSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  } catch {
    // Silent fail — not all browsers support this
  }
}

// Legacy exports for backward compatibility
export function celebrationHaptic() {
  hapticSuccess();
}

export function pulseHaptic() {
  hapticTap();
}

export function focusHaptic() {
  haptic("medium");
}

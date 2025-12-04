export function celebrationHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]); // Gentle double tap
  }
}

export function pulseHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(30); // Single soft tap
  }
}

export function focusHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 50, 20]); // Focused rhythm
  }
}

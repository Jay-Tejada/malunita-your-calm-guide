// Sound effects manager for Malunita
// Gracefully handles missing audio files

export function playSfx(name: string, soundEnabled: boolean = true) {
  if (!soundEnabled) return;

  const map: Record<string, string> = {
    tap: "/sfx/tap.mp3",
    happy: "/sfx/happy.mp3",
    sparkle: "/sfx/sparkle.mp3",
    angry: "/sfx/angry.mp3",
    sleep: "/sfx/sleep.mp3",
  };

  const audioPath = map[name];
  if (!audioPath) return;

  const audio = new Audio(audioPath);
  audio.volume = 0.4;
  audio.play().catch(() => {
    // Silently fail if audio file doesn't exist yet
  });
}

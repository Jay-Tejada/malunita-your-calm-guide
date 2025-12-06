// Orb Audio Manager
// Uses Web Audio API to generate soft chime sounds

type SoundType = 'task_added' | 'task_completed' | 'ritual_start' | 'ritual_end' | 'celebrate';

class OrbAudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  async init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(sound: SoundType) {
    if (!this.enabled || !this.audioContext) return;

    // Resume context if suspended (mobile browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (sound) {
      case 'task_added':
        this.playChime(440, 0.15, 0.08); // A4, short
        break;
      case 'task_completed':
        this.playChime(523, 0.2, 0.1); // C5, slightly longer
        setTimeout(() => this.playChime(659, 0.15, 0.08), 80); // E5
        break;
      case 'ritual_start':
        this.playChime(392, 0.25, 0.1); // G4
        setTimeout(() => this.playChime(523, 0.2, 0.08), 120); // C5
        setTimeout(() => this.playChime(659, 0.15, 0.06), 220); // E5
        break;
      case 'ritual_end':
        this.playChime(659, 0.2, 0.08); // E5
        setTimeout(() => this.playChime(523, 0.25, 0.1), 100); // C5
        setTimeout(() => this.playChime(392, 0.3, 0.08), 200); // G4
        break;
      case 'celebrate':
        this.playCelebration();
        break;
    }
  }

  private playChime(frequency: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Soft attack and decay envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playCelebration() {
    if (!this.audioContext) return;

    // Ascending arpeggio: C5 - E5 - G5 - C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playChime(freq, 0.15, 0.06), i * 60);
    });
  }
}

export const orbAudio = new OrbAudioManager();

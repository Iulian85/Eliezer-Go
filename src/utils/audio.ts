/**
 * Procedural Web Audio API sound management utility for ELZR Hunter.
 * Provides zero-dependency, low-latency audio feedback for coin collections,
 * daily check-ins, radar scanning, tactical alerts, and UI interactions.
 */

const STORAGE_KEY_MUTED = 'elzr_sound_muted';
const STORAGE_KEY_VOLUME = 'elzr_sound_volume';

type SoundType =
  | 'coinCollected'
  | 'rareCoinCollected'
  | 'dailyCheckIn'
  | 'dailyJackpot'
  | 'radarPing'
  | 'targetLock'
  | 'warningPulse'
  | 'coinDespawned'
  | 'buttonClick'
  | 'streakMilestone';

type SoundStateListener = (state: { isMuted: boolean; volume: number }) => void;

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private masterVolume: number = 0.8;
  private listeners: Set<SoundStateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved preferences
      try {
        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
        if (savedMuted !== null) {
          this.muted = savedMuted === 'true';
        }
        const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.masterVolume = parsed;
          }
        }
      } catch {
        // LocalStorage fallback
      }

      // Pre-bind unlock listeners for mobile autoplay policy
      const unlockAudio = () => {
        this.ensureContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true, once: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.updateMasterGain();
        this.masterGain.connect(this.audioCtx.destination);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private updateMasterGain() {
    if (!this.masterGain || !this.audioCtx) return;
    const effectiveGain = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.setValueAtTime(effectiveGain, this.audioCtx.currentTime);
  }

  private notify() {
    const state = { isMuted: this.muted, volume: this.masterVolume };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {}
    });
  }

  // State Getters & Setters
  public isMuted(): boolean {
    return this.muted;
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    } catch {}
    this.updateMasterGain();
    this.notify();
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(this.masterVolume));
    } catch {}
    this.updateMasterGain();
    this.notify();
  }

  public subscribe(listener: SoundStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Synthesized Sound Triggers
  public play(type: SoundType, options?: { isRare?: boolean; isJackpot?: boolean }) {
    if (this.muted) return;

    switch (type) {
      case 'coinCollected':
        if (options?.isRare) {
          this.playRareCoinCollected();
        } else {
          this.playCoinCollected();
        }
        break;
      case 'rareCoinCollected':
        this.playRareCoinCollected();
        break;
      case 'dailyCheckIn':
        if (options?.isJackpot) {
          this.playDailyJackpot();
        } else {
          this.playDailyCheckIn();
        }
        break;
      case 'dailyJackpot':
        this.playDailyJackpot();
        break;
      case 'radarPing':
        this.playRadarPing();
        break;
      case 'targetLock':
        this.playTargetLock();
        break;
      case 'warningPulse':
        this.playWarningPulse();
        break;
      case 'coinDespawned':
        this.playCoinDespawned();
        break;
      case 'buttonClick':
        this.playButtonClick();
        break;
      case 'streakMilestone':
        this.playStreakMilestone();
        break;
    }
  }

  /**
   * Standard ELZR Coin Collection
   * Vibrant, pleasant ascending pentatonic arpeggio (C5 -> E5 -> G5 -> C6 -> E6)
   */
  public playCoinCollected() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        // Subtle pitch bend up for crisp coin punch
        osc.frequency.exponentialRampToValueAtTime(freq * 1.015, now + idx * 0.045 + 0.04);

        const startTime = now + idx * 0.045;
        const duration = 0.22;

        noteGain.gain.setValueAtTime(0.12, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.masterGain!);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {}
  }

  /**
   * Rare / Sponsor / Crystal Coin Collection
   * Radiant crystalline shimmer arpeggio with high harmonic resonance and sparkle decay
   */
  public playRareCoinCollected() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      // High sparkling cascade: E5, G#5, B5, E6, G#6, B6
      const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const overtoneOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Primary bell tone (triangle for crystalline warmth)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        // Overtone shimmer (sine an octave above)
        overtoneOsc.type = 'sine';
        overtoneOsc.frequency.setValueAtTime(freq * 2, now + idx * 0.04);

        const startTime = now + idx * 0.04;
        const duration = 0.38;

        noteGain.gain.setValueAtTime(0.14, startTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(noteGain);
        overtoneOsc.connect(noteGain);
        noteGain.connect(this.masterGain!);

        osc.start(startTime);
        overtoneOsc.start(startTime);
        osc.stop(startTime + duration);
        overtoneOsc.stop(startTime + duration);
      });
    } catch {}
  }

  /**
   * Daily Check-In Claim Fanfare
   * Rich multi-layer victory fanfare with triumphant chord resolution and sparkle chimes
   */
  public playDailyCheckIn() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;

      // Part 1: Ascending herald notes (C4, E4, G4, C5, E5, G5)
      const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];

      fanfareNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const start = now + idx * 0.07;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.35);
      });

      // Part 2: Final resonant Major Chord sustain at +0.45s (C5, G5, C6)
      const chordFreqs = [523.25, 783.99, 1046.5];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.45);

        gain.gain.setValueAtTime(0.12, now + 0.45);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + 0.45);
        osc.stop(now + 1.25);
      });

      // Part 3: Twinkling high sparkles (1567Hz -> 2093Hz)
      const sparkles = [1567.98, 1760.0, 2093.0, 2637.02];
      sparkles.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const start = now + 0.55 + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch {}
  }

  /**
   * Day 7 Jackpot Grand Fanfare
   * Grand celebratory arpeggio with deep sub bass, brass chime, and fireworks cascade
   */
  public playDailyJackpot() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;

      // Sub bass impact
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(130.81, now); // C3
      subOsc.frequency.exponentialRampToValueAtTime(65.41, now + 0.4); // C2
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.6);

      // Grand Multi-Octave Run
      const runNotes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      runNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        const start = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(start);
        osc.stop(start + 0.45);
      });

      // Triumphant Chord Burst at +0.5s
      const crownChord = [523.25, 659.25, 783.99, 1046.5, 1567.98];
      crownChord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.5);

        gain.gain.setValueAtTime(0.15, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + 0.5);
        osc.stop(now + 1.8);
      });
    } catch {}
  }

  /**
   * Streak Milestone sound
   */
  public playStreakMilestone() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {}
  }

  /**
   * Sonar Radar Ping
   */
  public playRadarPing() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.16);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Target Lock Confirmation
   */
  public playTargetLock() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Tactical Critical Warning Pulse (< 15s remaining durability)
   */
  public playWarningPulse() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Coin Despawned
   */
  public playCoinDespawned() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.4);
    } catch {}
  }

  /**
   * Crisp UI Button Click
   */
  public playButtonClick() {
    try {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || this.muted) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.04);
    } catch {}
  }
}

// Global Singleton Instance
export const soundManager = new SoundManager();

// Backward-compatible playSound facade
export const playSound = {
  radarPing: () => soundManager.playRadarPing(),
  targetLock: () => soundManager.playTargetLock(),
  coinCollected: (isRare: boolean = false) => {
    if (isRare) {
      soundManager.playRareCoinCollected();
    } else {
      soundManager.playCoinCollected();
    }
  },
  rareCoinCollected: () => soundManager.playRareCoinCollected(),
  dailyCheckIn: (isJackpot: boolean = false) => {
    if (isJackpot) {
      soundManager.playDailyJackpot();
    } else {
      soundManager.playDailyCheckIn();
    }
  },
  dailyJackpot: () => soundManager.playDailyJackpot(),
  streakMilestone: () => soundManager.playStreakMilestone(),
  buttonClick: () => soundManager.playButtonClick(),
  warningPulse: () => soundManager.playWarningPulse(),
  coinDespawned: () => soundManager.playCoinDespawned(),
};

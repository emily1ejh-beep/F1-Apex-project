/**
 * High-performance Web Audio API sound synthesis for APEX RUSH F1.
 * Generates dynamic engine revs, tire screeches, collision impacts,
 * start lights beeps, and checkered flag fanfares without any external audio downloads.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Audio context will be lazy-initialized upon user interaction
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create reusable 2-second white noise buffer for tire screeches and crashes
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch {
      // Audio not supported or failed
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      const t = this.ctx.currentTime;

      // Primary tone: F1 V6 turbo hybrid high-pitched harmonic
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(90, t);

      // Secondary tone: deeper mechanical rumble
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(45, t);

      // Resonant filter for throaty intake sound
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(600, t);
      this.engineFilter.Q.setValueAtTime(4, t);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, t);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;

      // Setup continuous tire screech loop
      if (this.noiseBuffer) {
        this.tireFilter = this.ctx.createBiquadFilter();
        this.tireFilter.type = 'bandpass';
        this.tireFilter.frequency.setValueAtTime(1400, t);
        this.tireFilter.Q.setValueAtTime(3.5, t);

        this.tireGain = this.ctx.createGain();
        this.tireGain.gain.setValueAtTime(0, t);

        this.tireNoiseNode = this.ctx.createBufferSource();
        this.tireNoiseNode.buffer = this.noiseBuffer;
        this.tireNoiseNode.loop = true;

        this.tireNoiseNode.connect(this.tireFilter);
        this.tireFilter.connect(this.tireGain);
        this.tireGain.connect(this.masterGain);

        this.tireNoiseNode.start();
      }
    } catch {
      // Handled silently
    }
  }

  public updateEngine(rpmRatio: number, throttle: number, driftSlip: number) {
    if (!this.ctx || !this.isEngineRunning) return;

    const t = this.ctx.currentTime;

    // F1 engine frequency ranges from idle (~100Hz) to peak limiter (~550Hz)
    const baseFreq = 95 + rpmRatio * 440;
    if (this.engineOsc1) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.04);
    }
    if (this.engineOsc2) {
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.04);
    }
    if (this.engineFilter) {
      // Throttle opens the filter for aggressive air intake
      const filterFreq = 500 + throttle * 2200 + rpmRatio * 1500;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
    }
    if (this.engineGain) {
      const targetGain = 0.05 + throttle * 0.12 + rpmRatio * 0.08;
      this.engineGain.gain.setTargetAtTime(this.isMuted ? 0 : targetGain, t, 0.05);
    }

    // Tire squeal based on drift slip
    if (this.tireGain) {
      const tireVol = driftSlip > 0.25 ? Math.min((driftSlip - 0.25) * 0.6, 0.3) : 0;
      this.tireGain.gain.setTargetAtTime(this.isMuted ? 0 : tireVol, t, 0.03);
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;

    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      if (this.tireNoiseNode) {
        this.tireNoiseNode.stop();
        this.tireNoiseNode.disconnect();
        this.tireNoiseNode = null;
      }
      this.isEngineRunning = false;
    } catch {
      this.isEngineRunning = false;
    }
  }

  public playCountdownBeep(isFinal: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1480 : 880, t);

      const duration = isFinal ? 0.6 : 0.18;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Safe no-op
    }
  }

  public playCollisionSound(intensity: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.noiseBuffer) return;

    try {
      const t = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + intensity * 600, t);

      const gain = this.ctx.createGain();
      const vol = Math.min(intensity * 0.45, 0.5);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.25);
    } catch {
      // Safe no-op
    }
  }

  public playLapChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, t); // D5
      osc1.frequency.setValueAtTime(880, t + 0.1); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, t); // D6
      osc2.frequency.setValueAtTime(1760, t + 0.1); // A6

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);
    } catch {
      // Safe no-op
    }
  }

  public playCheckeredFlagFanfare() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime + i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // Safe no-op
    }
  }
}

export const soundEngine = new SoundEngine();

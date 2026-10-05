/**
 * Son d'ambiance : la bande-son de la vidéo d'ouverture, analysée en direct
 * pour animer le WebGL. Sans son, un battement lent prend le relais.
 */
export class Ambience {
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private gain?: GainNode;
  private data?: Uint8Array<ArrayBuffer>;
  private level = 0;
  enabled = false;

  constructor(private video: HTMLVideoElement) {}

  private setup() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const source = this.ctx.createMediaElementSource(this.video);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      source.connect(this.analyser);
      this.analyser.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.data = new Uint8Array(this.analyser.frequencyBinCount);
    } catch {
      this.ctx = undefined;
    }
  }

  /** Doit être appelé depuis un geste utilisateur */
  async enable() {
    this.setup();
    this.video.muted = false;
    this.enabled = true;
    if (this.ctx && this.gain) {
      await this.ctx.resume();
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0.85, now + 1.6);
    }
    this.video.play().catch(() => {});
  }

  disable() {
    this.enabled = false;
    if (this.ctx && this.gain) {
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + 0.8);
    } else {
      this.video.muted = true;
    }
  }

  /** Niveau 0..1 lissé (basses + médiums) */
  read(time: number): number {
    let target: number;
    if (this.analyser && this.data) {
      this.analyser.getByteFrequencyData(this.data);
      let sum = 0;
      const bins = Math.min(32, this.data.length);
      for (let i = 2; i < bins; i++) sum += this.data[i];
      target = Math.min(1, (sum / (bins - 2) / 255) * 1.6);
    } else {
      target = 0.18 + 0.08 * Math.sin(time * 1.6) + 0.05 * Math.sin(time * 4.1);
    }
    this.level += (target - this.level) * 0.12;
    return this.level;
  }
}

const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const BASS_LINE = [45, 45, 48, 48, 43, 43, 40, 43];
const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

class SynthAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private nextBeatTime = 0;
  private beat = 0;
  private tempo = 112;
  private _muted = false;

  get muted(): boolean {
    return this._muted;
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.32;
      this.musicGain.connect(this.master);
      this.noise = this.makeNoise(this.ctx);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode, endFreq?: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(dest ?? this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noiseBurst(start: number, dur: number, vol: number, filterFreq: number, type: BiquadFilterType, dest?: AudioNode, sweepTo?: number) {
    if (!this.ctx || !this.master || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, start);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter).connect(gain).connect(dest ?? this.master);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.02);
  }

  key(index: number): void {
    if (!this.ctx) return;
    const note = 69 + SCALE[Math.min(index, SCALE.length - 1)];
    this.tone(midiToHz(note), this.ctx.currentTime, 0.09, 'square', 0.12);
  }

  wrong(): void {
    if (!this.ctx) return;
    this.tone(110, this.ctx.currentTime, 0.14, 'sawtooth', 0.18, undefined, 70);
  }

  zap(length: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(t, 0.35, 0.6, 6000, 'bandpass', undefined, 400);
    this.tone(160, t, 0.3, 'sine', 0.5, undefined, 40);
    this.tone(midiToHz(81 + SCALE[Math.min(length, SCALE.length - 1)]), t + 0.02, 0.25, 'triangle', 0.18);
  }

  lifeLost(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(220, t, 0.45, 'sawtooth', 0.25, undefined, 55);
    this.noiseBurst(t, 0.3, 0.3, 300, 'lowpass');
  }

  levelUp(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(midiToHz(69 + s), t + i * 0.07, 0.3, 'square', 0.13));
  }

  gameOver(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [12, 7, 3, 0, -5].forEach((s, i) => this.tone(midiToHz(57 + s), t + i * 0.18, 0.5, 'sawtooth', 0.16));
  }

  startMusic(tempo?: number): void {
    if (!this.ctx) return;
    if (tempo !== undefined) this.tempo = tempo;
    if (this.musicTimer !== null) return;
    this.nextBeatTime = this.ctx.currentTime + 0.1;
    this.beat = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 50);
  }

  setTempo(tempo: number): void {
    this.tempo = tempo;
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private scheduleMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    const sixteenth = 60 / this.tempo / 4;
    while (this.nextBeatTime < this.ctx.currentTime + 0.15) {
      const t = this.nextBeatTime;
      const step = this.beat % 16;
      const bar = Math.floor(this.beat / 16);
      if (step % 4 === 0) this.tone(150, t, 0.25, 'sine', 0.9, this.musicGain, 45);
      if (step === 4 || step === 12) this.noiseBurst(t, 0.18, 0.35, 1800, 'bandpass', this.musicGain);
      if (step % 2 === 1) this.noiseBurst(t, 0.05, 0.18, 8000, 'highpass', this.musicGain);
      if (step % 2 === 0) {
        const root = BASS_LINE[(bar * 2 + Math.floor(step / 8)) % BASS_LINE.length];
        const octave = step % 4 === 2 ? 12 : 0;
        this.tone(midiToHz(root - 12 + octave), t, sixteenth * 1.8, 'sawtooth', 0.22, this.musicGain);
      }
      this.nextBeatTime += sixteenth;
      this.beat++;
    }
  }
}

export const audio = new SynthAudio();

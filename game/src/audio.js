// Quiet Vault — a tiny synthesized sound kit: no audio files, just a
// WebAudio oscillator and a filtered noise buffer. Footsteps are the point:
// the courier's soft steps, and the wardens' heavier ones growing louder as
// they near — sound that tells you where a guard is before you see him.

export class SoundKit {
  constructor() {
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  // Browsers only allow audio after a gesture; call from any key or click.
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    this.context = new AudioCtor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
    const length = this.context.sampleRate * 0.5;
    this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  // One soft noise tap, low-passed: pitch and volume set the weight of the step.
  step(volume, cutoff) {
    if (!this.context) return;
    const t = this.context.currentTime;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t, Math.random() * 0.3, 0.1);
  }

  courierStep(sneaking) {
    this.step(sneaking ? 0.05 : 0.11, sneaking ? 500 : 800);
  }

  wardenStep(nearness) {
    // nearness 0..1 from the main loop: a far warden is a faint tap, a near
    // one is a boot on stone you can steer by.
    this.step(0.03 + nearness * 0.16, 300 + nearness * 200);
  }

  tone(freqFrom, freqTo, duration, volume, type = 'sine') {
    if (!this.context) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t + duration);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration);
  }

  alarm() {
    this.tone(620, 180, 0.5, 0.22, 'sawtooth');
    this.tone(466, 140, 0.6, 0.14, 'square');
  }

  chime() {
    this.tone(660, 660, 0.14, 0.12);
    setTimeout(() => this.tone(880, 880, 0.22, 0.12), 110);
  }

  click() {
    this.tone(340, 240, 0.06, 0.08, 'triangle');
  }
}

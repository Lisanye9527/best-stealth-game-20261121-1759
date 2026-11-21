// Quiet Vault — a synthesized sound kit.
//
// No audio files: every sound is built live with WebAudio, so the
// game still has no network requests and nothing to download. A
// warden's boots are a short burst of filtered noise whose loudness
// follows his distance, so your ears can steer you before your eyes
// can. The alarm is a slow two-tone hum that climbs with the meter.
// Everything is a no-op until resume() is called from a real user
// gesture, which is also what browsers require.

export class SoundKit {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.alarmNodes = null;
    this.lastStepAt = 0;
  }

  get ready() {
    return this.ctx !== null;
  }

  resume() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  // A single footstep: a 70 ms puff of low-passed noise. distance is
  // in pixels; beyond about 420 the boots are inaudible. sneaking
  // steps are half as loud again.
  footstep(distance, sneaking) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - this.lastStepAt < 0.05) return;
    this.lastStepAt = now;
    const loud = Math.max(0, 1 - distance / 420) * (sneaking ? 0.35 : 0.8);
    if (loud <= 0.02) return;
    const dur = 0.07;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * loud, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
  }

  // The alarm hum: two detuned triangle waves, started once and
  // retuned as the meter moves. level 0 silences it.
  alarmHum(level) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (level <= 0.02) {
      this.stopAlarm();
      return;
    }
    if (!this.alarmNodes) {
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      o1.type = 'triangle';
      o2.type = 'triangle';
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      o1.connect(gain);
      o2.connect(gain);
      gain.connect(this.master);
      o1.start();
      o2.start();
      this.alarmNodes = { o1, o2, gain };
    }
    const now = this.ctx.currentTime;
    const base = 196 + level * 120;
    this.alarmNodes.o1.frequency.setTargetAtTime(base, now, 0.1);
    this.alarmNodes.o2.frequency.setTargetAtTime(base * 1.059, now, 0.1);
    this.alarmNodes.gain.gain.setTargetAtTime(0.05 + level * 0.09, now, 0.15);
  }

  stopAlarm() {
    if (!this.alarmNodes) return;
    const nodes = this.alarmNodes;
    this.alarmNodes = null;
    const now = this.ctx.currentTime;
    nodes.gain.gain.setTargetAtTime(0, now, 0.05);
    window.setTimeout(() => {
      try {
        nodes.o1.stop();
        nodes.o2.stop();
      } catch (err) {
        // Already stopped; nothing to clean up.
      }
    }, 300);
  }

  // A soft two-note chime for reaching the exit.
  chime() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }

  // A low thud for being caught.
  thud() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

// Quiet Vault — the alarm meter.
//
// Suspicion is a single number from 0 to 1. It fills while any lamp
// holds the courier and drains when no lamp does, so a near miss is a
// scare, not a sentence: break the line of sight and the meter fades.
// Sneaking and shadow slow the fill. At 1 the run is over; the meter
// never falls below 0 and never rises above 1.

import { ALARM_HOT, ALARM_WARN, DECAY_RATE, FILL_RATE, SHADOW_FACTOR, SNEAK_FACTOR } from './config.js';

export class Alarm {
  constructor() {
    this.value = 0;
    this.peak = 0;
  }

  reset() {
    this.value = 0;
    this.peak = 0;
  }

  // exposure: the strongest lamp on the courier this frame, 0..1.
  // sneak / shadow: whether the courier is sneaking / in shadow.
  update(dt, exposure, sneak, shadow) {
    if (exposure > 0) {
      let rate = exposure * FILL_RATE;
      if (sneak) rate *= SNEAK_FACTOR;
      if (shadow) rate *= SHADOW_FACTOR;
      this.value = Math.min(1, this.value + rate * dt);
    } else {
      this.value = Math.max(0, this.value - DECAY_RATE * dt);
    }
    if (this.value > this.peak) this.peak = this.value;
  }

  get caught() {
    return this.value >= 1;
  }

  get warm() {
    return this.value >= ALARM_WARN;
  }

  get hot() {
    return this.value >= ALARM_HOT;
  }

  // One word for the HUD: what the courier should feel right now.
  label() {
    if (this.caught) return 'CAUGHT';
    if (this.value >= ALARM_HOT) return 'SEEN — RUN';
    if (this.value >= ALARM_WARN) return 'SPOTTED';
    if (this.value > 0.02) return 'SUSPICION RISING';
    return 'UNSEEN';
  }
}

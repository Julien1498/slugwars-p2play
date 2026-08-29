import { createPinkNoiseBuffer } from './audioBuffers';

export function playSplashSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Layer 1: Water Cavity Resonant Plop
  const plopOsc = ctx.createOscillator();
  const plopGain = ctx.createGain();
  plopOsc.type = 'sine';
  plopOsc.frequency.setValueAtTime(220 * pitchRatio, now);
  plopOsc.frequency.exponentialRampToValueAtTime(780 * pitchRatio, now + 0.05);
  plopOsc.frequency.exponentialRampToValueAtTime(300 * pitchRatio, now + 0.22);

  plopGain.gain.setValueAtTime(0.6, now);
  plopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

  plopOsc.connect(plopGain);
  plopGain.connect(dest);
  plopOsc.start(now);
  plopOsc.stop(now + 0.26);

  // Layer 2: Liquid Foam Churn Spray
  const foamBuffer = createPinkNoiseBuffer(ctx, 0.38);
  const foamSource = ctx.createBufferSource();
  foamSource.buffer = foamBuffer;

  const foamFilter = ctx.createBiquadFilter();
  foamFilter.type = 'bandpass';
  foamFilter.frequency.setValueAtTime(2200 * pitchRatio, now);
  foamFilter.frequency.exponentialRampToValueAtTime(450 * pitchRatio, now + 0.35);
  foamFilter.Q.setValueAtTime(3.2, now);

  const foamGain = ctx.createGain();
  foamGain.gain.setValueAtTime(0.45, now);
  foamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  foamSource.connect(foamFilter);
  foamFilter.connect(foamGain);
  foamGain.connect(dest);
  foamSource.start(now);

  // Layer 3: Staggered Hydrophone Bubble Pops
  const bubblePitches = [380, 520, 680];
  bubblePitches.forEach((freq, idx) => {
    const bTime = now + 0.04 + idx * 0.06;
    const bOsc = ctx.createOscillator();
    const bGain = ctx.createGain();
    bOsc.type = 'sine';
    bOsc.frequency.setValueAtTime(freq * pitchRatio, bTime);
    bOsc.frequency.exponentialRampToValueAtTime((freq + 240) * pitchRatio, bTime + 0.08);

    bGain.gain.setValueAtTime(0.0, now);
    bGain.gain.setValueAtTime(0.35, bTime);
    bGain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.09);

    bOsc.connect(bGain);
    bGain.connect(dest);
    bOsc.start(bTime);
    bOsc.stop(bTime + 0.09);
  });
}

export function playJumpSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(440 * pitchRatio, now + 0.13);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.15);
}

export function playBounceSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(420 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(160 * pitchRatio, now + 0.07);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(740 * pitchRatio, now);
  osc2.frequency.exponentialRampToValueAtTime(220 * pitchRatio, now + 0.07);

  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.08);
  osc2.stop(now + 0.08);
}

export function playOuchSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Cartoon Squeak / Pain Yelp
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(540 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(160 * pitchRatio, now + 0.18);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.2);
}

export function playTickSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Crisp Wooden Clock Tick
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(350 * pitchRatio, now + 0.035);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.035);
}

export function playVictorySound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Triumph Fanfare Major Triad
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * pitchRatio, startTime);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.35);
  });
}

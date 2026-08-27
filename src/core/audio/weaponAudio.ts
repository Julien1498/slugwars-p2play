import { createPinkNoiseBuffer } from './audioBuffers';

export function playExplosionSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Bloons TD Balloon Pop / Retro Arcade "PAAF" Explosion

  // Layer 1: Filtered Noise Pop (850Hz -> 40Hz dynamic lowpass sweep)
  const bufferSize = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(850 * pitchRatio, now);
  filter.frequency.exponentialRampToValueAtTime(40 * pitchRatio, now + 0.38);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.75, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(dest);
  whiteNoise.start(now);

  // Layer 2: Subtle Balloon Pop Thump Body (160Hz -> 45Hz)
  const popOsc = ctx.createOscillator();
  const popGain = ctx.createGain();
  popOsc.type = 'triangle';
  popOsc.frequency.setValueAtTime(160 * pitchRatio, now);
  popOsc.frequency.exponentialRampToValueAtTime(45 * pitchRatio, now + 0.16);

  popGain.gain.setValueAtTime(0.5, now);
  popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  popOsc.connect(popGain);
  popGain.connect(dest);
  popOsc.start(now);
  popOsc.stop(now + 0.18);
}

export function playFireSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // 16-Bit Arcade Bazooka Blast (SNES / Genesis Style "K-PWAM / BOOM")

  // Layer 1: 16-Bit FM Arcade Crunch Punch (Modulated Sawtooth 380Hz -> 55Hz)
  const carrier = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const fmGain = ctx.createGain();

  mod.type = 'sawtooth';
  mod.frequency.setValueAtTime(140 * pitchRatio, now);
  mod.frequency.exponentialRampToValueAtTime(35 * pitchRatio, now + 0.12);

  modGain.gain.setValueAtTime(160 * pitchRatio, now);
  modGain.gain.exponentialRampToValueAtTime(1, now + 0.12);

  mod.connect(modGain);
  modGain.connect(carrier.frequency);

  carrier.type = 'sawtooth';
  carrier.frequency.setValueAtTime(380 * pitchRatio, now);
  carrier.frequency.exponentialRampToValueAtTime(55 * pitchRatio, now + 0.16);

  fmGain.gain.setValueAtTime(0.65, now);
  fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  carrier.connect(fmGain);
  fmGain.connect(dest);

  mod.start(now);
  carrier.start(now);
  mod.stop(now + 0.18);
  carrier.stop(now + 0.18);

  // Layer 2: 16-Bit Arcade Resonant Noise Burst (2400Hz -> 110Hz sweep)
  const noiseBuffer = createPinkNoiseBuffer(ctx, 0.18);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(2400 * pitchRatio, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(110 * pitchRatio, now + 0.15);
  noiseFilter.Q.setValueAtTime(2.8, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.85, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noiseSource.start(now);

  // Layer 3: Punchy Sub-Bass Body (180Hz -> 45Hz)
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(180 * pitchRatio, now);
  bassOsc.frequency.exponentialRampToValueAtTime(45 * pitchRatio, now + 0.2);

  bassGain.gain.setValueAtTime(0.9, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  bassOsc.connect(bassGain);
  bassGain.connect(dest);
  bassOsc.start(now);
  bassOsc.stop(now + 0.22);
}

export function playGrenadeThrowSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Metallic Pin Pull + Arm Swing Whoosh (80ms)
  const pinOsc = ctx.createOscillator();
  const pinGain = ctx.createGain();
  pinOsc.type = 'triangle';
  pinOsc.frequency.setValueAtTime(1400 * pitchRatio, now);
  pinOsc.frequency.exponentialRampToValueAtTime(800 * pitchRatio, now + 0.04);
  pinGain.gain.setValueAtTime(0.4, now);
  pinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  pinOsc.connect(pinGain);
  pinGain.connect(dest);
  pinOsc.start(now);
  pinOsc.stop(now + 0.04);

  const throwOsc = ctx.createOscillator();
  const throwGain = ctx.createGain();
  throwOsc.type = 'sine';
  throwOsc.frequency.setValueAtTime(180 * pitchRatio, now + 0.02);
  throwOsc.frequency.exponentialRampToValueAtTime(460 * pitchRatio, now + 0.12);
  throwGain.gain.setValueAtTime(0.0, now);
  throwGain.gain.setValueAtTime(0.5, now + 0.02);
  throwGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  throwOsc.connect(throwGain);
  throwGain.connect(dest);
  throwOsc.start(now + 0.02);
  throwOsc.stop(now + 0.14);
}

export function playSirenSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Air Raid Siren Two-Tone Alert
  const sirenOsc = ctx.createOscillator();
  const sirenGain = ctx.createGain();
  sirenOsc.type = 'sawtooth';
  sirenOsc.frequency.setValueAtTime(480 * pitchRatio, now);
  sirenOsc.frequency.linearRampToValueAtTime(860 * pitchRatio, now + 0.25);
  sirenOsc.frequency.linearRampToValueAtTime(520 * pitchRatio, now + 0.5);

  sirenGain.gain.setValueAtTime(0.0, now);
  sirenGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
  sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  sirenOsc.connect(sirenGain);
  sirenGain.connect(dest);
  sirenOsc.start(now);
  sirenOsc.stop(now + 0.55);
}

export function playMeleeSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Heavy Slapstick Impact Smack (Noise Slap + Overdriven Thud)
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = 'triangle';
  thudOsc.frequency.setValueAtTime(190 * pitchRatio, now);
  thudOsc.frequency.exponentialRampToValueAtTime(45 * pitchRatio, now + 0.12);

  thudGain.gain.setValueAtTime(0.8, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  thudOsc.connect(thudGain);
  thudGain.connect(dest);
  thudOsc.start(now);
  thudOsc.stop(now + 0.14);

  const snapBuffer = createPinkNoiseBuffer(ctx, 0.06);
  const snapSource = ctx.createBufferSource();
  snapSource.buffer = snapBuffer;
  const snapGain = ctx.createGain();
  snapGain.gain.setValueAtTime(0.6, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  snapSource.connect(snapGain);
  snapGain.connect(dest);
  snapSource.start(now);
}

export function playRopeShootSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Ninja Grappling Wire Zip & Whistle
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1100 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(260 * pitchRatio, now + 0.12);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playRopeAttachSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Sharp Metal Hook Claw Clamp
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(980 * pitchRatio, now + 0.05);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.06);
}

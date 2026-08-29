export function playGirderSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Heavy Steel Beam Clang
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(60 * pitchRatio, now + 0.3);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(480 * pitchRatio, now);
  osc2.frequency.exponentialRampToValueAtTime(140 * pitchRatio, now + 0.35);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.35);
  osc2.stop(now + 0.35);
}

export function playTeleportSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(1600 * pitchRatio, now + 0.25);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function playBaahSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Formant vocal sheep baah
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220 * pitchRatio, now);
  osc.frequency.linearRampToValueAtTime(210 * pitchRatio, now + 0.4);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800 * pitchRatio, now);
  filter.Q.setValueAtTime(4.0, now);

  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.45);
}

export function playDonkeySound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Hee-Haw Donkey Braying
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320 * pitchRatio, now);
  osc.frequency.linearRampToValueAtTime(540 * pitchRatio, now + 0.2);
  osc.frequency.linearRampToValueAtTime(240 * pitchRatio, now + 0.5);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.55);
}

export function playAirdropSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600 * pitchRatio, now);
  osc.frequency.exponentialRampToValueAtTime(200 * pitchRatio, now + 0.4);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + 0.45);
}

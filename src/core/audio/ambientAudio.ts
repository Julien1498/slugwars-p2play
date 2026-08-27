import { createPinkNoiseBuffer } from './audioBuffers';

export function playSplashSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Organic Acoustic Water Entry & Multi-Bubble Glug

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
  // Squelchy Organic Slug Jump (FM Pitch Modulation)
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
  // Solid Elastic / Rubber Impact Thump
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

export function playGirderSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Metallic Resonant Structural Steel Clank (Modal Harmonics)
  const harmonics = [220, 440, 720, 1180];
  harmonics.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq * pitchRatio, now);

    const decay = 0.18 + (3 - idx) * 0.06;
    gain.gain.setValueAtTime(0.4 / (idx + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + decay);
  });
}

export function playTeleportSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Sci-Fi Quantum Disintegration Shimmer
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(260 * pitchRatio, now);
  osc1.frequency.exponentialRampToValueAtTime(1900 * pitchRatio, now + 0.28);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(265 * pitchRatio, now);
  osc2.frequency.exponentialRampToValueAtTime(1920 * pitchRatio, now + 0.28);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400 * pitchRatio, now);
  filter.frequency.exponentialRampToValueAtTime(2400 * pitchRatio, now + 0.28);
  filter.Q.setValueAtTime(3.5, now);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.3);
  osc2.stop(now + 0.3);
}

export function playBaahSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Authentic Comical Vibrato Sheep Bleat ("B-a-a-a-a-h")
  const carrier = ctx.createOscillator();
  const vibratoLfo = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  const gain = ctx.createGain();

  const formant1 = ctx.createBiquadFilter();
  const formant2 = ctx.createBiquadFilter();

  vibratoLfo.type = 'sine';
  vibratoLfo.frequency.setValueAtTime(8.5, now);
  vibratoGain.gain.setValueAtTime(22 * pitchRatio, now);

  vibratoLfo.connect(vibratoGain);
  vibratoGain.connect(carrier.frequency);

  carrier.type = 'sawtooth';
  carrier.frequency.setValueAtTime(320 * pitchRatio, now);
  carrier.frequency.linearRampToValueAtTime(350 * pitchRatio, now + 0.15);
  carrier.frequency.linearRampToValueAtTime(290 * pitchRatio, now + 0.45);

  formant1.type = 'bandpass';
  formant1.frequency.setValueAtTime(850, now);
  formant1.Q.setValueAtTime(4.5, now);

  formant2.type = 'bandpass';
  formant2.frequency.setValueAtTime(1350, now);
  formant2.Q.setValueAtTime(3.8, now);

  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  carrier.connect(formant1);
  carrier.connect(formant2);
  formant1.connect(gain);
  formant2.connect(gain);
  gain.connect(dest);

  vibratoLfo.start(now);
  carrier.start(now);
  vibratoLfo.stop(now + 0.5);
  carrier.stop(now + 0.5);
}

export function playDonkeySound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // High-Energy Comical Donkey Bray ("HEEEE-HAAAWWW!")

  // Part 1: High Inhale "HEEEE" (0 to 0.22s)
  const heeOsc = ctx.createOscillator();
  const heeGain = ctx.createGain();
  const heeFilter = ctx.createBiquadFilter();

  heeOsc.type = 'sawtooth';
  heeOsc.frequency.setValueAtTime(680 * pitchRatio, now);
  heeOsc.frequency.linearRampToValueAtTime(820 * pitchRatio, now + 0.2);

  heeFilter.type = 'bandpass';
  heeFilter.frequency.setValueAtTime(1650, now);
  heeFilter.Q.setValueAtTime(4.0, now);

  heeGain.gain.setValueAtTime(0.75, now);
  heeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  heeOsc.connect(heeFilter);
  heeFilter.connect(heeGain);
  heeGain.connect(dest);
  heeOsc.start(now);
  heeOsc.stop(now + 0.22);

  // Part 2: Deep Resonant Exhale "HAAAWWW" (0.22s to 0.6s)
  const hawTime = now + 0.2;
  const hawOsc = ctx.createOscillator();
  const hawGain = ctx.createGain();
  const hawFilter = ctx.createBiquadFilter();

  hawOsc.type = 'sawtooth';
  hawOsc.frequency.setValueAtTime(340 * pitchRatio, hawTime);
  hawOsc.frequency.exponentialRampToValueAtTime(160 * pitchRatio, hawTime + 0.38);

  hawFilter.type = 'lowpass';
  hawFilter.frequency.setValueAtTime(850, hawTime);
  hawFilter.Q.setValueAtTime(3.5, hawTime);

  hawGain.gain.setValueAtTime(0.0, now);
  hawGain.gain.setValueAtTime(0.85, hawTime);
  hawGain.gain.exponentialRampToValueAtTime(0.001, hawTime + 0.4);

  hawOsc.connect(hawFilter);
  hawFilter.connect(hawGain);
  hawGain.connect(dest);
  hawOsc.start(hawTime);
  hawOsc.stop(hawTime + 0.4);
}

export function playAirdropSound(ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number): void {
  // Crate Chime Arpeggio
  const notes = [392.0, 523.25, 659.25, 783.99];
  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * pitchRatio, startTime);

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
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

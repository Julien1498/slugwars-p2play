export type SoundEffectType =
  | 'fire'
  | 'bazooka_fire'
  | 'grenade_throw'
  | 'siren'
  | 'bat_hit'
  | 'explosion'
  | 'jump'
  | 'splash'
  | 'baah'
  | 'sheep_baah'
  | 'donkey'
  | 'victory'
  | 'tick'
  | 'melee'
  | 'bounce'
  | 'teleport'
  | 'rope_shoot'
  | 'rope_attach'
  | 'girder'
  | 'airdrop'
  | 'ouch';

export interface PlaySoundOptions {
  volume?: number;
  pan?: number; // -1.0 (left) to 1.0 (right)
  pitchMod?: number; // Frequency multiplier, e.g. 1.0
  randomizePitch?: boolean; // Default true (+/- 3% natural variation)
}


// Pre-calculated soft-clipping saturation curve for rich warm analog harmonics
function makeDistortionCurve(amount: number = 20): Float32Array {
  const k = amount;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

const DISTORTION_CURVE = makeDistortionCurve(18);

class SoundEffects {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  public init(): AudioContext | null {
    return this.initCtx();
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // Master Limiter / Dynamics Compressor to prevent clipping and add Hollywood punch
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(10, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.22, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.masterGain.connect(this.masterCompressor);
        this.masterCompressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createDestination(options?: PlaySoundOptions): { dest: AudioNode; pitchRatio: number } {
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) {
      throw new Error('AudioContext unavailable');
    }

    const vol = Math.max(0, Math.min(2.0, options?.volume ?? 1.0));
    let pitchRatio = options?.pitchMod ?? 1.0;
    if (options?.randomizePitch !== false) {
      // Natural subtle human pitch variation (+/- 3.5%)
      pitchRatio *= 0.965 + Math.random() * 0.07;
    }

    // Channel gain node
    const channelGain = ctx.createGain();
    channelGain.gain.setValueAtTime(vol, ctx.currentTime);

    // Optional stereo spatial panning
    if (typeof options?.pan === 'number' && typeof (ctx as any).createStereoPanner === 'function') {
      const panner = (ctx as any).createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, options.pan)), ctx.currentTime);
      channelGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      channelGain.connect(this.masterGain);
    }

    return { dest: channelGain, pitchRatio };
  }

  // Generates brownian noise (deep, warm rumble) for realistic explosions & debris
  private createBrownNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // 1-pole lowpass filter on white noise creates authentic brownian physics noise
      lastOut = (lastOut + 0.025 * white) / 1.025;
      data[i] = lastOut * 3.8;
    }
    return buffer;
  }

  // Generates pink noise (smooth acoustic air & foam hiss)
  private createPinkNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public play(type: SoundEffectType, options?: PlaySoundOptions): void {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const { dest, pitchRatio } = this.createDestination(options);
      const now = ctx.currentTime;

      let resolvedType: string = type;
      if (type === 'bazooka_fire') resolvedType = 'fire';
      if (type === 'sheep_baah') resolvedType = 'baah';
      if (type === 'bat_hit') resolvedType = 'melee';

      if (resolvedType === 'explosion') {

        // Multi-layered Cinematic Blockbuster Explosion

        // Layer 1: Saturated Sub-Bass Shockwave Punch (45Hz -> 22Hz with soft distortion)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        shaper.curve = DISTORTION_CURVE;
        shaper.oversample = '2x';

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(58 * pitchRatio, now);
        subOsc.frequency.exponentialRampToValueAtTime(24 * pitchRatio, now + 0.55);

        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        subOsc.connect(shaper);
        shaper.connect(subGain);
        subGain.connect(dest);
        subOsc.start(now);
        subOsc.stop(now + 0.65);

        // Layer 2: Brown Noise Dirt & Debris Blast (Resonant sweep 1800Hz -> 50Hz)
        const brownBuffer = this.createBrownNoiseBuffer(ctx, 0.75);
        const brownSource = ctx.createBufferSource();
        brownSource.buffer = brownBuffer;

        const brownFilter = ctx.createBiquadFilter();
        brownFilter.type = 'lowpass';
        brownFilter.frequency.setValueAtTime(1800 * pitchRatio, now);
        brownFilter.frequency.exponentialRampToValueAtTime(45, now + 0.7);
        brownFilter.Q.setValueAtTime(3.2, now);

        const brownGain = ctx.createGain();
        brownGain.gain.setValueAtTime(0.9, now);
        brownGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        brownSource.connect(brownFilter);
        brownFilter.connect(brownGain);
        brownGain.connect(dest);
        brownSource.start(now);

        // Layer 3: Initial Detonation Air Crack (Crisp 12ms transient snap)
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        const snapFilter = ctx.createBiquadFilter();

        snapOsc.type = 'sawtooth';
        snapOsc.frequency.setValueAtTime(320 * pitchRatio, now);
        snapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        snapFilter.type = 'highpass';
        snapFilter.frequency.setValueAtTime(400, now);

        snapGain.gain.setValueAtTime(0.7, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        snapOsc.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(dest);
        snapOsc.start(now);
        snapOsc.stop(now + 0.08);

      } else if (resolvedType === 'fire') {
        // Heavy Explosive Rocket / Missile Tube Ignition & Recoil Blast

        // Layer 1: Saturated Launch Tube Detonation & Muzzle Pop (260Hz -> 55Hz punch)
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        shaper.curve = DISTORTION_CURVE;
        shaper.oversample = '2x';

        popOsc.type = 'sawtooth';
        popOsc.frequency.setValueAtTime(260 * pitchRatio, now);
        popOsc.frequency.exponentialRampToValueAtTime(55 * pitchRatio, now + 0.12);

        popGain.gain.setValueAtTime(0.9, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        popOsc.connect(shaper);
        shaper.connect(popGain);
        popGain.connect(dest);
        popOsc.start(now);
        popOsc.stop(now + 0.15);

        // Layer 2: Heavy Artillery Sub-Thump Kick (85Hz -> 28Hz)
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(95 * pitchRatio, now);
        kickOsc.frequency.exponentialRampToValueAtTime(28 * pitchRatio, now + 0.18);

        kickGain.gain.setValueAtTime(1.0, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(dest);
        kickOsc.start(now);
        kickOsc.stop(now + 0.18);

        // Layer 3: High-Energy Fiery Propellant Ignition Crackle (Short sharp 80ms combustion burst)
        const crackleBuffer = this.createBrownNoiseBuffer(ctx, 0.12);
        const crackleSource = ctx.createBufferSource();
        crackleSource.buffer = crackleBuffer;

        const bpf = ctx.createBiquadFilter();
        bpf.type = 'lowpass';
        bpf.frequency.setValueAtTime(2800 * pitchRatio, now);
        bpf.frequency.exponentialRampToValueAtTime(350 * pitchRatio, now + 0.11);
        bpf.Q.setValueAtTime(4.0, now);

        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.85, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        crackleSource.connect(bpf);
        bpf.connect(cGain);
        cGain.connect(dest);
        crackleSource.start(now);

      } else if (resolvedType === 'grenade_throw') {
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

      } else if (resolvedType === 'siren') {
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

      } else if (resolvedType === 'splash') {

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
        const foamBuffer = this.createPinkNoiseBuffer(ctx, 0.38);
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

      } else if (resolvedType === 'jump') {
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

      } else if (resolvedType === 'bounce') {
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

      } else if (resolvedType === 'melee') {
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

        const snapBuffer = this.createPinkNoiseBuffer(ctx, 0.06);
        const snapSource = ctx.createBufferSource();
        snapSource.buffer = snapBuffer;
        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.6, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        snapSource.connect(snapGain);
        snapGain.connect(dest);
        snapSource.start(now);

      } else if (resolvedType === 'girder') {
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

      } else if (resolvedType === 'teleport') {
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

      } else if (resolvedType === 'rope_shoot') {
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

      } else if (resolvedType === 'rope_attach') {
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

      } else if (resolvedType === 'baah') {
        // Authentic Comical Vibrato Sheep Bleat ("B-a-a-a-a-h")
        const carrier = ctx.createOscillator();
        const vibratoLfo = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        const gain = ctx.createGain();

        const formant1 = ctx.createBiquadFilter();
        const formant2 = ctx.createBiquadFilter();

        // 8.5Hz LFO for realistic rapid sheep vocal tremor
        vibratoLfo.type = 'sine';
        vibratoLfo.frequency.setValueAtTime(8.5, now);
        vibratoGain.gain.setValueAtTime(22 * pitchRatio, now);

        vibratoLfo.connect(vibratoGain);
        vibratoGain.connect(carrier.frequency);

        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(320 * pitchRatio, now);
        carrier.frequency.linearRampToValueAtTime(350 * pitchRatio, now + 0.15);
        carrier.frequency.linearRampToValueAtTime(290 * pitchRatio, now + 0.45);

        // Vocal tract formants for "aah"
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

      } else if (resolvedType === 'donkey') {
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


      } else if (resolvedType === 'airdrop') {
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

      } else if (resolvedType === 'ouch') {
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

      } else if (resolvedType === 'tick') {
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

      } else if (resolvedType === 'victory') {
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
    } catch {
      // AudioContext fallback
    }
  }
}


export const sfx = new SoundEffects();

// Auto-unlock AudioContext on first user interaction anywhere in the document
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sfx.init();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('click', unlockAudio, { passive: true });
}

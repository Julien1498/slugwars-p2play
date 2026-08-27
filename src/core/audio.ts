import { SoundEffectType, PlaySoundOptions } from './audio/audioTypes';
import {
  playExplosionSound,
  playFireSound,
  playGrenadeThrowSound,
  playSirenSound,
  playMeleeSound,
  playRopeShootSound,
  playRopeAttachSound,
} from './audio/weaponAudio';
import {
  playSplashSound,
  playJumpSound,
  playBounceSound,
  playGirderSound,
  playTeleportSound,
  playBaahSound,
  playDonkeySound,
  playAirdropSound,
  playOuchSound,
  playTickSound,
  playVictorySound,
} from './audio/ambientAudio';

export type { SoundEffectType, PlaySoundOptions };

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
        // Master Limiter / Dynamics Compressor to prevent clipping and add punch
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
      pitchRatio *= 0.965 + Math.random() * 0.07;
    }

    const channelGain = ctx.createGain();
    channelGain.gain.setValueAtTime(vol, ctx.currentTime);

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

      switch (resolvedType) {
        case 'explosion': playExplosionSound(ctx, dest, pitchRatio, now); break;
        case 'fire': playFireSound(ctx, dest, pitchRatio, now); break;
        case 'grenade_throw': playGrenadeThrowSound(ctx, dest, pitchRatio, now); break;
        case 'siren': playSirenSound(ctx, dest, pitchRatio, now); break;
        case 'melee': playMeleeSound(ctx, dest, pitchRatio, now); break;
        case 'rope_shoot': playRopeShootSound(ctx, dest, pitchRatio, now); break;
        case 'rope_attach': playRopeAttachSound(ctx, dest, pitchRatio, now); break;
        case 'splash': playSplashSound(ctx, dest, pitchRatio, now); break;
        case 'jump': playJumpSound(ctx, dest, pitchRatio, now); break;
        case 'bounce': playBounceSound(ctx, dest, pitchRatio, now); break;
        case 'girder': playGirderSound(ctx, dest, pitchRatio, now); break;
        case 'teleport': playTeleportSound(ctx, dest, pitchRatio, now); break;
        case 'baah': playBaahSound(ctx, dest, pitchRatio, now); break;
        case 'donkey': playDonkeySound(ctx, dest, pitchRatio, now); break;
        case 'airdrop': playAirdropSound(ctx, dest, pitchRatio, now); break;
        case 'ouch': playOuchSound(ctx, dest, pitchRatio, now); break;
        case 'tick': playTickSound(ctx, dest, pitchRatio, now); break;
        case 'victory': playVictorySound(ctx, dest, pitchRatio, now); break;
      }
    } catch {
      // AudioContext graceful fallback
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

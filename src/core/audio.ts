import { SoundEffectType, PlaySoundOptions } from './audio/audioTypes';
import {
  playExplosionSound,
  playFireSound,
  playGrenadeThrowSound,
  playSirenSound,
  playMeleeSound,
  playRopeShootSound,
  playRopeAttachSound,
  playGunshotSound,
  playUziBurstSound,
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

type SoundPlayerFn = (ctx: AudioContext, dest: AudioNode, pitchRatio: number, now: number) => void;

const SFX_DISPATCH: Record<string, SoundPlayerFn> = {
  explosion: playExplosionSound,
  fire: playFireSound,
  bazooka_fire: playFireSound,
  grenade_throw: playGrenadeThrowSound,
  siren: playSirenSound,
  melee: playMeleeSound,
  bat_hit: playMeleeSound,
  rope_shoot: playRopeShootSound,
  rope_attach: playRopeAttachSound,
  gunshot: playGunshotSound,
  uzi_burst: playUziBurstSound,
  splash: playSplashSound,
  jump: playJumpSound,
  bounce: playBounceSound,
  girder: playGirderSound,
  teleport: playTeleportSound,
  baah: playBaahSound,
  sheep_baah: playBaahSound,
  donkey: playDonkeySound,
  airdrop: playAirdropSound,
  ouch: playOuchSound,
  tick: playTickSound,
  victory: playVictorySound,
};

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

      const player = SFX_DISPATCH[type];
      if (player) {
        player(ctx, dest, pitchRatio, now);
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

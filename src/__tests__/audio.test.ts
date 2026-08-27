import { describe, it, expect } from 'vitest';
import { sfx, SoundEffectType, PlaySoundOptions } from '../core/audio';

describe('Audio Engine & Sound Synthesizer', () => {
  it('initializes audio context gracefully in any environment', () => {
    expect(() => sfx.init()).not.toThrow();
  });

  it('plays all 21 sound effects and aliases without throwing errors', () => {
    const allSoundKeys: SoundEffectType[] = [
      'fire',
      'bazooka_fire',
      'grenade_throw',
      'siren',
      'bat_hit',
      'explosion',
      'jump',
      'splash',
      'baah',
      'sheep_baah',
      'donkey',
      'victory',
      'tick',
      'melee',
      'bounce',
      'teleport',
      'rope_shoot',
      'rope_attach',
      'girder',
      'airdrop',
      'ouch',
    ];

    for (const key of allSoundKeys) {
      expect(() => sfx.play(key)).not.toThrow();
    }
  });

  it('supports custom PlaySoundOptions with volume, stereo panning, and pitch modulation', () => {
    const customOptions: PlaySoundOptions[] = [
      { volume: 0.5, pan: -0.8, pitchMod: 1.2, randomizePitch: false },
      { volume: 1.0, pan: 0.8, pitchMod: 0.8, randomizePitch: true },
      { volume: 0.0, pan: 0.0, pitchMod: 1.0 },
      { volume: 2.0, pan: 1.0 },
    ];

    for (const opt of customOptions) {
      expect(() => sfx.play('explosion', opt)).not.toThrow();
      expect(() => sfx.play('splash', opt)).not.toThrow();
      expect(() => sfx.play('baah', opt)).not.toThrow();
      expect(() => sfx.play('donkey', opt)).not.toThrow();
    }
  });
});

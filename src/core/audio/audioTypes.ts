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
  | 'gunshot'
  | 'uzi_burst'
  | 'ouch';

export interface PlaySoundOptions {
  volume?: number;
  pan?: number; // -1.0 (left) to 1.0 (right)
  pitchMod?: number; // Frequency multiplier, e.g. 1.0
  randomizePitch?: boolean; // Default true (+/- 3% natural variation)
}

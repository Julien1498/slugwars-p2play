import { WeaponDefinition } from '../types';

export const concreteDonkeyWeapon: WeaponDefinition = {
  id: 'concrete_donkey',
  name: 'Âne en Béton',
  category: 'SPECIAL',
  behavior: 'HEAVY_FALL',
  icon: '🫏',
  description: 'Un âne géant tombe du ciel et détruit tout le terrain verticalement !',
  damage: 100,
  radius: 80,
  defaultAmmo: 1,
  windAffected: false,
  bounces: false,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'donkey_bray',
  createProjectiles: (ctx) => {
    const targetX = ctx.targetPoint ? ctx.targetPoint.x : ctx.originX;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'concrete_donkey',
        x: targetX,
        y: -100,
        vx: 0,
        vy: 12,
        radius: 25,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
        behaviorData: { bouncesLeft: 5 },
      },
    ];
  },
};

export const superSheepWeapon: WeaponDefinition = {
  id: 'super_sheep',
  name: 'Super Mouton',
  category: 'SPECIAL',
  behavior: 'STEERABLE',
  icon: '🐑',
  description: 'Un mouton volant magique guidé qui s\'écrase avec fracas.',
  damage: 75,
  radius: 55,
  defaultAmmo: 2,
  windAffected: false,
  bounces: false,
  fuseTimeMs: 8000,
  craftable: true,
  customSoundKey: 'sheep_baah',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = 7;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'super_sheep',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 8,
        fuseTimerMs: 8000,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

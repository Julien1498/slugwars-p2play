import { WeaponDefinition } from '../types';

export const concreteDonkeyWeapon: WeaponDefinition = {
  id: 'concrete_donkey',
  name: 'Âne de Béton',
  category: 'SPECIAL',
  behavior: 'HEAVY_FALL',
  icon: '🫏',
  description: 'L\'ultime arme de destruction ! Un âne géant en béton armé tombe du ciel et rebondit à travers tout le terrain !',
  damage: 65,
  radius: 65,
  defaultAmmo: 1,
  turnDelay: 8,
  crateProbability: 0.05,
  windAffected: false,
  bounces: true,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'donkey',
  createProjectiles: (ctx) => {
    const targetX = ctx.targetPoint ? ctx.targetPoint.x : ctx.originX;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'concrete_donkey',
        x: targetX,
        y: -100,
        vx: 0,
        vy: 14,
        radius: 20,
        bounces: true,
        fuseTimerMs: 12000,
        windAffected: false,
        gravityScale: 1.5,
        maxVelocityY: 18,
        impactBehavior: 'EXPLODE',
        ownerSlugId: ctx.ownerSlugId,
        behaviorData: { bouncesLeft: 8 },
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
  turnDelay: 3,
  crateProbability: 0.10,
  windAffected: false,
  bounces: false,
  fuseTimeMs: 8000,
  craftable: true,
  customSoundKey: 'baah',
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
        gravityScale: 0,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

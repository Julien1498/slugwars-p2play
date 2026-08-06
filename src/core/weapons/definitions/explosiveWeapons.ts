import { WeaponDefinition } from '../types';

export const bazookaWeapon: WeaponDefinition = {
  id: 'bazooka',
  name: 'Bazooka',
  category: 'EXPLOSIVE',
  behavior: 'BALLISTIC',
  icon: '🚀',
  description: 'Tir balistique classique sensible au vent.',
  damage: 45,
  radius: 35,
  defaultAmmo: -1,
  windAffected: true,
  bounces: false,
  craftable: true,
  customSoundKey: 'bazooka_fire',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 16 + 4;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'bazooka',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 4,
        bounces: false,
        windAffected: true,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const grenadeWeapon: WeaponDefinition = {
  id: 'grenade',
  name: 'Grenade',
  category: 'EXPLOSIVE',
  behavior: 'BOUNCING_TIMER',
  icon: '💣',
  description: 'Grenade à retardement qui rebondit avant d\'exploser.',
  damage: 50,
  radius: 40,
  defaultAmmo: 5,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 3000,
  craftable: true,
  customSoundKey: 'grenade_throw',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 14 + 3;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'grenade',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 5,
        fuseTimerMs: 3000,
        bounces: true,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const holyGrenadeWeapon: WeaponDefinition = {
  id: 'holy_grenade',
  name: 'Sainte Grenade',
  category: 'EXPLOSIVE',
  behavior: 'BOUNCING_TIMER',
  icon: '⛪',
  description: 'Explosion dévastatrice précédée d\'un Alléluia sacré !',
  damage: 90,
  radius: 75,
  defaultAmmo: 1,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 4000,
  craftable: true,
  customSoundKey: 'holy_choir',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 12 + 3;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'holy_grenade',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 6,
        fuseTimerMs: 4000,
        bounces: true,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

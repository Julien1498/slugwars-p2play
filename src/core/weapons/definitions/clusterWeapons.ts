import { WeaponDefinition } from '../types';

export const clusterBombWeapon: WeaponDefinition = {
  id: 'cluster_bomb',
  name: 'Grenade à Fragmentation',
  category: 'EXPLOSIVE',
  behavior: 'BOUNCING_TIMER',
  icon: '🍍',
  description: 'Grenade qui explose en 5 sous-fragments rebondissants à forte vélocité.',
  damage: 35,
  radius: 35,
  defaultAmmo: 5,
  turnDelay: 0,
  crateProbability: 0.15,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 3000,
  allowCustomFuse: true,
  craftable: true,
  customSoundKey: 'grenade_throw',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 14 + 3;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'cluster_bomb',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 6,
        bounces: true,
        windAffected: false,
        fuseTimerMs: ctx.fuseTimerMs ?? 3000,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const clusterFragmentWeapon: WeaponDefinition = {
  id: 'cluster_fragment',
  name: 'Éclat de Fragmentation',
  category: 'SPECIAL',
  behavior: 'BOUNCING_TIMER',
  icon: '💥',
  description: 'Sous-munition de la grenade à fragmentation.',
  damage: 25,
  radius: 25,
  defaultAmmo: 0,
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: true,
  craftable: false,
  customSoundKey: 'explosion',
  createProjectiles: () => [],
};

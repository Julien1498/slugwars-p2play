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
  turnDelay: 0,
  crateProbability: 0,
  windAffected: true,
  bounces: false,
  craftable: true,
  chargeable: true,
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

export const homingMissileWeapon: WeaponDefinition = {
  id: 'homing_missile',
  name: 'Bazooka Téléguidé',
  category: 'EXPLOSIVE',
  behavior: 'STEERABLE',
  icon: '🎯',
  description: 'Posez la cible au Clic Droit, ajustez l\'angle et chargez la puissance au Clic Gauche / Entrée ! La roquette s\'élance balistiquement puis se réoriente vers la cible.',
  damage: 55,
  radius: 45,
  defaultAmmo: 3,
  turnDelay: 1,
  crateProbability: 0.15,
  requiresTarget: true,
  chargeable: true,
  windAffected: true,
  bounces: false,
  craftable: true,
  customSoundKey: 'bazooka_fire',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 16 + 4;
    const homingDelayMs = 500;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'homing_missile',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 4,
        bounces: false,
        windAffected: true,
        homingConfig: {
          speed: 13,
          turnSpeed: 0.28,
          minTargetDist: 16,
          delayMs: homingDelayMs,
          windFactor: 0.02,
        },
        ownerSlugId: ctx.ownerSlugId,
        targetPoint: ctx.targetPoint,
        behaviorData: { homingDelayMs },
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
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 3000,
  allowCustomFuse: true,
  craftable: true,
  chargeable: true,
  triggersRetreat: true,
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
        fuseTimerMs: ctx.fuseTimerMs ?? 3000,
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
  turnDelay: 5,
  crateProbability: 0.05,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 4000,
  allowCustomFuse: true,
  craftable: true,
  chargeable: true,
  triggersRetreat: true,
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
        fuseTimerMs: ctx.fuseTimerMs ?? 4000,
        bounces: true,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const bananaBombWeapon: WeaponDefinition = {
  id: 'banana_bomb',
  name: 'Bombe Banane',
  category: 'EXPLOSIVE',
  behavior: 'BOUNCING_TIMER',
  icon: '🍌',
  description: 'Provoque une explosion colossale qui se sépare en mini-bananes !',
  damage: 75,
  radius: 60,
  defaultAmmo: 2,
  turnDelay: 4,
  crateProbability: 0.10,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 3000,
  allowCustomFuse: true,
  craftable: true,
  chargeable: true,
  triggersRetreat: true,
  customSoundKey: 'grenade_throw',
  onExplode: (proj, pt) => {
    const now = Date.now();
    const frags = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 4;
      frags.push({
        id: `proj_bananette_${now}_${i}_${Math.random()}`,
        weaponId: 'cluster_banana' as const,
        x: pt.x,
        y: pt.y - 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 4,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 2000 + Math.random() * 800,
        ownerSlugId: proj.ownerSlugId,
      });
    }
    return frags;
  },
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = (ctx.power / 100) * 14 + 3;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'banana_bomb',
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

export const dynamiteWeapon: WeaponDefinition = {
  id: 'dynamite',
  name: 'Dynamite',
  category: 'EXPLOSIVE',
  behavior: 'BOUNCING_TIMER',
  icon: '🧨',
  description: 'Posée au sol. Mèche réglable de 1 à 5 secondes déclenchant une explosion massive.',
  damage: 70,
  radius: 65,
  defaultAmmo: 2,
  turnDelay: 1,
  crateProbability: 0.15,
  windAffected: false,
  bounces: false,
  fuseTimeMs: 3000,
  allowCustomFuse: true,
  chargeable: false,
  triggersRetreat: true,
  craftable: true,
  customSoundKey: 'grenade_throw',
  createProjectiles: (ctx) => {
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'dynamite',
        x: ctx.originX,
        y: ctx.originY,
        vx: 0,
        vy: 0,
        radius: 6,
        bounces: false,
        windAffected: false,
        impactBehavior: 'REST',
        fuseTimerMs: ctx.fuseTimerMs ?? 3000,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const clusterBananaWeapon: WeaponDefinition = {
  id: 'cluster_banana',
  name: 'Mini-Banane',
  category: 'SPECIAL',
  behavior: 'BOUNCING_TIMER',
  icon: '🍌',
  description: 'Sous-munition de la bombe banane.',
  damage: 40,
  radius: 35,
  defaultAmmo: 0,
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: true,
  craftable: false,
  customSoundKey: 'explosion',
  createProjectiles: () => [],
};

import { WeaponDefinition } from '../types';
import { ActiveProjectile } from '../../types';

export const baseballBatWeapon: WeaponDefinition = {
  id: 'baseball_bat',
  name: 'Batte de Baseball',
  category: 'MELEE',
  behavior: 'MELEE_PUSH',
  icon: '⚾',
  description: 'Un coup de batte dévastateur qui projette la limace ennemie hors de la carte.',
  damage: 30,
  radius: 20,
  defaultAmmo: -1,
  windAffected: false,
  bounces: false,
  craftable: false,
  customSoundKey: 'bat_hit',
  createProjectiles: () => [],
};

export const airStrikeWeapon: WeaponDefinition = {
  id: 'air_strike',
  name: 'Attaque Aérienne',
  category: 'AIR_SUPPORT',
  behavior: 'AIR_STRIKE',
  icon: '🛩️',
  description: 'Un avion largue 5 bombes sur la position cible sélectionnée.',
  damage: 30,
  radius: 30,
  defaultAmmo: 2,
  windAffected: false,
  bounces: false,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'siren',
  createProjectiles: (ctx) => {
    const targetX = ctx.targetPoint ? ctx.targetPoint.x : ctx.originX;
    const projectiles: ActiveProjectile[] = [];
    for (let i = 0; i < 5; i++) {
      projectiles.push({
        id: `proj_${Date.now()}_${i}_${Math.random()}`,
        weaponId: 'air_strike',
        x: targetX - 40 + i * 20,
        y: -50 - i * 30,
        vx: 1,
        vy: 8 + Math.random() * 2,
        radius: 5,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      });
    }
    return projectiles;
  },
};

export const teleportWeapon: WeaponDefinition = {
  id: 'teleport',
  name: 'Téléporteur',
  category: 'UTILITY',
  behavior: 'TELEPORT',
  icon: '🌀',
  description: 'Se téléporte instantanément sur la position cible.',
  damage: 0,
  radius: 0,
  defaultAmmo: 2,
  windAffected: false,
  bounces: false,
  craftable: false,
  requiresTarget: true,
  customSoundKey: 'teleport',
  createProjectiles: () => [],
};

export const shotgunWeapon: WeaponDefinition = {
  id: 'shotgun',
  name: 'Fusil à Pompe',
  category: 'MELEE',
  behavior: 'BALLISTIC',
  icon: '🔫',
  description: 'Tir rapide à haute vitesse infligeant 35 dégâts.',
  damage: 35,
  radius: 20,
  defaultAmmo: 4,
  windAffected: false,
  bounces: false,
  craftable: true,
  customSoundKey: 'melee',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const speed = 22;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'shotgun',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        radius: 3,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const homingPigeonWeapon: WeaponDefinition = {
  id: 'homing_pigeon',
  name: 'Pigeon Voyageur',
  category: 'SPECIAL',
  behavior: 'BALLISTIC',
  icon: '🕊️',
  description: 'Vole vers la cible désignée avant d\'exploser.',
  damage: 60,
  radius: 45,
  defaultAmmo: 2,
  windAffected: false,
  bounces: false,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'siren',
  createProjectiles: (ctx) => {
    const targetX = ctx.targetPoint ? ctx.targetPoint.x : ctx.originX + 100;
    const targetY = ctx.targetPoint ? ctx.targetPoint.y : ctx.originY - 100;
    const dx = targetX - ctx.originX;
    const dy = targetY - ctx.originY;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 10;
    return [
      {
        id: `proj_${Date.now()}_${Math.random()}`,
        weaponId: 'homing_pigeon',
        x: ctx.originX,
        y: ctx.originY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        radius: 5,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      },
    ];
  },
};

export const prodWeapon: WeaponDefinition = {
  id: 'prod',
  name: 'Pichenette',
  category: 'MELEE',
  behavior: 'MELEE_PUSH',
  icon: '👆',
  description: 'Une petite pichenette (5 dégâts) qui pousse l\'ennemi au bas d\'une falaise !',
  damage: 5,
  radius: 15,
  defaultAmmo: -1,
  windAffected: false,
  bounces: false,
  craftable: false,
  customSoundKey: 'melee',
  createProjectiles: () => [],
};

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
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: false,
  craftable: false,
  chargeable: true,
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
  turnDelay: 3,
  crateProbability: 0.10,
  windAffected: false,
  bounces: false,
  craftable: true,
  chargeable: false,
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
  turnDelay: 0,
  crateProbability: 0.10,
  windAffected: false,
  bounces: false,
  craftable: false,
  chargeable: false,
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
  description: 'Tire une gerbe de 6 cartouches en cône à haute vitesse.',
  damage: 12,
  radius: 16,
  defaultAmmo: 4,
  turnDelay: 0,
  crateProbability: 0.25,
  windAffected: false,
  bounces: false,
  craftable: true,
  chargeable: false,
  shooterRecoil: { pushForce: 4.8, popUp: -2.4 },
  kineticImpulse: { pushForce: 7.5, popUp: -3.8 },
  customSoundKey: 'melee',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const pellets: ActiveProjectile[] = [];
    for (let i = 0; i < 6; i++) {
      const spread = rad + ((Math.random() - 0.5) * 12 * Math.PI) / 180;
      const speed = 24 + Math.random() * 4;
      pellets.push({
        id: `proj_shotgun_${Date.now()}_${i}_${Math.random()}`,
        weaponId: 'shotgun',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        radius: 2,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      });
    }
    return pellets;
  },
};

export const homingPigeonWeapon: WeaponDefinition = {
  id: 'homing_pigeon',
  name: 'Pigeon Voyageur',
  category: 'SPECIAL',
  behavior: 'BALLISTIC',
  icon: '🕊️',
  description: 'Vole et s\'oriente vers la cible cliquée avec dérive au vent avant d\'exploser.',
  damage: 60,
  radius: 45,
  defaultAmmo: 2,
  turnDelay: 2,
  crateProbability: 0.15,
  windAffected: true,
  bounces: false,
  craftable: true,
  chargeable: false,
  requiresTarget: true,
  customSoundKey: 'siren',
  createProjectiles: (ctx) => {
    const targetX = ctx.targetPoint ? ctx.targetPoint.x : ctx.originX + 100;
    const targetY = ctx.targetPoint ? ctx.targetPoint.y : ctx.originY - 100;
    return [
      {
        id: `proj_pigeon_${Date.now()}_${Math.random()}`,
        weaponId: 'homing_pigeon',
        x: ctx.originX,
        y: ctx.originY - 10,
        vx: 0,
        vy: -5,
        radius: 5,
        bounces: false,
        windAffected: true,
        homingConfig: {
          speed: 7.5,
          turnSpeed: 0.22,
          minTargetDist: 15,
          windFactor: 0.015,
        },
        ownerSlugId: ctx.ownerSlugId,
        targetPoint: { x: targetX, y: targetY },
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
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: false,
  craftable: false,
  chargeable: false,
  customSoundKey: 'melee',
  createProjectiles: () => [],
};

export const blowtorchWeapon: WeaponDefinition = {
  id: 'blowtorch',
  name: 'Chalumeau',
  category: 'UTILITY',
  behavior: 'BLOWTORCH',
  icon: '🔥',
  description: 'Creuse des galeries et détruit le sol devant vous avec un jet de flammes haute température.',
  damage: 15,
  radius: 12,
  defaultAmmo: 100,
  turnDelay: 0,
  crateProbability: 0.15,
  windAffected: false,
  bounces: false,
  craftable: false,
  chargeable: false,
  customSoundKey: 'fire',
  createProjectiles: () => [],
};

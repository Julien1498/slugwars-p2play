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
  icon: '✨',
  description: 'Se téléporte instantanément sur n\'importe quel point valide de la carte.',
  damage: 0,
  radius: 0,
  defaultAmmo: 3,
  windAffected: false,
  bounces: false,
  craftable: false,
  requiresTarget: true,
  customSoundKey: 'teleport_zap',
  createProjectiles: () => [],
};

import { WeaponDefinition } from '../types';
import { ActiveProjectile } from '../../types';

export const handgunWeapon: WeaponDefinition = {
  id: 'handgun',
  name: 'Pistolet',
  category: 'MELEE',
  behavior: 'BALLISTIC',
  icon: '🔫',
  description: 'Tir précis et rapide de 6 balles en ligne directe. Idéal pour pousser sans détruire le terrain.',
  damage: 5,
  radius: 8,
  defaultAmmo: 4,
  turnDelay: 0,
  crateProbability: 0.15,
  windAffected: false,
  bounces: false,
  craftable: true,
  chargeable: false,
  kineticImpulse: { pushForce: 5.5, popUp: -3.0 },
  customSoundKey: 'gunshot',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const bullets: ActiveProjectile[] = [];
    for (let i = 0; i < 6; i++) {
      const spread = rad + ((Math.random() - 0.5) * 3 * Math.PI) / 180;
      const speed = 26 + Math.random() * 2;
      bullets.push({
        id: `proj_handgun_${Date.now()}_${i}_${Math.random()}`,
        weaponId: 'handgun',
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
    return bullets;
  },
};

export const uziWeapon: WeaponDefinition = {
  id: 'uzi',
  name: 'Pistolet-Mitrailleur',
  category: 'MELEE',
  behavior: 'BALLISTIC',
  icon: '⚡',
  description: 'Rafale automatique de 10 balles rapides avec dispersion balistique et fort recul.',
  damage: 5,
  radius: 10,
  defaultAmmo: 3,
  turnDelay: 0,
  crateProbability: 0.20,
  windAffected: false,
  bounces: false,
  craftable: true,
  chargeable: false,
  shooterRecoil: { pushForce: 6.8, popUp: -3.2 },
  kineticImpulse: { pushForce: 5.5, popUp: -2.8 },
  customSoundKey: 'uzi_burst',
  createProjectiles: (ctx) => {
    const rad = (ctx.angleDeg * Math.PI) / 180;
    const bullets: ActiveProjectile[] = [];
    for (let i = 0; i < 10; i++) {
      const spread = rad + ((Math.random() - 0.5) * 14 * Math.PI) / 180;
      const speed = 24 + Math.random() * 4;
      bullets.push({
        id: `proj_uzi_${Date.now()}_${i}_${Math.random()}`,
        weaponId: 'uzi',
        x: ctx.originX,
        y: ctx.originY,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        radius: 2.5,
        bounces: false,
        windAffected: false,
        ownerSlugId: ctx.ownerSlugId,
      });
    }
    return bullets;
  },
};

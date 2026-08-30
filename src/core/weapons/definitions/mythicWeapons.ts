import { WeaponDefinition } from '../types';
import { ActiveProjectile } from '../../types';

export const sheepWeapon: WeaponDefinition = {
  id: 'sheep',
  name: 'Mouton',
  category: 'SPECIAL',
  behavior: 'WALKER',
  icon: '🐑',
  description: 'Lâché au sol, il avance en sautant les obstacles. Re-cliquez pour le faire exploser à tout moment (ou après 8s) !',
  damage: 70,
  radius: 55,
  defaultAmmo: 2,
  turnDelay: 2,
  crateProbability: 0.15,
  windAffected: false,
  bounces: true,
  fuseTimeMs: 8000,
  craftable: true,
  chargeable: false,
  triggersRetreat: true,
  customSoundKey: 'baah',
  createProjectiles: (ctx) => {
    const isLeft = ctx.angleDeg > 90 || ctx.angleDeg < -90;
    return [
      {
        id: `proj_sheep_${Date.now()}_${Math.random()}`,
        weaponId: 'sheep',
        x: ctx.originX,
        y: ctx.originY - 4,
        vx: isLeft ? -2.2 : 2.2,
        vy: -2.0,
        radius: 7,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 8000,
        ownerSlugId: ctx.ownerSlugId,
        behaviorData: {
          facing: isLeft ? 'left' : 'right',
          walkerType: 'sheep',
          jumpCooldown: 0,
          createdAt: Date.now(),
        },
      },
    ];
  },
};

export const oldLadyWeapon: WeaponDefinition = {
  id: 'old_lady',
  name: 'Vieille Dame',
  category: 'SPECIAL',
  behavior: 'WALKER',
  icon: '👵',
  description: "Avance lentement au sol en marmonnant avant d'exploser avec une force cataclysmique après 5 secondes !",
  damage: 75,
  radius: 60,
  defaultAmmo: 1,
  turnDelay: 4,
  crateProbability: 0.10,
  windAffected: false,
  bounces: false,
  fuseTimeMs: 5000,
  craftable: true,
  chargeable: false,
  triggersRetreat: true,
  customSoundKey: 'granny_hum',
  createProjectiles: (ctx) => {
    const isLeft = ctx.angleDeg > 90 || ctx.angleDeg < -90;
    return [
      {
        id: `proj_oldlady_${Date.now()}_${Math.random()}`,
        weaponId: 'old_lady',
        x: ctx.originX,
        y: ctx.originY - 4,
        vx: isLeft ? -1.2 : 1.2,
        vy: -1.0,
        radius: 6,
        bounces: false,
        windAffected: false,
        fuseTimerMs: 5000,
        ownerSlugId: ctx.ownerSlugId,
        behaviorData: {
          facing: isLeft ? 'left' : 'right',
          walkerType: 'old_lady',
          jumpCooldown: 0,
        },
      },
    ];
  },
};

export const armageddonWeapon: WeaponDefinition = {
  id: 'armageddon',
  name: 'Armageddon',
  category: 'SPECIAL',
  behavior: 'GLOBAL_STRIKE',
  icon: '☄️',
  description: "Invoque l'apocalypse ! Une pluie dévastatrice de 20 météores s'abat sur l'ensemble du champ de bataille.",
  damage: 60,
  radius: 45,
  defaultAmmo: 0,
  turnDelay: 6,
  crateProbability: 0.05,
  windAffected: false,
  bounces: false,
  craftable: true,
  chargeable: false,
  triggersRetreat: true,
  customSoundKey: 'siren',
  createProjectiles: () => [],
};

export const meteorWeapon: WeaponDefinition = {
  id: 'meteor',
  name: 'Météore',
  category: 'SPECIAL',
  behavior: 'BALLISTIC',
  icon: '🔥',
  description: "Sous-munition météore d'Armageddon.",
  damage: 60,
  radius: 45,
  defaultAmmo: 0,
  turnDelay: 0,
  crateProbability: 0,
  windAffected: false,
  bounces: false,
  craftable: false,
  chargeable: false,
  customSoundKey: 'explosion',
  createProjectiles: () => [],
};

import { getGrenadeGrad } from './slugGradients';
import {
  WEAPON_BAT_PATH,
  WEAPON_BANANA_PATH,
  WEAPON_GRENADE_PATH,
  WEAPON_GRENADE_GRID_PATH,
  WEAPON_PIGEON_BODY_PATH,
  WEAPON_PIGEON_BEAK_PATH,
  WEAPON_BAZOOKA_ROCKET_NOSE_PATH,
  WEAPON_HOLY_GRENADE_PATH,
} from './slugWeaponPaths';
import {
  drawHeldSheep,
  drawHeldOldLady,
  drawHeldArmageddon,
  drawHeldHandgun,
  drawHeldUzi,
  drawHeldClusterBomb,
  drawHeldBunkerBuster,
  drawHeldMineStrike,
  drawHeldKamikaze,
} from './slugMythicWeaponDrawers';
import {
  drawHeldMagnet,
  drawHeldPneumaticDrill,
  drawHeldParachute,
  drawHeldJetpack,
  drawHeldAirdrop,
} from './slugUtilityWeaponDrawers';

export type HeldWeaponDrawer = (ctx: CanvasRenderingContext2D, animTime: number) => void;

export const HELD_WEAPON_DRAWERS: Record<string, HeldWeaponDrawer> = {
  bazooka: (ctx) => {
    ctx.fillStyle = '#3f3f46';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.3;
    ctx.fillRect(0, -3.5, 17, 6);
    ctx.strokeRect(0, -3.5, 17, 6);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(9, -3.5, 2.5, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fill(WEAPON_BAZOOKA_ROCKET_NOSE_PATH);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(4, -5.5, 4, 2);
  },

  homing_missile: (ctx, animTime) => {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.3;
    ctx.fillRect(0, -4, 18, 7);
    ctx.strokeRect(0, -4, 18, 7);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, -6, 6, 2.5);
    ctx.fillRect(14, -4, 3, 7);
    ctx.fillStyle = Math.sin(animTime * 12) > 0 ? '#38bdf8' : '#0284c7';
    ctx.beginPath();
    ctx.arc(4, -7.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },

  grenade: (ctx) => {
    ctx.fillStyle = getGrenadeGrad(ctx);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_GRENADE_PATH);
    ctx.stroke(WEAPON_GRENADE_PATH);
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 0.8;
    ctx.stroke(WEAPON_GRENADE_GRID_PATH);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(6.5, -5.5, 3, 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  },

  banana_bomb: (ctx) => {
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_BANANA_PATH);
    ctx.stroke(WEAPON_BANANA_PATH);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillStyle = '#713f12';
    ctx.fillRect(13, -3, 2.5, 2.5);
  },

  dynamite: (ctx, animTime) => {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -5, 9, 10);
    ctx.strokeRect(3, -5, 9, 10);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, -2, 9, 3);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(13, -6.5, 2.5 + Math.sin(animTime * 18) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  },

  holy_grenade: (ctx) => {
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_HOLY_GRENADE_PATH);
    ctx.stroke(WEAPON_HOLY_GRENADE_PATH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, -7.5, 2, 5.5);
    ctx.fillRect(5.5, -5.5, 5, 2);
  },

  shotgun: (ctx) => {
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -2.5, 15, 4);
    ctx.strokeRect(3, -2.5, 15, 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -1.5, 6, 4.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, -2.5, 1.5, 4);
  },

  baseball_bat: (ctx) => {
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_BAT_PATH);
    ctx.stroke(WEAPON_BAT_PATH);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(2, 0, 4, 2.5);
  },

  prod: (ctx, animTime) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(1, -1.5, 12, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, -3, 3, 6);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(19 + Math.sin(animTime * 20) * 2, -2 + Math.cos(animTime * 20) * 2);
    ctx.lineTo(21, 0);
    ctx.stroke();
  },

  blowtorch: (ctx, animTime) => {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2, -2, 10, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(11, -1, 4, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(15, -2);
    ctx.lineTo(22 + Math.sin(animTime * 25) * 3, 0);
    ctx.lineTo(15, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(17, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },

  air_strike: (ctx, animTime) => {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -5, 7, 10);
    ctx.strokeRect(3, -5, 7, 10);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.lineTo(5, -10);
    ctx.stroke();
    ctx.fillStyle = Math.sin(animTime * 10) > 0 ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(5, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },

  homing_pigeon: (ctx) => {
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.1;
    ctx.fill(WEAPON_PIGEON_BODY_PATH);
    ctx.stroke(WEAPON_PIGEON_BODY_PATH);
    ctx.fillStyle = '#f97316';
    ctx.fill(WEAPON_PIGEON_BEAK_PATH);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(10, -1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  },

  super_sheep: (ctx) => {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, -1, 4.5, 0, Math.PI * 2);
    ctx.arc(9, 1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1, -2, 4, 6);
  },

  concrete_donkey: (ctx) => {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(4, -5, 8, 9);
    ctx.strokeRect(4, -5, 8, 9);
    ctx.fillRect(8, -8, 2, 4);
    ctx.fillRect(10, -8, 2, 4);
  },

  teleport: (ctx, animTime) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -4, 8, 8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(7, 0, 3 + Math.sin(animTime * 12) * 1, 0, Math.PI * 2);
    ctx.stroke();
  },

  ninja_rope: (ctx) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(2, -2, 8, 4);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(14, 0);
    ctx.moveTo(12, -4);
    ctx.lineTo(14, 0);
    ctx.lineTo(12, 4);
    ctx.stroke();
  },

  girder: (ctx) => {
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -6, 6, 12);
    ctx.strokeRect(3, -6, 6, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, -4, 4, 8);
  },

  skip_turn: (ctx) => {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(4, -10);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, -10, 8, 5);
  },

  cluster_bomb: (ctx) => drawHeldClusterBomb(ctx),
  handgun: (ctx) => drawHeldHandgun(ctx),
  uzi: (ctx) => drawHeldUzi(ctx),
  sheep: (ctx) => drawHeldSheep(ctx),
  old_lady: (ctx) => drawHeldOldLady(ctx),
  armageddon: (ctx) => drawHeldArmageddon(ctx),
  bunker_buster: (ctx) => drawHeldBunkerBuster(ctx),
  mine_strike: (ctx) => drawHeldMineStrike(ctx),
  kamikaze: (ctx) => drawHeldKamikaze(ctx),
  magnet: (ctx, animTime) => drawHeldMagnet(ctx, animTime),
  pneumatic_drill: (ctx, animTime) => drawHeldPneumaticDrill(ctx, animTime),
  parachute: (ctx) => drawHeldParachute(ctx),
  jetpack: (ctx, animTime) => drawHeldJetpack(ctx, animTime),
  airdrop: (ctx, animTime) => drawHeldAirdrop(ctx, animTime),
};

export const drawDefaultGenericWeapon: HeldWeaponDrawer = (ctx) => {
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(7, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

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

export {
  WEAPON_BAT_PATH,
  WEAPON_BANANA_PATH,
  WEAPON_GRENADE_PATH,
  WEAPON_GRENADE_GRID_PATH,
  WEAPON_PIGEON_BODY_PATH,
  WEAPON_PIGEON_BEAK_PATH,
  WEAPON_BAZOOKA_ROCKET_NOSE_PATH,
  WEAPON_HOLY_GRENADE_PATH,
};

export function renderHeldWeapon(
  ctx: CanvasRenderingContext2D,
  weaponId: string,
  aimRad: number,
  animTime: number
) {
  ctx.save();
  ctx.translate(5, -4);
  ctx.rotate(-aimRad);

  if (weaponId === 'bazooka') {
    // --- MILITARY RPG BAZOOKA ---
    ctx.fillStyle = '#3f3f46';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.3;
    ctx.fillRect(0, -3.5, 17, 6);
    ctx.strokeRect(0, -3.5, 17, 6);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(9, -3.5, 2.5, 6);
    // Rocket Nose loaded inside
    ctx.fillStyle = '#ef4444';
    ctx.fill(WEAPON_BAZOOKA_ROCKET_NOSE_PATH);
    // Top Sight
    ctx.fillStyle = '#18181b';
    ctx.fillRect(4, -5.5, 4, 2);
  } else if (weaponId === 'homing_missile') {
    // --- HIGH-TECH HOMING LASER LAUNCHER ---
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.3;
    ctx.fillRect(0, -4, 18, 7);
    ctx.strokeRect(0, -4, 18, 7);
    // Cyan Sensor Stripe & Scope
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, -6, 6, 2.5);
    ctx.fillRect(14, -4, 3, 7);
    // Glowing Antenna Tip
    ctx.fillStyle = Math.sin(animTime * 12) > 0 ? '#38bdf8' : '#0284c7';
    ctx.beginPath();
    ctx.arc(4, -7.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponId === 'grenade') {
    // --- ARMY GREEN PINEAPPLE FRAG GRENADE ---
    ctx.fillStyle = getGrenadeGrad(ctx);
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_GRENADE_PATH);
    ctx.stroke(WEAPON_GRENADE_PATH);
    // Fragmentation grid
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 0.8;
    ctx.stroke(WEAPON_GRENADE_GRID_PATH);
    // Silver spoon lever & pin
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(6.5, -5.5, 3, 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (weaponId === 'banana_bomb') {
    // --- CURVED TROPICAL BANANA BOMB ---
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_BANANA_PATH);
    ctx.stroke(WEAPON_BANANA_PATH);
    // Green tip & brown stalk
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillStyle = '#713f12';
    ctx.fillRect(13, -3, 2.5, 2.5);
  } else if (weaponId === 'dynamite') {
    // --- RED TNT DYNAMITE STICK ---
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -5, 9, 10);
    ctx.strokeRect(3, -5, 9, 10);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, -2, 9, 3);
    // Spark
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(13, -6.5, 2.5 + Math.sin(animTime * 18) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponId === 'holy_grenade') {
    // --- GOLDEN HOLY HAND GRENADE ---
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_HOLY_GRENADE_PATH);
    ctx.stroke(WEAPON_HOLY_GRENADE_PATH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, -7.5, 2, 5.5);
    ctx.fillRect(5.5, -5.5, 5, 2);
  } else if (weaponId === 'shotgun') {
    // --- DOUBLE BARREL SHOTGUN ---
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -2.5, 15, 4);
    ctx.strokeRect(3, -2.5, 15, 4);
    // Wooden Stock
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -1.5, 6, 4.5);
    // Muzzle Openings
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(17, -2.5, 1.5, 4);
  } else if (weaponId === 'baseball_bat') {
    // --- WOODEN BASEBALL BAT ---
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.fill(WEAPON_BAT_PATH);
    ctx.stroke(WEAPON_BAT_PATH);
    // White Grip Tape
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(2, 0, 4, 2.5);
  } else if (weaponId === 'prod') {
    // --- ELECTRIC CATTLE PROD ---
    ctx.fillStyle = '#334155';
    ctx.fillRect(1, -1.5, 12, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, -3, 3, 6);
    // Electric Spark Tip
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(19 + Math.sin(animTime * 20) * 2, -2 + Math.cos(animTime * 20) * 2);
    ctx.lineTo(21, 0);
    ctx.stroke();
  } else if (weaponId === 'blowtorch') {
    // --- WELDING BLOWTORCH WITH ROARING FLAME ---
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2, -2, 10, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(11, -1, 4, 2);
    // Welding Flame
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
  } else if (weaponId === 'air_strike') {
    // --- TACTICAL RADIO BEACON ---
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -5, 7, 10);
    ctx.strokeRect(3, -5, 7, 10);
    // Antenna
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(5, -5); ctx.lineTo(5, -10);
    ctx.stroke();
    // Blinking Red LED
    ctx.fillStyle = Math.sin(animTime * 10) > 0 ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(5, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponId === 'homing_pigeon') {
    // --- CARRIER PIGEON IN HAND ---
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.1;
    ctx.fill(WEAPON_PIGEON_BODY_PATH);
    ctx.stroke(WEAPON_PIGEON_BODY_PATH);
    // Beak
    ctx.fillStyle = '#f97316';
    ctx.fill(WEAPON_PIGEON_BEAK_PATH);
    // Aviator Goggles
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(10, -1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponId === 'super_sheep') {
    // --- SUPER SHEEP IN HAND ---
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, -1, 4.5, 0, Math.PI * 2);
    ctx.arc(9, 1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Red cape
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1, -2, 4, 6);
  } else if (weaponId === 'concrete_donkey') {
    // --- MINI CONCRETE DONKEY IN HAND ---
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(4, -5, 8, 9);
    ctx.strokeRect(4, -5, 8, 9);
    // Ears
    ctx.fillRect(8, -8, 2, 4);
    ctx.fillRect(10, -8, 2, 4);
  } else if (weaponId === 'teleport') {
    // --- QUANTUM TELEPORT REMOTE ---
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -4, 8, 8);
    // Pulsing Portal Ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(7, 0, 3 + Math.sin(animTime * 12) * 1, 0, Math.PI * 2);
    ctx.stroke();
  } else if (weaponId === 'ninja_rope') {
    // --- NINJA ROPE GRAPPLING HOOK ---
    ctx.fillStyle = '#334155';
    ctx.fillRect(2, -2, 8, 4);
    // Hook Prongs
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(14, 0);
    ctx.moveTo(12, -4); ctx.lineTo(14, 0); ctx.lineTo(12, 4);
    ctx.stroke();
  } else if (weaponId === 'girder') {
    // --- STEEL I-BEAM GIRDER ---
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.fillRect(3, -6, 6, 12);
    ctx.strokeRect(3, -6, 6, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, -4, 4, 8);
  } else if (weaponId === 'skip_turn') {
    // --- SURRENDER / SKIP FLAG ---
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 4); ctx.lineTo(4, -10);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, -10, 8, 5);
  } else {
    // Generic Utility Device
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(7, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

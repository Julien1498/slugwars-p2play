import { createPath } from './slugGradients';

export const WEAPON_BAT_PATH = createPath((p) => {
  p.moveTo(1, 2);
  p.lineTo(4, 2);
  p.lineTo(18, -2.5);
  p.lineTo(16, -6);
  p.lineTo(1, 0);
  p.closePath();
});

export const WEAPON_BANANA_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(8, 0, 7.5, 3.8, 0.4, 0, Math.PI * 2);
  }
});

export const WEAPON_GRENADE_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(8, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
  }
});

export const WEAPON_GRENADE_GRID_PATH = createPath((p) => {
  p.moveTo(4, 0);
  p.lineTo(12, 0);
  p.moveTo(8, -3.5);
  p.lineTo(8, 3.5);
});

export const WEAPON_PIGEON_BODY_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(7, 0, 5.5, 3.8, 0, 0, Math.PI * 2);
  }
});

export const WEAPON_PIGEON_BEAK_PATH = createPath((p) => {
  p.moveTo(12, -1);
  p.lineTo(15, 0);
  p.lineTo(12, 1);
  p.closePath();
});

export const WEAPON_BAZOOKA_ROCKET_NOSE_PATH = createPath((p) => {
  p.moveTo(17, -2.5);
  p.lineTo(21, 0);
  p.lineTo(17, 2.5);
  p.closePath();
});

export const WEAPON_HOLY_GRENADE_PATH = createPath((p) => {
  p.arc(8, 0, 5.2, 0, Math.PI * 2);
});

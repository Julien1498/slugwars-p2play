import { createPath } from './slugGradients';

// 1. Casque Super-Patriote
export const HAT_PATRIOT_DOME = createPath((p) => {
  p.moveTo(-3, -12);
  p.quadraticCurveTo(4, -19, 11, -12);
  p.quadraticCurveTo(4, -13, -3, -12);
  p.closePath();
});

// 2. Masque Titane Doré
export const HAT_TITANIUM_FACEPLATE = createPath((p) => {
  p.moveTo(0, -13.5);
  p.lineTo(8.5, -13.5);
  p.lineTo(9.5, -6);
  p.lineTo(7.5, -4);
  p.lineTo(1, -4);
  p.lineTo(-0.5, -6);
  p.closePath();
});

// 3. Cornes de la Malice
export const HAT_MISCHIEF_HORN_L = createPath((p) => {
  p.moveTo(-1, -12);
  p.bezierCurveTo(-4, -18, -6, -24, -3, -27);
  p.bezierCurveTo(-1, -28, -2, -24, 1.5, -13);
  p.closePath();
});

export const HAT_MISCHIEF_HORN_R = createPath((p) => {
  p.moveTo(6.5, -13);
  p.bezierCurveTo(9, -24, 11, -28, 13, -27);
  p.bezierCurveTo(14, -24, 12, -18, 9, -12);
  p.closePath();
});

// 4. Ailes du Dieu du Tonnerre
export const HAT_THUNDER_WING_L = createPath((p) => {
  p.moveTo(-2, -12);
  p.lineTo(-5, -23);
  p.lineTo(-2, -20);
  p.lineTo(-3, -15);
  p.closePath();
});

export const HAT_THUNDER_WING_R = createPath((p) => {
  p.moveTo(10, -12);
  p.lineTo(13, -23);
  p.lineTo(10, -20);
  p.lineTo(11, -15);
  p.closePath();
});

// 5. Bandeau du Village Caché
export const HAT_VILLAGE_PLATE = createPath((p) => {
  p.moveTo(0.5, -13.5);
  p.lineTo(8.5, -13.5);
  p.quadraticCurveTo(9, -11, 8.5, -9);
  p.lineTo(0.5, -9);
  p.quadraticCurveTo(0, -11, 0.5, -13.5);
  p.closePath();
});

// 6. Tignasse Démon Renard
export const HAT_SHINOBI_HAIR_SPIKES = createPath((p) => {
  p.moveTo(-2, -13);
  p.lineTo(-4, -20);
  p.lineTo(0, -16);
  p.lineTo(2, -23);
  p.lineTo(5, -17);
  p.lineTo(8, -22);
  p.lineTo(9, -16);
  p.lineTo(12, -19);
  p.lineTo(10.5, -12.5);
  p.closePath();
});

// 7. Paille des Déserteurs
export const HAT_RENEGADE_CONE = createPath((p) => {
  p.moveTo(-6, -11);
  p.lineTo(4, -22);
  p.lineTo(14, -11);
  p.quadraticCurveTo(4, -12.5, -6, -11);
  p.closePath();
});

// 8. Masque des Forces Secrètes
export const HAT_SHADOW_MASK = createPath((p) => {
  p.moveTo(6, -12);
  p.lineTo(5, -18);
  p.lineTo(7.5, -15.5);
  p.lineTo(10, -18);
  p.lineTo(9, -12);
  p.quadraticCurveTo(11, -8, 7.5, -5);
  p.quadraticCurveTo(4, -8, 6, -12);
  p.closePath();
});

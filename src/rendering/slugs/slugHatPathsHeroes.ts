import { createPath } from './slugGradients';

// 1. Casque Super-Patriote
export const HAT_PATRIOT_SHELL = createPath((p) => {
  p.moveTo(-3.5, 0.5);
  p.lineTo(-4.2, -6);
  p.lineTo(-4.0, -14.0);
  p.bezierCurveTo(-3, -20.5, 2, -20.5, 5, -19.5);
  p.bezierCurveTo(9, -19.5, 12.2, -16.5, 12.2, -13);
  p.lineTo(12.0, 0.5);
  p.quadraticCurveTo(4.5, 2.5, -3.5, 0.5);
  p.closePath();
});

export const HAT_PATRIOT_VISOR_BRIM = createPath((p) => {
  p.moveTo(-3.5, -12.5);
  p.quadraticCurveTo(4.5, -15.5, 12.0, -12.0);
  p.quadraticCurveTo(4.5, -13.5, -3.5, -12.5);
  p.closePath();
});

export const HAT_PATRIOT_WING_L = createPath((p) => {
  p.moveTo(-1.0, -13.5);
  p.lineTo(-5.5, -18.5); p.lineTo(-3.5, -16.5);
  p.lineTo(-6.5, -16.0); p.lineTo(-4.0, -14.5);
  p.lineTo(-5.5, -13.8); p.lineTo(-2.0, -13.0);
  p.closePath();
});

export const HAT_PATRIOT_WING_R = createPath((p) => {
  p.moveTo(9.5, -13.0);
  p.lineTo(13.8, -18.0); p.lineTo(11.8, -16.0);
  p.lineTo(14.8, -15.5); p.lineTo(12.2, -14.0);
  p.lineTo(13.8, -13.2); p.lineTo(10.5, -12.5);
  p.closePath();
});

export const HAT_PATRIOT_LETTER_A = createPath((p) => {
  p.moveTo(2.2, -13.0);
  p.lineTo(4.5, -18.5);
  p.lineTo(6.8, -13.0);
  p.lineTo(5.4, -13.0);
  p.lineTo(4.9, -14.5);
  p.lineTo(4.1, -14.5);
  p.lineTo(3.6, -13.0);
  p.closePath();
  p.moveTo(4.5, -17.2);
  p.lineTo(4.2, -15.4);
  p.lineTo(4.8, -15.4);
  p.closePath();
});

export const HAT_PATRIOT_LETTER_A_SHADOW = createPath((p) => {
  p.moveTo(2.5, -12.7);
  p.lineTo(4.8, -18.2);
  p.lineTo(7.1, -12.7);
  p.lineTo(5.7, -12.7);
  p.lineTo(5.2, -14.2);
  p.lineTo(4.4, -14.2);
  p.lineTo(3.9, -12.7);
  p.closePath();
  p.moveTo(4.8, -16.9);
  p.lineTo(4.5, -15.1);
  p.lineTo(5.1, -15.1);
  p.closePath();
});

export const HAT_PATRIOT_CHINSTRAP = createPath((p) => {
  p.moveTo(-3.5, 0.0);
  p.quadraticCurveTo(4.0, 4.0, 11.5, 0.0);
  p.lineTo(11.0, 1.4);
  p.quadraticCurveTo(4.0, 5.2, -3.0, 1.4);
  p.closePath();
});

// 2. Masque Titane Doré
export const HAT_TITANIUM_HELMET_BASE = createPath((p) => {
  p.moveTo(-3.5, 1.0);
  p.lineTo(-4.2, -6);
  p.lineTo(-4.0, -14.5);
  p.bezierCurveTo(-3, -20.5, 2, -20.5, 5, -19.5);
  p.bezierCurveTo(9, -19.5, 12.2, -16.5, 12.2, -13);
  p.lineTo(12.0, 1.0);
  p.quadraticCurveTo(4.5, 3.0, -3.5, 1.0);
  p.closePath();
});

export const HAT_TITANIUM_FACEPLATE = createPath((p) => {
  p.moveTo(-0.5, -14.5);
  p.lineTo(9.5, -14.5);
  p.lineTo(11.0, -11.5);
  p.lineTo(10.5, -4.5);
  p.lineTo(7.5, -2.5);
  p.lineTo(1.5, -2.5);
  p.lineTo(-1.2, -4.5);
  p.lineTo(-0.8, -11.5);
  p.closePath();
});

export const HAT_TITANIUM_CHEEK_RECESS = createPath((p) => {
  p.moveTo(-0.8, -5.5); p.lineTo(1.2, -3.5); p.lineTo(1.2, -6.5); p.closePath();
  p.moveTo(10.0, -5.5); p.lineTo(7.8, -3.5); p.lineTo(7.8, -6.5); p.closePath();
});

export const HAT_TITANIUM_EYE_L = createPath((p) => {
  p.moveTo(0.5, -11.2);
  p.lineTo(3.8, -11.2);
  p.lineTo(3.4, -9.6);
  p.lineTo(1.0, -9.6);
  p.closePath();
});

export const HAT_TITANIUM_EYE_R = createPath((p) => {
  p.moveTo(6.2, -10.5);
  p.lineTo(9.5, -10.5);
  p.lineTo(9.1, -8.9);
  p.lineTo(6.6, -8.9);
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

// 8. Masque des Forces Secrètes (Porcelaine Kitsune)
export const HAT_SHADOW_MASK_PORCELAIN = createPath((p) => {
  p.moveTo(-2.5, -11.5);
  p.lineTo(-3.8, -18.5);
  p.lineTo(-1.0, -15.0);
  p.quadraticCurveTo(4.5, -16.5, 9.0, -14.5);
  p.lineTo(11.8, -18.0);
  p.lineTo(10.5, -11.5);
  p.quadraticCurveTo(12.0, -6.0, 8.5, -2.8);
  p.quadraticCurveTo(4.5, -1.0, 0.5, -2.8);
  p.quadraticCurveTo(-3.0, -6.0, -2.5, -11.5);
  p.closePath();
});

export const HAT_SHADOW_MASK_INNER_EARS = createPath((p) => {
  p.moveTo(-2.8, -12.5); p.lineTo(-3.4, -17.2); p.lineTo(-1.4, -14.5); p.closePath();
  p.moveTo(9.8, -12.5); p.lineTo(11.2, -16.8); p.lineTo(9.2, -14.2); p.closePath();
});

export const HAT_SHADOW_MASK_EYES = createPath((p) => {
  p.moveTo(0.2, -10.8);
  p.quadraticCurveTo(2.2, -11.5, 3.8, -9.8);
  p.quadraticCurveTo(2.2, -9.8, 0.2, -10.8);
  p.closePath();

  p.moveTo(6.0, -9.8);
  p.quadraticCurveTo(7.8, -11.2, 9.8, -10.2);
  p.quadraticCurveTo(7.8, -9.5, 6.0, -9.8);
  p.closePath();
});

export const HAT_SHADOW_MASK_WARPAINT = createPath((p) => {
  p.moveTo(4.5, -15.5); p.lineTo(3.8, -12.5); p.lineTo(5.2, -12.5); p.closePath();
  p.moveTo(-1.8, -8.0); p.quadraticCurveTo(0.5, -7.0, 1.2, -5.5);
  p.moveTo(-1.5, -6.0); p.quadraticCurveTo(0.2, -5.5, 1.0, -4.2);
  p.moveTo(10.2, -8.0); p.quadraticCurveTo(8.0, -7.0, 7.5, -5.5);
  p.moveTo(9.8, -6.0); p.quadraticCurveTo(8.2, -5.5, 7.8, -4.2);
  p.moveTo(4.0, -3.8); p.lineTo(5.0, -3.8); p.lineTo(4.5, -3.0); p.closePath();
});

export const HAT_SHADOW_MASK_CORD = createPath((p) => {
  p.moveTo(-2.2, -9.0);
  p.quadraticCurveTo(-4.5, -6.0, -3.5, 1.0);
  p.lineTo(-2.5, 3.5);
  p.lineTo(-4.5, 3.5);
  p.closePath();
});

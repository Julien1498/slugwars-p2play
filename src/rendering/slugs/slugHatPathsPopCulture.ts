import { createPath } from './slugGradients';

// 1. Trompes du Marais
export const HAT_SWAMP_EAR_LEFT = createPath((p) => {
  p.moveTo(0.5, -12);
  p.lineTo(-2.5, -20);
  p.lineTo(-0.5, -21);
  p.lineTo(2.5, -13);
  p.closePath();
});

export const HAT_SWAMP_EAR_RIGHT = createPath((p) => {
  p.moveTo(6.5, -12);
  p.lineTo(9.5, -20);
  p.lineTo(11.5, -19);
  p.lineTo(8.5, -13);
  p.closePath();
});

// 2. Feutre du Matou Mousquetaire
export const HAT_FELINE_BRIM = createPath((p) => {
  p.moveTo(-6, -11.5);
  p.quadraticCurveTo(4, -14, 14, -11);
  p.quadraticCurveTo(12, -14, 10, -17);
  p.quadraticCurveTo(4, -13, -6, -11.5);
  p.closePath();
});

export const HAT_FELINE_CROWN = createPath((p) => {
  p.moveTo(-2, -12.5);
  p.lineTo(-1, -17.5);
  p.quadraticCurveTo(4, -17, 8, -17.5);
  p.lineTo(9, -12.5);
  p.closePath();
});

// 3. Mini-Couronne Tyran
export const HAT_MINI_CORONET = createPath((p) => {
  p.moveTo(4, -13);
  p.lineTo(3.5, -18);
  p.lineTo(5.5, -15.5);
  p.lineTo(7.5, -18.5);
  p.lineTo(9.5, -15.5);
  p.lineTo(11.5, -18);
  p.lineTo(11, -13);
  p.closePath();
});

// 4. Pointes Supersoniques
export const HAT_SUPERSONIC_SPIKES = createPath((p) => {
  p.moveTo(4, -14);
  p.quadraticCurveTo(-2, -22, -9, -20);
  p.quadraticCurveTo(-4, -16, 0, -13);
  p.quadraticCurveTo(-6, -15, -11, -12);
  p.quadraticCurveTo(-5, -9, 0, -8);
  p.quadraticCurveTo(-5, -8, -8, -5);
  p.quadraticCurveTo(-2, -3, 3, -4);
  p.closePath();
});

// 5. Oreilles de Renard Turbo
export const HAT_TWINFOX_EAR_L = createPath((p) => {
  p.moveTo(-1, -12);
  p.lineTo(-2, -20);
  p.lineTo(3, -14);
  p.closePath();
});

export const HAT_TWINFOX_EAR_R = createPath((p) => {
  p.moveTo(5, -12.5);
  p.lineTo(9, -20);
  p.lineTo(10, -13);
  p.closePath();
});

// 6. Bacchantes du Savant Fou
export const HAT_MAD_MOUSTACHE = createPath((p) => {
  p.moveTo(4.5, -5.5);
  p.quadraticCurveTo(-1, -6, -5, -4);
  p.quadraticCurveTo(-6, -8, -4, -9);
  p.quadraticCurveTo(0, -7, 4.5, -6);
  p.quadraticCurveTo(9, -7, 13, -9);
  p.quadraticCurveTo(15, -8, 14, -4);
  p.quadraticCurveTo(10, -6, 4.5, -5.5);
  p.closePath();
});

// 7. Cagoule de Braqueur
export const HAT_BANDIT_BALACLAVA = createPath((p) => {
  p.moveTo(-3.5, 1);
  p.lineTo(-4, -14.5);
  p.quadraticCurveTo(4, -19.5, 12, -14.5);
  p.lineTo(12, 1);
  p.quadraticCurveTo(4, 3, -3.5, 1);
  p.closePath();
});

// 8. Casque d'Assaut Tactique
export const HAT_SWAT_POT = createPath((p) => {
  p.moveTo(-4, -12);
  p.quadraticCurveTo(4, -20, 12, -12);
  p.lineTo(13.5, -11);
  p.quadraticCurveTo(4, -13.5, -4.5, -11);
  p.closePath();
});

// 9. Poulet Tactique
export const HAT_CHICKEN_BODY = createPath((p) => {
  p.moveTo(0, -13);
  p.quadraticCurveTo(4, -11, 8.5, -13);
  p.quadraticCurveTo(9.5, -17.5, 5, -18);
  p.lineTo(-1, -16.5);
  p.closePath();
});

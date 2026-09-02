import { createPath } from './slugGradients';

// 1. Toque de Chef
export const HAT_CHEF_BAND_PATH = createPath((p) => {
  p.moveTo(-2.5, -12.2);
  p.lineTo(10.5, -12.2);
  p.lineTo(10.5, -14.2);
  p.lineTo(-2.5, -14.2);
  p.closePath();
});

export const HAT_CHEF_CROWN_PATH = createPath((p) => {
  p.moveTo(-3, -14.2);
  p.bezierCurveTo(-5.5, -20, -4, -25, 0, -25.5);
  p.bezierCurveTo(2, -27, 6, -27, 8, -25.5);
  p.bezierCurveTo(12, -25, 13.5, -20, 11, -14.2);
  p.closePath();
});

// 2. Chapeau de Mage
export const HAT_WIZARD_BRIM_PATH = createPath((p) => {
  p.moveTo(-6.5, -12);
  p.quadraticCurveTo(4, -14.5, 14.5, -11.5);
  p.quadraticCurveTo(4, -10, -6.5, -12);
  p.closePath();
});

export const HAT_WIZARD_CONE_PATH = createPath((p) => {
  p.moveTo(-2.5, -12.5);
  p.bezierCurveTo(-0.5, -18, 0, -24, -2, -27);
  p.lineTo(-4, -27);
  p.bezierCurveTo(3, -24, 7, -18, 10.5, -12.5);
  p.closePath();
});

// 3. Casque de Chantier
export const HAT_HARDHAT_DOME_PATH = createPath((p) => {
  p.moveTo(-4, -12);
  p.quadraticCurveTo(4, -19.5, 12, -12);
  p.lineTo(14.5, -11.5);
  p.quadraticCurveTo(4, -12.5, -4.5, -11.8);
  p.closePath();
});

// 4. Fedora Détective
export const HAT_DETECTIVE_BRIM_PATH = createPath((p) => {
  p.moveTo(-5.5, -12);
  p.quadraticCurveTo(4, -14, 13.5, -11.5);
  p.quadraticCurveTo(4, -10.5, -5.5, -12);
  p.closePath();
});

export const HAT_DETECTIVE_CROWN_PATH = createPath((p) => {
  p.moveTo(-2, -12.5);
  p.lineTo(-1, -18.5);
  p.quadraticCurveTo(4, -17.5, 9, -18.5);
  p.lineTo(10, -12.5);
  p.closePath();
});

// 5. Masque & Tuba
export const HAT_SNORKEL_MASK_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(5.0, -9.5, 7.5, 4.0, 0.05, 0, Math.PI * 2);
  }
});

// 6. Caneton de Bain
export const HAT_DUCK_BODY_PATH = createPath((p) => {
  p.moveTo(-2, -13.5);
  p.quadraticCurveTo(3, -12, 8, -13.5);
  p.quadraticCurveTo(9, -16.5, 5, -17);
  p.lineTo(-2.5, -15.5);
  p.closePath();
});

// 7. Casquette à Hélice
export const HAT_PROPELLER_CAP_PATH = createPath((p) => {
  p.moveTo(-3, -12.5);
  p.quadraticCurveTo(4, -18, 11, -12.8);
  p.lineTo(14, -11.8);
  p.lineTo(10.5, -11.8);
  p.closePath();
});

// 8. Flèche Traversante
export const HAT_ARROW_HEAD_PATH = createPath((p) => {
  p.moveTo(13, -10);
  p.lineTo(17.5, -10);
  p.lineTo(15.5, -12.5);
  p.moveTo(17.5, -10);
  p.lineTo(15.5, -7.5);
});

// 9. Passoire en Inox
export const HAT_COLANDER_BOWL_PATH = createPath((p) => {
  p.moveTo(-3.5, -12);
  p.quadraticCurveTo(4, -18.5, 11.5, -12);
  p.closePath();
});

// 10. Bulle d'Astronaute
export const HAT_ASTRONAUT_COLLAR_PATH = createPath((p) => {
  p.moveTo(-4, -2.5);
  p.lineTo(12, -2.5);
  p.lineTo(11, -0.5);
  p.lineTo(-3, -0.5);
  p.closePath();
});

// 11. Masque à Gaz
export const HAT_GASMASK_SNOUT_PATH = createPath((p) => {
  p.moveTo(7, -9);
  p.lineTo(12.5, -8);
  p.lineTo(11.5, -3.5);
  p.lineTo(6.5, -4);
  p.closePath();
});

// 12. Casque de Boxe
export const HAT_BOXER_GUARD_PATH = createPath((p) => {
  p.moveTo(-3.5, -4.0);
  p.lineTo(-4.0, -13.0);
  p.quadraticCurveTo(4, -18.5, 12.0, -13.0);
  p.lineTo(11.5, -4.0);
  p.lineTo(9.5, -4.5);
  p.lineTo(10.0, -13.5);
  p.quadraticCurveTo(4, -15.0, -1.5, -13.5);
  p.lineTo(-1.0, -4.5);
  p.closePath();
});

// 13. Casque Filet Camo
export const HAT_CAMO_POT_PATH = createPath((p) => {
  p.moveTo(-4, -12);
  p.quadraticCurveTo(4, -19, 12, -12);
  p.quadraticCurveTo(4, -13.5, -4, -12);
  p.closePath();
});

// 14. Chapeau Champignon
export const HAT_MUSHROOM_CAP_PATH = createPath((p) => {
  p.moveTo(-5, -12);
  p.bezierCurveTo(-5.5, -18, 0, -22, 4, -22);
  p.bezierCurveTo(8, -22, 13.5, -18, 13, -12);
  p.quadraticCurveTo(4, -13.5, -5, -12);
  p.closePath();
});

// 15. Bonnet Grenouille
export const HAT_FROG_CAP_PATH = createPath((p) => {
  p.moveTo(-3, -12);
  p.quadraticCurveTo(4, -18, 11, -12);
  p.closePath();
});

// 16. Corne de Licorne
export const HAT_UNICORN_HORN_PATH = createPath((p) => {
  p.moveTo(3, -12.5);
  p.lineTo(8.5, -25);
  p.lineTo(5.5, -12.5);
  p.closePath();
});

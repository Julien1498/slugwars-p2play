import { createPath } from './slugGradients';

// 1. Optique Cyclope & Trois Épis
export const HAT_MONO_STRAP = createPath((p) => {
  p.moveTo(-3.5, -11.0);
  p.lineTo(13.5, -11.0);
  p.lineTo(13.5, -9.0);
  p.lineTo(-3.5, -9.0);
  p.closePath();
});

// 2. Bésicles d'Atelier & Palmier
export const HAT_BINOCULAR_STRAP = createPath((p) => {
  p.moveTo(-3.5, -10.5);
  p.lineTo(13.5, -10.5);
  p.lineTo(13.5, -8.5);
  p.lineTo(-3.5, -8.5);
  p.closePath();
});

// 3. Bonnet Laine à Pompon
export const HAT_BEANIE_DOME = createPath((p) => {
  p.moveTo(-2.5, -12.5);
  p.quadraticCurveTo(-3.0, -21.5, 5.0, -22.0);
  p.quadraticCurveTo(13.0, -21.5, 12.5, -12.5);
  p.closePath();
});

export const HAT_BEANIE_CUFF = createPath((p) => {
  p.moveTo(-3.2, -13.5);
  p.lineTo(13.2, -13.5);
  p.lineTo(13.2, -10.8);
  p.lineTo(-3.2, -10.8);
  p.closePath();
});

// 4. Casque de Chantier Protecteur
export const HAT_SAFETY_HELMET_DOME = createPath((p) => {
  p.moveTo(-2.5, -12.5);
  p.quadraticCurveTo(5.0, -21.0, 12.5, -12.5);
  p.closePath();
});

export const HAT_SAFETY_HELMET_BRIM = createPath((p) => {
  p.moveTo(-4.5, -12.0);
  p.quadraticCurveTo(5.0, -15.0, 14.5, -12.0);
  p.lineTo(13.5, -10.5);
  p.quadraticCurveTo(5.0, -13.5, -3.5, -10.5);
  p.closePath();
});

// 5. Grandes Oreilles Galactiques
export const HAT_SPECIMEN_EAR_L = createPath((p) => {
  p.moveTo(0.5, -12.5);
  p.quadraticCurveTo(-6.0, -16.5, -9.5, -13.5);
  p.lineTo(-8.5, -11.5);
  p.lineTo(-10.5, -10.5);
  p.quadraticCurveTo(-8.0, -8.5, 1.5, -11.0);
  p.closePath();
});

export const HAT_SPECIMEN_EAR_R = createPath((p) => {
  p.moveTo(9.5, -12.5);
  p.quadraticCurveTo(16.0, -16.5, 19.5, -13.5);
  p.quadraticCurveTo(18.0, -8.5, 8.5, -11.0);
  p.closePath();
});

// 6. Antennes & Pavillons d'Angelot
export const HAT_CHARMER_EAR_L = createPath((p) => {
  p.moveTo(0.5, -12.5);
  p.quadraticCurveTo(-5.5, -15.5, -8.5, -12.5);
  p.quadraticCurveTo(-7.0, -8.0, 1.5, -11.0);
  p.closePath();
});

export const HAT_CHARMER_EAR_R = createPath((p) => {
  p.moveTo(9.5, -12.5);
  p.quadraticCurveTo(15.5, -15.5, 18.5, -12.5);
  p.quadraticCurveTo(17.0, -8.0, 8.5, -11.0);
  p.closePath();
});

// 7. Couronne Tropicale d'Hibiscus
export const HAT_HIBISCUS_LEAVES = createPath((p) => {
  p.moveTo(-3.0, -12.0);
  p.quadraticCurveTo(5.0, -16.5, 13.0, -12.0);
  p.quadraticCurveTo(5.0, -13.5, -3.0, -12.0);
  p.closePath();
});

// 8. Passe-Montagne Bleuté d'Alien
export const HAT_ALIEN_HOOD_BASE = createPath((p) => {
  p.moveTo(-3.0, -10.0);
  p.quadraticCurveTo(-3.5, -19.0, 5.0, -19.5);
  p.quadraticCurveTo(13.5, -19.0, 13.0, -10.0);
  p.quadraticCurveTo(5.0, -12.5, -3.0, -10.0);
  p.closePath();
});

// 9. Stetson Shérif à Surpiqûres
export const HAT_BRAIDED_STETSON_BRIM = createPath((p) => {
  p.moveTo(-5.5, -12.0);
  p.quadraticCurveTo(5.0, -16.5, 15.5, -12.0);
  p.quadraticCurveTo(16.5, -10.0, 14.5, -9.5);
  p.quadraticCurveTo(5.0, -14.0, -4.5, -9.5);
  p.closePath();
});

export const HAT_BRAIDED_STETSON_CROWN = createPath((p) => {
  p.moveTo(-1.0, -13.0);
  p.quadraticCurveTo(0.0, -21.0, 3.5, -19.5);
  p.quadraticCurveTo(5.0, -21.5, 6.5, -19.5);
  p.quadraticCurveTo(10.0, -21.0, 11.0, -13.0);
  p.closePath();
});

// 10. Cagoule d'Astronaute Galactique
export const HAT_COSMO_COWL_HEAD = createPath((p) => {
  p.moveTo(-2.5, -11.0);
  p.quadraticCurveTo(-3.0, -19.5, 5.0, -20.0);
  p.quadraticCurveTo(13.0, -19.5, 12.5, -11.0);
  p.quadraticCurveTo(5.0, -12.5, -2.5, -11.0);
  p.closePath();
});

// 11. Triple-Regard & Sonde Spatiale
export const HAT_TRI_OCULAR_DOME = createPath((p) => {
  p.moveTo(-2.0, -12.0);
  p.quadraticCurveTo(5.0, -18.0, 12.0, -12.0);
  p.closePath();
});

// 12. Chapeau Melon Jouet Lustré
export const HAT_DERBY_CROWN = createPath((p) => {
  p.moveTo(0.5, -13.0);
  p.quadraticCurveTo(0.0, -20.5, 5.0, -21.0);
  p.quadraticCurveTo(10.0, -20.5, 9.5, -13.0);
  p.closePath();
});

export const HAT_DERBY_BRIM = createPath((p) => {
  p.moveTo(-2.5, -12.0);
  p.quadraticCurveTo(5.0, -15.0, 12.5, -12.0);
  p.quadraticCurveTo(13.0, -11.0, 11.5, -10.5);
  p.quadraticCurveTo(5.0, -13.5, -1.5, -10.5);
  p.closePath();
});

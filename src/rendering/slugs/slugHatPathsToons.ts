import { createPath } from './slugGradients';

// 1. Toque du Cuistot Subaquatique
export const HAT_MARINE_COOK_CROWN = createPath((p) => {
  p.moveTo(-1.5, -13.5);
  p.quadraticCurveTo(-2.5, -22.5, 5.0, -23.5);
  p.quadraticCurveTo(12.5, -22.5, 11.5, -13.5);
  p.quadraticCurveTo(5.0, -14.5, -1.5, -13.5);
  p.closePath();
});

export const HAT_MARINE_COOK_BAND = createPath((p) => {
  p.moveTo(-1.8, -13.5);
  p.lineTo(-1.8, -11.5);
  p.quadraticCurveTo(5.0, -12.5, 11.8, -11.5);
  p.lineTo(11.8, -13.5);
  p.quadraticCurveTo(5.0, -14.5, -1.8, -13.5);
  p.closePath();
});

// 2. Calotte d'Éponge Alvéolée
export const HAT_SPONGE_DOME_BODY = createPath((p) => {
  p.moveTo(-2.5, -13.0);
  p.lineTo(-2.5, -20.5);
  p.quadraticCurveTo(5.0, -22.0, 12.5, -20.5);
  p.lineTo(12.5, -13.0);
  p.quadraticCurveTo(5.0, -14.5, -2.5, -13.0);
  p.closePath();
});

// 3. Pointe d'Étoile Pastel
export const HAT_STARFISH_CONE = createPath((p) => {
  p.moveTo(-1.0, -13.5);
  p.quadraticCurveTo(4.0, -20.0, 5.0, -25.5);
  p.quadraticCurveTo(6.0, -20.0, 11.0, -13.5);
  p.quadraticCurveTo(5.0, -15.0, -1.0, -13.5);
  p.closePath();
});

// 4. Casquette Soda du Premier
export const HAT_SODA_VISOR = createPath((p) => {
  p.moveTo(-2.0, -13.0);
  p.quadraticCurveTo(5.0, -16.5, 12.0, -13.0);
  p.quadraticCurveTo(14.0, -12.0, 15.0, -10.5);
  p.quadraticCurveTo(5.0, -12.0, -2.0, -13.0);
  p.closePath();
});

export const HAT_SODA_CROWN = createPath((p) => {
  p.moveTo(-2.0, -13.0);
  p.quadraticCurveTo(5.0, -19.5, 12.0, -13.0);
  p.closePath();
});

export const HAT_SODA_CAN_L = createPath((p) => {
  p.rect(-5.5, -19.5, 3.2, 6.0);
});

export const HAT_SODA_CAN_R = createPath((p) => {
  p.rect(12.2, -19.5, 3.2, 6.0);
});

// 5. Grand Nœud Papillon Écarlate
export const HAT_CRIMSON_BOW_L = createPath((p) => {
  p.moveTo(5.0, -17.5);
  p.bezierCurveTo(2.0, -24.5, -4.0, -24.0, -2.5, -17.0);
  p.quadraticCurveTo(1.5, -15.5, 5.0, -17.5);
  p.closePath();
});

export const HAT_CRIMSON_BOW_R = createPath((p) => {
  p.moveTo(5.0, -17.5);
  p.bezierCurveTo(8.0, -24.5, 14.0, -24.0, 12.5, -17.0);
  p.quadraticCurveTo(8.5, -15.5, 5.0, -17.5);
  p.closePath();
});

export const HAT_CRIMSON_BOW_TAIL_L = createPath((p) => {
  p.moveTo(4.0, -16.5);
  p.lineTo(-1.5, -11.0);
  p.lineTo(1.0, -11.0);
  p.lineTo(5.0, -16.0);
  p.closePath();
});

export const HAT_CRIMSON_BOW_TAIL_R = createPath((p) => {
  p.moveTo(6.0, -16.5);
  p.lineTo(11.5, -11.0);
  p.lineTo(9.0, -11.0);
  p.lineTo(5.0, -16.0);
  p.closePath();
});

// 6. Couettes Blondes Élastiques
export const HAT_TWINTAIL_BALL_L = createPath((p) => {
  if (p.ellipse) p.ellipse(-4.2, -13.5, 3.4, 3.8, 0, 0, Math.PI * 2);
  else p.arc(-4.2, -13.5, 3.5, 0, Math.PI * 2);
});

export const HAT_TWINTAIL_BALL_R = createPath((p) => {
  if (p.ellipse) p.ellipse(14.2, -13.0, 3.4, 3.8, 0, 0, Math.PI * 2);
  else p.arc(14.2, -13.0, 3.5, 0, Math.PI * 2);
});

// 7. Coupe Ébouriffée Noire
export const HAT_REBEL_HAIR = createPath((p) => {
  p.moveTo(-3.8, -10.5);
  p.lineTo(-5.2, -14.0);
  p.lineTo(-2.8, -14.5);
  p.quadraticCurveTo(5.0, -21.0, 12.8, -14.5);
  p.lineTo(15.2, -14.0);
  p.lineTo(13.8, -10.5);
  p.quadraticCurveTo(11.5, -13.5, 9.5, -13.2);
  p.quadraticCurveTo(5.0, -14.5, 0.5, -13.2);
  p.quadraticCurveTo(-1.5, -13.5, -3.8, -10.5);
  p.closePath();
});

// 8. Diadème aux Trois Cœurs
export const HAT_TRIO_BAND = createPath((p) => {
  p.moveTo(-2.5, -12.5);
  p.quadraticCurveTo(5.0, -18.5, 12.5, -12.5);
});

// 9. Coupe au Bol Aventurière
export const HAT_ADVENTURER_HAIR = createPath((p) => {
  p.moveTo(-3.5, -9.5);
  p.quadraticCurveTo(-4.5, -18.0, 5.0, -18.5);
  p.quadraticCurveTo(14.5, -18.0, 13.5, -9.5);
  p.quadraticCurveTo(12.0, -12.0, 9.5, -12.8);
  p.lineTo(0.5, -12.8);
  p.quadraticCurveTo(-2.0, -12.0, -3.5, -9.5);
  p.closePath();
});

// 10. Houppette du Petit Compagnon
export const HAT_MONKEY_CREST = createPath((p) => {
  p.moveTo(2.5, -14.0);
  p.bezierCurveTo(0.5, -19.0, 3.5, -23.0, 5.0, -24.5);
  p.bezierCurveTo(7.5, -22.0, 9.0, -18.5, 7.5, -14.0);
  p.closePath();
});

// 11. Besace Souriante Perchée
export const HAT_SATCHEL_BODY = createPath((p) => {
  p.moveTo(0.5, -13.5);
  p.lineTo(0.0, -20.5);
  p.quadraticCurveTo(5.0, -22.0, 10.0, -20.5);
  p.lineTo(9.5, -13.5);
  p.quadraticCurveTo(5.0, -14.5, 0.5, -13.5);
  p.closePath();
});

// 12. Chapeau Toile d'Exploration
export const HAT_SAFARI_BRIM = createPath((p) => {
  p.moveTo(-4.5, -12.0);
  p.quadraticCurveTo(5.0, -15.5, 14.5, -12.0);
  p.lineTo(13.5, -10.5);
  p.quadraticCurveTo(5.0, -13.5, -3.5, -10.5);
  p.closePath();
});

export const HAT_SAFARI_CROWN = createPath((p) => {
  p.moveTo(-1.5, -12.5);
  p.lineTo(-1.0, -18.0);
  p.quadraticCurveTo(5.0, -20.0, 11.0, -18.0);
  p.lineTo(11.5, -12.5);
  p.closePath();
});

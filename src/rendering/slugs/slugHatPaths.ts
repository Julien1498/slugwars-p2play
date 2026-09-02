import { createPath } from './slugGradients';

export const HAT_MILITARY_CROWN_PATH = createPath((p) => {
  p.moveTo(-3.5, -13);
  p.quadraticCurveTo(5, -14, 13, -12.5);
  p.lineTo(13.5, -14.5);
  p.quadraticCurveTo(9, -19.5, 4, -19);
  p.quadraticCurveTo(-2, -18.5, -4, -13.5);
  p.closePath();
});

export const HAT_MILITARY_RIM_PATH = createPath((p) => {
  p.moveTo(-3.5, -13);
  p.quadraticCurveTo(5, -14, 13, -12.5);
  p.lineTo(13.2, -11.7);
  p.quadraticCurveTo(5, -13.1, -3.8, -12.2);
  p.closePath();
});

export const HAT_MILITARY_BRAID_PATH = createPath((p) => {
  p.moveTo(-2, -13.3);
  p.quadraticCurveTo(5, -14.2, 12.5, -12.8);
});

export const HAT_MILITARY_VISOR_PATH = createPath((p) => {
  p.moveTo(6, -13.2);
  p.quadraticCurveTo(10, -13.5, 14.5, -12.2);
  p.quadraticCurveTo(10, -12.4, 6, -12.5);
  p.closePath();
});

export const HAT_BANDANA_HEADBAND_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(5, -12, 8.5, 3.5, 0.1, 0, Math.PI * 2);
  }
});

export const HAT_CYBER_GOGGLES_PATH = createPath((p) => {
  if (p.roundRect) {
    p.roundRect(-1.5, -13.5, 7, 7, 2);
    p.roundRect(5, -12.5, 6.5, 7, 2);
  } else if (p.rect) {
    p.rect(-1.5, -13.5, 7, 7);
    p.rect(5, -12.5, 6.5, 7);
  }
});

export const HAT_CYBER_LENSES_PATH = createPath((p) => {
  p.arc(2, -10, 2.2, 0, Math.PI * 2);
  p.moveTo(8 + 2.0, -9);
  p.arc(8, -9, 2.0, 0, Math.PI * 2);
});

export const HAT_COWBOY_PATH = createPath((p) => {
  p.moveTo(-4, -10);
  p.quadraticCurveTo(0, -18, 12, -13);
  p.quadraticCurveTo(8, -8, -4, -10);
  p.closePath();
});

export const HAT_CROWN_PATH = createPath((p) => {
  p.moveTo(-3, -11.5);
  p.lineTo(-4, -18);
  p.lineTo(-0.5, -14);
  p.lineTo(4, -19.5);
  p.lineTo(8.5, -14);
  p.lineTo(12, -18);
  p.lineTo(11, -11.5);
  p.closePath();
});

export const HAT_PIRATE_TRICORN_PATH = createPath((p) => {
  p.moveTo(-5, -11);
  p.quadraticCurveTo(3, -20, 13, -11);
  p.quadraticCurveTo(8, -14.5, 4, -14.5);
  p.quadraticCurveTo(0, -14.5, -5, -11);
  p.closePath();
});

export const HAT_TOPHAT_BRIM_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(4, -11, 8.5, 2.5, 0.05, 0, Math.PI * 2);
  }
});

export const HAT_TOPHAT_CROWN_PATH = createPath((p) => {
  p.moveTo(0, -11.5);
  p.lineTo(0.8, -21.5);
  p.lineTo(7.5, -21);
  p.lineTo(8, -11);
  p.closePath();
});

export const HAT_NINJA_HEADBAND_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(4.5, -11.8, 8.5, 3.2, 0.08, 0, Math.PI * 2);
  }
});

export const HAT_VIKING_HELMET_PATH = createPath((p) => {
  p.moveTo(-3, -11.5);
  p.quadraticCurveTo(4, -19.5, 12, -11);
  p.closePath();
});

export const HAT_VIKING_LEFT_HORN_PATH = createPath((p) => {
  p.moveTo(-2, -12);
  p.quadraticCurveTo(-6, -17, -9, -15);
  p.quadraticCurveTo(-6, -13.5, -1.5, -10.5);
  p.closePath();
});

export const HAT_VIKING_RIGHT_HORN_PATH = createPath((p) => {
  p.moveTo(10.5, -11.5);
  p.quadraticCurveTo(14.5, -16.5, 17.5, -14.5);
  p.quadraticCurveTo(14.5, -13, 10, -9.5);
  p.closePath();
});

export const HAT_SOMBRERO_BRIM_PATH = createPath((p) => {
  p.moveTo(-8, -10);
  p.quadraticCurveTo(4, -14, 16, -9);
  p.quadraticCurveTo(4, -7.5, -8, -10);
  p.closePath();
});

export const HAT_SOMBRERO_CROWN_PATH = createPath((p) => {
  p.moveTo(-0.5, -10.5);
  p.quadraticCurveTo(4, -22, 8.5, -10);
  p.closePath();
});

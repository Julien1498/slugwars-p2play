import { createPath, getMilitaryCapGrad } from './slugGradients';

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

export function renderSlugHat(
  ctx: CanvasRenderingContext2D,
  teamIndex: number,
  teamColor: string,
  animTime: number
) {
  if (teamIndex % 4 === 0) {
    ctx.save();
    // 1. Cap Crown (Dôme vert militaire d'officier avec dégradé d'ombre)
    ctx.fillStyle = getMilitaryCapGrad(ctx);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.3;
    ctx.fill(HAT_MILITARY_CROWN_PATH);
    ctx.stroke(HAT_MILITARY_CROWN_PATH);

    // 2. Leather Finished Base Rim (Bandeau de finition bas propre)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 0.9;
    ctx.fill(HAT_MILITARY_RIM_PATH);
    ctx.stroke(HAT_MILITARY_RIM_PATH);

    // 3. Golden Braid Cord (Galon doré au-dessus de la visière)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.1;
    ctx.stroke(HAT_MILITARY_BRAID_PATH);

    // 4. Subtle Glossy Visor (Visière noire fine pointant vers l'avant au front)
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.9;
    ctx.fill(HAT_MILITARY_VISOR_PATH);
    ctx.stroke(HAT_MILITARY_VISOR_PATH);

    // 5. Golden Corporal Insignia (Étoile / Cocarde dorée de caporal)
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(5, -16.2, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(5, -16.2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (teamIndex % 4 === 1) {
    // Team Hat 1: Red Rambo Bandana
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;
    ctx.fill(HAT_BANDANA_HEADBAND_PATH);
    ctx.stroke(HAT_BANDANA_HEADBAND_PATH);
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.lineTo(-11 + Math.sin(animTime * 6) * 2, -15);
    ctx.lineTo(-9 + Math.sin(animTime * 6) * 2, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (teamIndex % 4 === 2) {
    // Team Hat 2: Cyber Vision Goggles
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;
    ctx.fill(HAT_CYBER_GOGGLES_PATH);
    ctx.stroke(HAT_CYBER_GOGGLES_PATH);

    ctx.fillStyle = '#10b981';
    ctx.fill(HAT_CYBER_LENSES_PATH);
  } else {
    // Team Hat 3: Cowboy Hat
    ctx.fillStyle = teamColor;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;
    ctx.fill(HAT_COWBOY_PATH);
    ctx.stroke(HAT_COWBOY_PATH);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(1, -12, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

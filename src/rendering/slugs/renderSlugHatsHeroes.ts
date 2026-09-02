import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_PATRIOT_DOME,
  HAT_TITANIUM_FACEPLATE,
  HAT_MISCHIEF_HORN_L,
  HAT_MISCHIEF_HORN_R,
  HAT_THUNDER_WING_L,
  HAT_THUNDER_WING_R,
  HAT_VILLAGE_PLATE,
  HAT_SHINOBI_HAIR_SPIKES,
  HAT_RENEGADE_CONE,
  HAT_SHADOW_MASK,
} from './slugHatPathsHeroes';

function renderPatriotHelmet(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1d4ed8';
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_PATRIOT_DOME);
  ctx.stroke(HAT_PATRIOT_DOME);

  // White "A"
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(2.5, -13.5); ctx.lineTo(4, -17.5); ctx.lineTo(5.5, -13.5);
  ctx.moveTo(3.1, -15); ctx.lineTo(4.9, -15);
  ctx.stroke();

  // White wings
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-1, -14); ctx.lineTo(-4, -18); ctx.lineTo(-2, -15); ctx.closePath();
  ctx.moveTo(9, -14); ctx.lineTo(12, -18); ctx.lineTo(10, -15); ctx.closePath();
  ctx.fill();
}

function renderTitaniumMask(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#991b1b';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(4, -9, 8.5, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_TITANIUM_FACEPLATE);
  ctx.stroke(HAT_TITANIUM_FACEPLATE);

  // Glowing cyan eyes
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.fillRect(1.5, -8.5, 2.5, 1.0);
  ctx.fillRect(5.5, -8.5, 2.5, 1.0);
}

function renderMischiefHorns(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_MISCHIEF_HORN_L);
  ctx.stroke(HAT_MISCHIEF_HORN_L);
  ctx.fill(HAT_MISCHIEF_HORN_R);
  ctx.stroke(HAT_MISCHIEF_HORN_R);

  // Tiara
  ctx.beginPath();
  ctx.moveTo(-1, -12);
  ctx.quadraticCurveTo(4, -15, 9, -12);
  ctx.lineTo(8.5, -13.5);
  ctx.quadraticCurveTo(4, -16.5, -0.5, -13.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function renderThunderWings(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-2.5, -12);
  ctx.quadraticCurveTo(4, -18.5, 10.5, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.0;
  ctx.fill(HAT_THUNDER_WING_L);
  ctx.stroke(HAT_THUNDER_WING_L);
  ctx.fill(HAT_THUNDER_WING_R);
  ctx.stroke(HAT_THUNDER_WING_R);
}

function renderVillageHeadband(ctx: CanvasRenderingContext2D, teamColor: string): void {
  ctx.fillStyle = teamColor || '#1e3a8a';
  ctx.beginPath();
  ctx.fillRect(-2, -14, 12, 5);

  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.0;
  ctx.fill(HAT_VILLAGE_PLATE);
  ctx.stroke(HAT_VILLAGE_PLATE);

  // Spiral
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(4.5, -11.2, 1.2, 0, Math.PI * 1.5);
  ctx.stroke();

  ctx.strokeStyle = teamColor || '#1e3a8a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-2, -12); ctx.quadraticCurveTo(-6, -11, -9, -8);
  ctx.moveTo(-2, -11); ctx.quadraticCurveTo(-5, -9, -8, -5);
  ctx.stroke();
}

function renderSuperShinobiHair(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_SHINOBI_HAIR_SPIKES);
  ctx.stroke(HAT_SHINOBI_HAIR_SPIKES);

  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.fillRect(-1, -13.5, 10.5, 3);
}

function renderRenegadeStraw(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#d4b996';
  ctx.strokeStyle = '#8c6e4e';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_RENEGADE_CONE);
  ctx.stroke(HAT_RENEGADE_CONE);

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(4, -22, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, -11); ctx.lineTo(-3, -5);
  ctx.moveTo(0, -11.5); ctx.lineTo(0, -4);
  ctx.moveTo(4, -12); ctx.lineTo(4, -4);
  ctx.moveTo(8, -11.5); ctx.lineTo(8, -4);
  ctx.moveTo(11, -11); ctx.lineTo(11, -5);
  ctx.stroke();
}

function renderShadowMask(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_SHADOW_MASK);
  ctx.stroke(HAT_SHADOW_MASK);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(5.5, -9); ctx.lineTo(7.5, -8); ctx.lineTo(9.5, -9);
  ctx.moveTo(6, -11); ctx.lineTo(6.8, -10);
  ctx.moveTo(9, -11); ctx.lineTo(8.2, -10);
  ctx.stroke();

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.fillRect(5.8, -10, 1.2, 0.6);
  ctx.fillRect(8.0, -10, 1.2, 0.6);
}

export const HEROES_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  patriot_helmet: renderPatriotHelmet,
  titanium_mask: renderTitaniumMask,
  mischief_horns: renderMischiefHorns,
  thunder_wings: renderThunderWings,
  village_headband: renderVillageHeadband,
  super_shinobi_hair: renderSuperShinobiHair,
  renegade_straw: renderRenegadeStraw,
  shadow_mask: renderShadowMask,
};

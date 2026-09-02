import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_SWAMP_EAR_TUBE_L,
  HAT_SWAMP_EAR_BELL_L,
  HAT_SWAMP_EAR_CAVITY_L,
  HAT_SWAMP_EAR_TUBE_R,
  HAT_SWAMP_EAR_BELL_R,
  HAT_SWAMP_EAR_CAVITY_R,
  HAT_SWAMP_BROW_RIDGE,
  HAT_FELINE_BRIM,
  HAT_FELINE_CROWN,
  HAT_MINI_CORONET,
  HAT_SUPERSONIC_SPIKES,
  HAT_TWINFOX_EAR_L,
  HAT_TWINFOX_EAR_R,
  HAT_MAD_MOUSTACHE,
  HAT_BANDIT_BALACLAVA,
  HAT_SWAT_POT,
  HAT_CHICKEN_BODY,
} from './slugHatPathsPopCulture';

function renderSwampEars(ctx: CanvasRenderingContext2D): void {
  // 1. Heavy Ogre Brow Ridge Fold
  ctx.fillStyle = '#65a30d';
  ctx.strokeStyle = '#365314';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_SWAMP_BROW_RIDGE);
  ctx.stroke(HAT_SWAMP_BROW_RIDGE);

  // 2. Tubular Flared Stalks (Left & Right)
  ctx.fillStyle = '#84cc16';
  ctx.strokeStyle = '#365314';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_SWAMP_EAR_TUBE_L);
  ctx.stroke(HAT_SWAMP_EAR_TUBE_L);
  ctx.fill(HAT_SWAMP_EAR_TUBE_R);
  ctx.stroke(HAT_SWAMP_EAR_TUBE_R);

  // 3. Flared Outer Trumpet Bell Rims
  ctx.fillStyle = '#65a30d';
  ctx.fill(HAT_SWAMP_EAR_BELL_L);
  ctx.stroke(HAT_SWAMP_EAR_BELL_L);
  ctx.fill(HAT_SWAMP_EAR_BELL_R);
  ctx.stroke(HAT_SWAMP_EAR_BELL_R);

  // 4. Deep Hollow Funnel Cavities
  ctx.fillStyle = '#1a2e05';
  ctx.fill(HAT_SWAMP_EAR_CAVITY_L);
  ctx.fill(HAT_SWAMP_EAR_CAVITY_R);

  // 5. Ogre Freckles at base
  ctx.fillStyle = '#365314';
  ctx.beginPath();
  ctx.arc(2.0, -13.5, 0.6, 0, Math.PI * 2);
  ctx.arc(4.5, -14.2, 0.5, 0, Math.PI * 2);
  ctx.arc(7.0, -13.6, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function renderFelinePlume(ctx: CanvasRenderingContext2D, teamColor: string): void {
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_FELINE_BRIM);
  ctx.stroke(HAT_FELINE_BRIM);
  ctx.fill(HAT_FELINE_CROWN);
  ctx.stroke(HAT_FELINE_CROWN);

  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-1.5, -13); ctx.lineTo(8.5, -13);
  ctx.stroke();

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(8.5, -14);
  ctx.quadraticCurveTo(12, -22, 16, -26);
  ctx.stroke();
}

function renderMiniCoronet(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_MINI_CORONET);
  ctx.stroke(HAT_MINI_CORONET);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(3.5, -18, 0.8, 0, Math.PI * 2);
  ctx.arc(7.5, -18.5, 0.9, 0, Math.PI * 2);
  ctx.arc(11.5, -18, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function renderSupersonicQuills(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2563eb';
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_SUPERSONIC_SPIKES);
  ctx.stroke(HAT_SUPERSONIC_SPIKES);
}

function renderTwinfoxEars(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ea580c';
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_TWINFOX_EAR_L);
  ctx.stroke(HAT_TWINFOX_EAR_L);
  ctx.fill(HAT_TWINFOX_EAR_R);
  ctx.stroke(HAT_TWINFOX_EAR_R);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-0.5, -13); ctx.lineTo(-1.2, -18); ctx.lineTo(2, -14); ctx.closePath();
  ctx.moveTo(5.8, -13); ctx.lineTo(8.2, -18); ctx.lineTo(9.2, -13.5); ctx.closePath();
  ctx.fill();
}

function renderMadScientist(ctx: CanvasRenderingContext2D): void {
  // Goggles over real eyes
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(2.0, -10, 3.0, 0, Math.PI * 2);
  ctx.arc(8.0, -9, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(4.8, -10); ctx.lineTo(5.2, -9.5);
  ctx.stroke();

  // Huge bushy moustache under eyes
  ctx.fillStyle = '#c2410c';
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_MAD_MOUSTACHE);
  ctx.stroke(HAT_MAD_MOUSTACHE);
}

function renderBanditBalaclava(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_BANDIT_BALACLAVA);
  ctx.stroke(HAT_BANDIT_BALACLAVA);

  // Eye openings showing skin around real eyes
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(2.0, -10, 3.2, 2.2, 0, 0, Math.PI * 2);
  ctx.ellipse(8.0, -9, 3.0, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black pupils
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(2.3, -10, 1.4, 0, Math.PI * 2);
  ctx.arc(8.3, -9, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

function renderSwatHelmet(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_SWAT_POT);
  ctx.stroke(HAT_SWAT_POT);

  // Transparent riot visor reaching down to cover eyes
  ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-3.5, -12);
  ctx.quadraticCurveTo(4, -14.5, 12, -12);
  ctx.lineTo(12.5, -5);
  ctx.quadraticCurveTo(4, -7.5, -3.0, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Boom microphone
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -9); ctx.lineTo(-1, -4); ctx.lineTo(3, -4);
  ctx.stroke();
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(3.5, -4, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderTacticalChicken(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_CHICKEN_BODY);
  ctx.stroke(HAT_CHICKEN_BODY);

  ctx.beginPath();
  ctx.arc(6.5, -17, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(6.5, -19.5, 1.0, 0, Math.PI * 2);
  ctx.arc(7.2, -15, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(8.5, -17.5); ctx.lineTo(10.5, -17); ctx.lineTo(8.5, -16.5); ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(7, -17.5, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

export const POP_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  swamp_ears: renderSwampEars,
  feline_plume: renderFelinePlume,
  mini_coronet: renderMiniCoronet,
  supersonic_quills: renderSupersonicQuills,
  twinfox_ears: renderTwinfoxEars,
  mad_scientist: renderMadScientist,
  bandit_balaclava: renderBanditBalaclava,
  swat_helmet: renderSwatHelmet,
  tactical_chicken: renderTacticalChicken,
};

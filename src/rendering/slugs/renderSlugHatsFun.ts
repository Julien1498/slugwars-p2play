import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_CHEF_BAND_PATH,
  HAT_CHEF_CROWN_PATH,
  HAT_WIZARD_BRIM_PATH,
  HAT_WIZARD_CONE_PATH,
  HAT_HARDHAT_DOME_PATH,
  HAT_DETECTIVE_BRIM_PATH,
  HAT_DETECTIVE_CROWN_PATH,
  HAT_SNORKEL_MASK_PATH,
  HAT_DUCK_BODY_PATH,
  HAT_PROPELLER_CAP_PATH,
  HAT_ARROW_HEAD_PATH,
} from './slugHatPathsExtended';

function renderChefHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_CHEF_CROWN_PATH);
  ctx.stroke(HAT_CHEF_CROWN_PATH);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(1, -15); ctx.lineTo(0, -24);
  ctx.moveTo(4, -15); ctx.lineTo(4, -26);
  ctx.moveTo(7, -15); ctx.lineTo(8, -24);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_CHEF_BAND_PATH);
  ctx.stroke(HAT_CHEF_BAND_PATH);
}

function renderWizardHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#312e81';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_WIZARD_BRIM_PATH);
  ctx.stroke(HAT_WIZARD_BRIM_PATH);

  ctx.fillStyle = '#3730a3';
  ctx.fill(HAT_WIZARD_CONE_PATH);
  ctx.stroke(HAT_WIZARD_CONE_PATH);

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(3, -16, 1.2, 0, Math.PI * 2);
  ctx.arc(0, -21, 1.0, 0, Math.PI * 2);
  ctx.fill();
}

function renderHardHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_HARDHAT_DOME_PATH);
  ctx.stroke(HAT_HARDHAT_DOME_PATH);

  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -19); ctx.lineTo(4, -13);
  ctx.stroke();

  ctx.fillStyle = '#67e8f9';
  ctx.strokeStyle = '#0e7490';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(10, -14, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function renderDetectiveHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_DETECTIVE_BRIM_PATH);
  ctx.stroke(HAT_DETECTIVE_BRIM_PATH);
  ctx.fill(HAT_DETECTIVE_CROWN_PATH);
  ctx.stroke(HAT_DETECTIVE_CROWN_PATH);

  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-1.5, -13); ctx.lineTo(9.5, -13);
  ctx.stroke();

  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(2.5, -8, 2.3, 0, Math.PI * 2);
  ctx.arc(6.5, -7.5, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function renderSnorkelHat(ctx: CanvasRenderingContext2D, teamColor: string): void {
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_SNORKEL_MASK_PATH);
  ctx.stroke(HAT_SNORKEL_MASK_PATH);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -7.5);
  ctx.lineTo(-3, -7.5);
  ctx.lineTo(-3.5, -18);
  ctx.quadraticCurveTo(-3.5, -21, -1, -21);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(-1, -21, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderDuckHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_DUCK_BODY_PATH);
  ctx.stroke(HAT_DUCK_BODY_PATH);

  ctx.beginPath();
  ctx.arc(6.5, -16.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(8.5, -17);
  ctx.lineTo(11, -16.2);
  ctx.lineTo(8.5, -15.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(7.2, -17.2, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function renderPropellerHat(ctx: CanvasRenderingContext2D, teamColor: string, animTime: number): void {
  ctx.fillStyle = teamColor;
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_PROPELLER_CAP_PATH);
  ctx.stroke(HAT_PROPELLER_CAP_PATH);

  const propWidth = Math.cos(animTime * 12) * 6;
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(4 - propWidth, -19.5);
  ctx.lineTo(4 + propWidth, -19.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(4, -18.5, 1.0, 0, Math.PI * 2);
  ctx.fill();
}

function renderArrowHat(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-9, -10);
  ctx.lineTo(17, -10);
  ctx.stroke();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.stroke(HAT_ARROW_HEAD_PATH);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-9, -10); ctx.lineTo(-12, -12); ctx.lineTo(-11, -10); ctx.closePath();
  ctx.moveTo(-9, -10); ctx.lineTo(-12, -8); ctx.lineTo(-11, -10); ctx.closePath();
  ctx.fill();
}

export const FUN_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  chef: renderChefHat,
  wizard: renderWizardHat,
  hard_hat: renderHardHat,
  detective: renderDetectiveHat,
  snorkel: renderSnorkelHat,
  duck: renderDuckHat,
  propeller: renderPropellerHat,
  arrow: renderArrowHat,
};

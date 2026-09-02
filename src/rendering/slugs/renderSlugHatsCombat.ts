import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_COLANDER_BOWL_PATH,
  HAT_ASTRONAUT_COLLAR_PATH,
  HAT_GASMASK_SNOUT_PATH,
  HAT_BOXER_GUARD_PATH,
  HAT_CAMO_POT_PATH,
  HAT_MUSHROOM_CAP_PATH,
  HAT_FROG_CAP_PATH,
  HAT_UNICORN_HORN_PATH,
} from './slugHatPathsExtended';

function renderColanderHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_COLANDER_BOWL_PATH);
  ctx.stroke(HAT_COLANDER_BOWL_PATH);

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(1, -14, 0.7, 0, Math.PI * 2);
  ctx.arc(4, -16, 0.7, 0, Math.PI * 2);
  ctx.arc(7, -14, 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(-4, -13, 1.5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(12, -13, 1.5, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
}

function renderAstronautHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_ASTRONAUT_COLLAR_PATH);
  ctx.stroke(HAT_ASTRONAUT_COLLAR_PATH);

  ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(4, -8.5, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(4, -8.5, 8.5, -1.2, -0.3);
  ctx.stroke();
}

function renderGasMaskHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_GASMASK_SNOUT_PATH);
  ctx.stroke(HAT_GASMASK_SNOUT_PATH);

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(11, -5.5, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#14532d';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(2.5, -8, 2.4, 0, Math.PI * 2);
  ctx.arc(6.5, -7.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function renderBoxerHat(ctx: CanvasRenderingContext2D, teamColor: string): void {
  ctx.fillStyle = teamColor || '#dc2626';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_BOXER_GUARD_PATH);
  ctx.stroke(HAT_BOXER_GUARD_PATH);

  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(3.5, -14, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderCamoHelmetHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3f6212';
  ctx.strokeStyle = '#1a2e05';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_CAMO_POT_PATH);
  ctx.stroke(HAT_CAMO_POT_PATH);

  ctx.strokeStyle = '#1e3a10';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-1, -17); ctx.lineTo(2, -12.5);
  ctx.moveTo(3, -18.5); ctx.lineTo(6, -12.5);
  ctx.moveTo(7, -17.5); ctx.lineTo(9, -12.5);
  ctx.stroke();

  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.ellipse(3, -19, 2.5, 1.2, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function renderMushroomHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_MUSHROOM_CAP_PATH);
  ctx.stroke(HAT_MUSHROOM_CAP_PATH);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-1, -15, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -18, 2.0, 0, Math.PI * 2);
  ctx.arc(9, -15, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -13.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderFrogHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#22c55e';
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_FROG_CAP_PATH);
  ctx.stroke(HAT_FROG_CAP_PATH);

  ctx.beginPath();
  ctx.arc(0.5, -17, 2.8, 0, Math.PI * 2);
  ctx.arc(7.5, -17, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0.5, -17, 1.8, 0, Math.PI * 2);
  ctx.arc(7.5, -17, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(0.8, -17, 0.9, 0, Math.PI * 2);
  ctx.arc(7.8, -17, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function renderUnicornHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_UNICORN_HORN_PATH);
  ctx.stroke(HAT_UNICORN_HORN_PATH);

  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(8.5, -25, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

export const COMBAT_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  colander: renderColanderHat,
  astronaut: renderAstronautHat,
  gas_mask: renderGasMaskHat,
  boxer: renderBoxerHat,
  camo_helmet: renderCamoHelmetHat,
  mushroom: renderMushroomHat,
  frog: renderFrogHat,
  unicorn: renderUnicornHat,
};

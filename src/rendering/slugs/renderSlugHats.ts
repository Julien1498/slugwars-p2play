import { getMilitaryCapGrad } from './slugGradients';
import {
  HAT_MILITARY_CROWN_PATH,
  HAT_MILITARY_RIM_PATH,
  HAT_MILITARY_BRAID_PATH,
  HAT_MILITARY_VISOR_PATH,
  HAT_BANDANA_HEADBAND_PATH,
  HAT_CYBER_GOGGLES_PATH,
  HAT_CYBER_LENSES_PATH,
  HAT_COWBOY_PATH,
  HAT_CROWN_PATH,
  HAT_PIRATE_TRICORN_PATH,
  HAT_TOPHAT_BRIM_PATH,
  HAT_TOPHAT_CROWN_PATH,
  HAT_NINJA_HEADBAND_PATH,
  HAT_VIKING_HELMET_PATH,
  HAT_VIKING_LEFT_HORN_PATH,
  HAT_VIKING_RIGHT_HORN_PATH,
  HAT_SOMBRERO_BRIM_PATH,
  HAT_SOMBRERO_CROWN_PATH,
} from './slugHatPaths';
import { FUN_HAT_STRATEGIES } from './renderSlugHatsFun';
import { COMBAT_HAT_STRATEGIES } from './renderSlugHatsCombat';
import { POP_HAT_STRATEGIES } from './renderSlugHatsPopCulture';
import { HEROES_HAT_STRATEGIES } from './renderSlugHatsHeroes';
import { ARACHNID_HAT_STRATEGIES } from './renderSlugHatsArachnid';
import { HatRendererFn } from './renderSlugHatTypes';

export {
  HAT_MILITARY_CROWN_PATH,
  HAT_MILITARY_RIM_PATH,
  HAT_MILITARY_BRAID_PATH,
  HAT_MILITARY_VISOR_PATH,
  HAT_BANDANA_HEADBAND_PATH,
  HAT_CYBER_GOGGLES_PATH,
  HAT_CYBER_LENSES_PATH,
  HAT_COWBOY_PATH,
  HAT_CROWN_PATH,
  HAT_PIRATE_TRICORN_PATH,
  HAT_TOPHAT_BRIM_PATH,
  HAT_TOPHAT_CROWN_PATH,
  HAT_NINJA_HEADBAND_PATH,
  HAT_VIKING_HELMET_PATH,
  HAT_VIKING_LEFT_HORN_PATH,
  HAT_VIKING_RIGHT_HORN_PATH,
  HAT_SOMBRERO_BRIM_PATH,
  HAT_SOMBRERO_CROWN_PATH,
};

export type { HatRendererFn };

function renderMilitaryHat(ctx: CanvasRenderingContext2D): void {
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
}

function renderBandanaHat(ctx: CanvasRenderingContext2D, _teamColor: string, animTime: number): void {
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
}

function renderCyberHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_CYBER_GOGGLES_PATH);
  ctx.stroke(HAT_CYBER_GOGGLES_PATH);

  ctx.fillStyle = '#10b981';
  ctx.fill(HAT_CYBER_LENSES_PATH);
}

function renderCowboyHat(ctx: CanvasRenderingContext2D, teamColor: string): void {
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

function renderCrownHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_CROWN_PATH);
  ctx.stroke(HAT_CROWN_PATH);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(4, -15.5, 1.3, 0, Math.PI * 2);
  ctx.arc(-2, -14.5, 1.0, 0, Math.PI * 2);
  ctx.arc(10, -14.5, 1.0, 0, Math.PI * 2);
  ctx.fill();
}

function renderPirateHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_PIRATE_TRICORN_PATH);
  ctx.stroke(HAT_PIRATE_TRICORN_PATH);

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(4, -14, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function renderTophatHat(ctx: CanvasRenderingContext2D, teamColor: string): void {
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_TOPHAT_CROWN_PATH);
  ctx.stroke(HAT_TOPHAT_CROWN_PATH);
  ctx.fill(HAT_TOPHAT_BRIM_PATH);
  ctx.stroke(HAT_TOPHAT_BRIM_PATH);

  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0.5, -13);
  ctx.lineTo(8, -12.5);
  ctx.stroke();
}

function renderNinjaHat(ctx: CanvasRenderingContext2D, _teamColor: string, animTime: number): void {
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_NINJA_HEADBAND_PATH);
  ctx.stroke(HAT_NINJA_HEADBAND_PATH);

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(-3, -11.5);
  ctx.lineTo(-12 + Math.sin(animTime * 7) * 2.5, -14);
  ctx.lineTo(-10 + Math.sin(animTime * 7) * 2.5, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function renderVikingHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_VIKING_LEFT_HORN_PATH);
  ctx.stroke(HAT_VIKING_LEFT_HORN_PATH);
  ctx.fill(HAT_VIKING_RIGHT_HORN_PATH);
  ctx.stroke(HAT_VIKING_RIGHT_HORN_PATH);

  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_VIKING_HELMET_PATH);
  ctx.stroke(HAT_VIKING_HELMET_PATH);
}

function renderSombreroHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#d97706';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_SOMBRERO_CROWN_PATH);
  ctx.stroke(HAT_SOMBRERO_CROWN_PATH);
  ctx.fill(HAT_SOMBRERO_BRIM_PATH);
  ctx.stroke(HAT_SOMBRERO_BRIM_PATH);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, -11.5);
  ctx.stroke();
}

export const HAT_RENDER_STRATEGIES: Record<string, HatRendererFn> = {
  military: renderMilitaryHat,
  bandana: renderBandanaHat,
  cyber: renderCyberHat,
  cowboy: renderCowboyHat,
  crown: renderCrownHat,
  pirate: renderPirateHat,
  tophat: renderTophatHat,
  ninja: renderNinjaHat,
  viking: renderVikingHat,
  sombrero: renderSombreroHat,
  ...FUN_HAT_STRATEGIES,
  ...COMBAT_HAT_STRATEGIES,
  ...POP_HAT_STRATEGIES,
  ...HEROES_HAT_STRATEGIES,
  ...ARACHNID_HAT_STRATEGIES,
};

export function renderSlugHat(
  ctx: CanvasRenderingContext2D,
  hatOrIndex: string | number | undefined,
  teamColorOrIndex: string | number,
  animTimeOrColor?: number | string,
  maybeAnimTime?: number
): void {
  let hatId: string | undefined;
  let teamColor: string;
  let animTime: number;

  if (typeof hatOrIndex === 'number') {
    const fallbackHats = ['military', 'bandana', 'cyber', 'cowboy'];
    hatId = fallbackHats[hatOrIndex % fallbackHats.length];
    teamColor = typeof teamColorOrIndex === 'string' ? teamColorOrIndex : '#ec4899';
    animTime = typeof animTimeOrColor === 'number' ? animTimeOrColor : 0;
  } else {
    hatId = hatOrIndex;
    const teamIndex = typeof teamColorOrIndex === 'number' ? teamColorOrIndex : 0;
    const fallbackHats = ['military', 'bandana', 'cyber', 'cowboy'];
    if (!hatId) {
      hatId = fallbackHats[teamIndex % fallbackHats.length];
    }
    teamColor = typeof animTimeOrColor === 'string' ? animTimeOrColor : '#ec4899';
    animTime = typeof maybeAnimTime === 'number' ? maybeAnimTime : 0;
  }

  if (hatId === 'none') return;

  const renderer = HAT_RENDER_STRATEGIES[hatId];
  if (renderer) {
    renderer(ctx, teamColor, animTime);
  }
}

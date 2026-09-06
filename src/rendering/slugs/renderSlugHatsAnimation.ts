import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_MONO_STRAP,
  HAT_BINOCULAR_STRAP,
  HAT_BEANIE_DOME,
  HAT_BEANIE_CUFF,
  HAT_SAFETY_HELMET_DOME,
  HAT_SAFETY_HELMET_BRIM,
  HAT_SPECIMEN_EAR_L,
  HAT_SPECIMEN_EAR_R,
  HAT_CHARMER_EAR_L,
  HAT_CHARMER_EAR_R,
  HAT_HIBISCUS_LEAVES,
  HAT_ALIEN_HOOD_BASE,
  HAT_BRAIDED_STETSON_BRIM,
  HAT_BRAIDED_STETSON_CROWN,
  HAT_COSMO_COWL_HEAD,
  HAT_TRI_OCULAR_DOME,
  HAT_DERBY_CROWN,
  HAT_DERBY_BRIM,
} from './slugHatPathsAnimation';

function renderMonoGoggleTuft(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  // Elastic black strap
  ctx.fillStyle = '#18181b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.0;
  ctx.fill(HAT_MONO_STRAP); ctx.stroke(HAT_MONO_STRAP);
  // Large circular silver cyclops lens
  ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(5.0, -10.0, 3.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(5.0, -10.0, 2.8, 0, Math.PI * 2); ctx.fill();
  // Central glass glare
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4.2, -10.8, 0.9, 0, Math.PI * 2); ctx.fill();
  // 3 upright sprout hairs swaying in wind
  const sway = Math.sin(animTime * 4) * 0.5;
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(4.0, -14.5); ctx.quadraticCurveTo(3.5 + sway, -17.0, 3.2 + sway, -18.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5.0, -14.8); ctx.quadraticCurveTo(5.0 + sway, -17.5, 5.0 + sway * 1.2, -19.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6.0, -14.5); ctx.quadraticCurveTo(6.5 + sway, -17.0, 6.8 + sway, -18.5); ctx.stroke();
}

function renderBinocularSpectacles(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  ctx.fillStyle = '#18181b'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.0;
  ctx.fill(HAT_BINOCULAR_STRAP); ctx.stroke(HAT_BINOCULAR_STRAP);
  // Twin circular silver lenses with bridge
  ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(2.0, -10.0, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(8.0, -9.2, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillRect(4.4, -10.2, 1.2, 1.5);
  // Upright palm-tuft hair
  const sway = Math.sin(animTime * 3) * 0.4;
  ctx.fillStyle = '#09090b'; ctx.beginPath();
  ctx.moveTo(4.2, -14.5); ctx.lineTo(5.0 + sway, -19.0); ctx.lineTo(5.8, -14.5); ctx.closePath(); ctx.fill();
}

function renderCozyStripedBeanie(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  ctx.fillStyle = '#0284c7'; ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_BEANIE_DOME); ctx.stroke(HAT_BEANIE_DOME);
  // Yellow knitted stripes
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-1.5, -17.5, 13.0, 2.0);
  ctx.fillRect(-0.2, -20.5, 10.4, 1.8);
  // Ribbed folded cuff
  ctx.fillStyle = '#0369a1'; ctx.fill(HAT_BEANIE_CUFF); ctx.stroke(HAT_BEANIE_CUFF);
  // Soft pompon on top
  const bobble = Math.sin(animTime * 4) * 0.4;
  ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.arc(5.0 + bobble, -22.8, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function renderBuildersSafetyHelmet(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_SAFETY_HELMET_DOME); ctx.stroke(HAT_SAFETY_HELMET_DOME);
  ctx.fill(HAT_SAFETY_HELMET_BRIM); ctx.stroke(HAT_SAFETY_HELMET_BRIM);
  // Central reinforcement ridge & emblem
  ctx.fillStyle = '#eab308'; ctx.fillRect(4.0, -19.5, 2.0, 6.0);
  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(5.0, -15.5, 1.2, 0, Math.PI * 2); ctx.fill();
}

function renderSpecimenBlueEars(ctx: CanvasRenderingContext2D): void {
  // Floppy blue alien ears
  ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_SPECIMEN_EAR_L); ctx.stroke(HAT_SPECIMEN_EAR_L);
  ctx.fill(HAT_SPECIMEN_EAR_R); ctx.stroke(HAT_SPECIMEN_EAR_R);
  // Lilac interior ear cavities
  ctx.fillStyle = '#c084fc';
  ctx.beginPath(); ctx.ellipse?.(-5.0, -12.0, 3.0, 1.6, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse?.(14.5, -12.0, 3.0, 1.6, -0.4, 0, Math.PI * 2); ctx.fill();
  // Central tuft
  ctx.fillStyle = '#2563eb'; ctx.beginPath();
  ctx.moveTo(3.5, -14.0); ctx.lineTo(5.0, -17.5); ctx.lineTo(6.5, -14.0); ctx.closePath(); ctx.fill();
}

function renderCosmicCharmerAntennas(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  ctx.fillStyle = '#f472b6'; ctx.strokeStyle = '#db2777'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_CHARMER_EAR_L); ctx.stroke(HAT_CHARMER_EAR_L);
  ctx.fill(HAT_CHARMER_EAR_R); ctx.stroke(HAT_CHARMER_EAR_R);
  // Pastel pink inner ears
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath(); ctx.ellipse?.(-4.0, -11.5, 2.4, 1.3, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse?.(13.8, -11.5, 2.4, 1.3, -0.3, 0, Math.PI * 2); ctx.fill();
  // Long arched purple antennae
  const sway = Math.sin(animTime * 3.5) * 0.6;
  ctx.strokeStyle = '#9333ea'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(3.5, -14.0); ctx.bezierCurveTo(2.0, -18.0, 0.0 + sway, -21.0, -2.0 + sway, -23.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6.5, -14.0); ctx.bezierCurveTo(8.0, -18.0, 10.0 - sway, -21.0, 12.0 - sway, -23.0); ctx.stroke();
}

function renderIslandHibiscusGarland(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#15803d'; ctx.strokeStyle = '#166534'; ctx.lineWidth = 1.1;
  ctx.fill(HAT_HIBISCUS_LEAVES); ctx.stroke(HAT_HIBISCUS_LEAVES);
  // Large red hibiscus flower on right side
  ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 0.8;
  for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
    ctx.beginPath(); ctx.arc(10.0 + Math.cos(a) * 1.5, -13.5 + Math.sin(a) * 1.5, 1.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // Golden stamen
  ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(10.0, -13.5, 0.8, 0, Math.PI * 2); ctx.fill();
}

function renderAlienCompanionHood(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e3a8a'; ctx.strokeStyle = '#172554'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_ALIEN_HOOD_BASE); ctx.stroke(HAT_ALIEN_HOOD_BASE);
  // Light blue muzzle area
  ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.ellipse?.(5.0, -14.5, 3.0, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  // Round dark nose
  ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(5.0, -14.8, 0.9, 0, Math.PI * 2); ctx.fill();
  // Sleepy alien eyes above brow
  ctx.fillStyle = '#020617';
  ctx.beginPath(); ctx.arc(2.0, -17.0, 1.2, 0, Math.PI * 2); ctx.arc(8.0, -17.0, 1.2, 0, Math.PI * 2); ctx.fill();
}

function renderBraidedCowboyStetson(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#78350f'; ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_BRAIDED_STETSON_CROWN); ctx.stroke(HAT_BRAIDED_STETSON_CROWN);
  // Dark leather band
  ctx.fillStyle = '#291104'; ctx.fillRect(-0.5, -13.8, 11.0, 1.6);
  ctx.fill(HAT_BRAIDED_STETSON_BRIM); ctx.stroke(HAT_BRAIDED_STETSON_BRIM);
  // White cross-stitch lacing along the edge
  ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 0.9;
  for (const [lx, ly] of [[-3.5, -10.5], [-1.0, -11.5], [2.0, -12.2], [5.0, -12.5], [8.0, -12.2], [11.0, -11.5], [13.5, -10.5]]) {
    ctx.beginPath(); ctx.moveTo(lx - 0.5, ly - 0.5); ctx.lineTo(lx + 0.5, ly + 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx - 0.5, ly + 0.5); ctx.lineTo(lx + 0.5, ly - 0.5); ctx.stroke();
  }
}

function renderCosmoRangerCowl(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#6b21a8'; ctx.strokeStyle = '#3b0764'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_COSMO_COWL_HEAD); ctx.stroke(HAT_COSMO_COWL_HEAD);
  // Lime green chin guard & forehead trim
  ctx.fillStyle = '#65a30d'; ctx.strokeStyle = '#365314'; ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.rect(-1.5, -12.5, 13.0, 1.8); ctx.fill(); ctx.stroke();
  // Small red LED indicator
  ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(10.5, -15.5, 0.8, 0, Math.PI * 2); ctx.fill();
}

function renderTriOcularAntenna(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  ctx.fillStyle = '#84cc16'; ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_TRI_OCULAR_DOME); ctx.stroke(HAT_TRI_OCULAR_DOME);
  // Antenna with orb tip swaying
  const sway = Math.sin(animTime * 3) * 0.7;
  ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(5.0, -17.5); ctx.quadraticCurveTo(5.0 + sway, -20.5, 5.0 + sway * 1.5, -23.0); ctx.stroke();
  ctx.fillStyle = '#65a30d'; ctx.beginPath(); ctx.arc(5.0 + sway * 1.5, -23.2, 1.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 3 Curious cute alien eyes
  for (const [ex, ey] of [[2.0, -14.2], [5.0, -15.2], [8.0, -14.2]]) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#365314'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(ex, ey, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(ex, ey, 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

function renderToyBlackDerby(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#020617'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_DERBY_CROWN); ctx.stroke(HAT_DERBY_CROWN);
  // Silk band & brim
  ctx.fillStyle = '#334155'; ctx.fillRect(0.8, -14.0, 8.4, 1.5);
  ctx.fill(HAT_DERBY_BRIM); ctx.stroke(HAT_DERBY_BRIM);
  // Glossy reflection arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(4.0, -17.5, 2.5, -0.6 * Math.PI, -0.2 * Math.PI); ctx.stroke();
}

export const ANIMATION_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  mono_goggle_tuft: renderMonoGoggleTuft,
  binocular_spectacles: renderBinocularSpectacles,
  cozy_striped_beanie: renderCozyStripedBeanie,
  builders_safety_helmet: renderBuildersSafetyHelmet,
  specimen_blue_ears: renderSpecimenBlueEars,
  cosmic_charmer_antennas: renderCosmicCharmerAntennas,
  island_hibiscus_garland: renderIslandHibiscusGarland,
  alien_companion_hood: renderAlienCompanionHood,
  braided_cowboy_stetson: renderBraidedCowboyStetson,
  cosmo_ranger_cowl: renderCosmoRangerCowl,
  tri_ocular_antenna: renderTriOcularAntenna,
  toy_black_derby: renderToyBlackDerby,
};

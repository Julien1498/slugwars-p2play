import {
  HAT_ARACHNID_COWL,
  HAT_ARACHNID_WEB_GRID,
  HAT_ARACHNID_EYE_FRAME_L,
  HAT_ARACHNID_EYE_FRAME_R,
  HAT_ARACHNID_LENS_L,
  HAT_ARACHNID_LENS_R,
  HAT_ARACHNID_CHEST_SPIDER,
  HAT_SYMBIOTE_EYE_L,
  HAT_SYMBIOTE_EYE_R,
  HAT_SYMBIOTE_CHEST_SPIDER,
} from './slugHatPathsArachnid';
import { HatRendererFn } from './renderSlugHatTypes';

/**
 * 1. Classic Crimson Arachnid Mask
 * Iconic comic-book cowl with radiating concentric spiderwebs,
 * stylized thick black frames, glossy white lenses and chest emblem.
 */
function renderArachnidMask(ctx: CanvasRenderingContext2D): void {
  // 1. Red Cowl Body
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_ARACHNID_COWL);
  ctx.stroke(HAT_ARACHNID_COWL);

  // 2. Head Silhouette Shading (adds 3D spherical depth)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.arc(-2, -9, 7.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Radiating Spiderweb Grid (high-contrast black web with subtle light accent)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.lineWidth = 0.8;
  ctx.stroke(HAT_ARACHNID_WEB_GRID);

  // 4. Stylized Angular Eye Frames (Thick Comic-Book Contour)
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.0;
  ctx.fill(HAT_ARACHNID_EYE_FRAME_L);
  ctx.stroke(HAT_ARACHNID_EYE_FRAME_L);
  ctx.fill(HAT_ARACHNID_EYE_FRAME_R);
  ctx.stroke(HAT_ARACHNID_EYE_FRAME_R);

  // 5. Glossy Pearlescent White Lenses
  ctx.fillStyle = '#ffffff';
  ctx.fill(HAT_ARACHNID_LENS_L);
  ctx.fill(HAT_ARACHNID_LENS_R);

  // Subtle cyan edge refraction inside the lenses
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
  ctx.lineWidth = 0.5;
  ctx.stroke(HAT_ARACHNID_LENS_L);
  ctx.stroke(HAT_ARACHNID_LENS_R);

  // 6. Chest Spider Insignia
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.6;
  ctx.fill(HAT_ARACHNID_CHEST_SPIDER);
  ctx.stroke(HAT_ARACHNID_CHEST_SPIDER);
}

/**
 * 2. Alien Symbiote Parasite Mask
 * Deep sleek obsidian cowl with purple/indigo sheen,
 * aggressive jagged predatory eyes and sprawling white spider insignia.
 */
function renderAlienSymbiote(ctx: CanvasRenderingContext2D): void {
  // 1. Obsidian Black Cowl
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_ARACHNID_COWL);
  ctx.stroke(HAT_ARACHNID_COWL);

  // 2. Glossy Purple Sheen Arc
  ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
  ctx.beginPath();
  ctx.arc(4, -14, 8, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.fill();

  // 3. Organic Writhing Tendrils
  ctx.strokeStyle = 'rgba(49, 46, 129, 0.6)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-3, -12); ctx.quadraticCurveTo(0, -10, -2, -6);
  ctx.moveTo(11, -12); ctx.quadraticCurveTo(8, -10, 10, -5);
  ctx.moveTo(1, -17); ctx.quadraticCurveTo(4, -15, 3, -13);
  ctx.stroke();

  // 4. Menacing Jagged Symbiote Eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 0.7;
  ctx.fill(HAT_SYMBIOTE_EYE_L);
  ctx.stroke(HAT_SYMBIOTE_EYE_L);
  ctx.fill(HAT_SYMBIOTE_EYE_R);
  ctx.stroke(HAT_SYMBIOTE_EYE_R);

  // Eye highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(0.5, -10, 1.2, 0, Math.PI * 2);
  ctx.arc(8.5, -9, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // 5. Sprawling White Chest Spider
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7;
  ctx.fill(HAT_SYMBIOTE_CHEST_SPIDER);
  ctx.stroke(HAT_SYMBIOTE_CHEST_SPIDER);
}

/**
 * 3. Bio-Electric Volt-Arachnid Mask
 * Carbon-weave black suit with vivid neon crimson webbing,
 * red-accented high-tech oculars and crackling bio-electric cyan sparks.
 */
function renderBioElectricMask(
  ctx: CanvasRenderingContext2D,
  _teamColor?: string,
  animTime: number = 0
): void {
  // 1. Carbon Dark Slate Cowl
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_ARACHNID_COWL);
  ctx.stroke(HAT_ARACHNID_COWL);

  // 2. High-Tech Neon Crimson Web Grid
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 0.9;
  ctx.stroke(HAT_ARACHNID_WEB_GRID);

  // 3. Red-Accented Eye Frames
  ctx.fillStyle = '#450a0a';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_ARACHNID_EYE_FRAME_L);
  ctx.stroke(HAT_ARACHNID_EYE_FRAME_L);
  ctx.fill(HAT_ARACHNID_EYE_FRAME_R);
  ctx.stroke(HAT_ARACHNID_EYE_FRAME_R);

  // 4. Bright White High-Tech Lenses
  ctx.fillStyle = '#ffffff';
  ctx.fill(HAT_ARACHNID_LENS_L);
  ctx.fill(HAT_ARACHNID_LENS_R);

  // 5. Crimson Chest Spider Emblem
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 0.7;
  ctx.fill(HAT_ARACHNID_CHEST_SPIDER);
  ctx.stroke(HAT_ARACHNID_CHEST_SPIDER);

  // 6. Crackling Bio-Electric Cyan Sparks
  const sparkPhase = Math.sin(animTime * 15);
  if (sparkPhase > 0.1) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-2, -15); ctx.lineTo(-0.5, -13); ctx.lineTo(1, -15.5);
    ctx.moveTo(9, -15); ctx.lineTo(10.5, -13.5); ctx.lineTo(12, -15);
    ctx.moveTo(4, 2); ctx.lineTo(5.5, 0.5); ctx.lineTo(5, -0.5);
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(-0.5, -13, 0.7, 0, Math.PI * 2);
    ctx.arc(10.5, -13.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const ARACHNID_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  arachnid_mask: renderArachnidMask,
  alien_symbiote: renderAlienSymbiote,
  bio_electric_mask: renderBioElectricMask,
};

import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_PATRIOT_SHELL,
  HAT_PATRIOT_VISOR_BRIM,
  HAT_PATRIOT_WING_L,
  HAT_PATRIOT_WING_R,
  HAT_PATRIOT_LETTER_A,
  HAT_PATRIOT_LETTER_A_SHADOW,
  HAT_PATRIOT_CHINSTRAP,
  HAT_TITANIUM_HELMET_BASE,
  HAT_TITANIUM_FACEPLATE,
  HAT_TITANIUM_CHEEK_RECESS,
  HAT_TITANIUM_EYE_L,
  HAT_TITANIUM_EYE_R,
  HAT_MISCHIEF_HORN_L,
  HAT_MISCHIEF_HORN_R,
  HAT_THUNDER_WING_L,
  HAT_THUNDER_WING_R,
  HAT_VILLAGE_PLATE,
  HAT_SHINOBI_HAIR_SPIKES,
  HAT_RENEGADE_CONE,
  HAT_SHADOW_MASK_PORCELAIN,
  HAT_SHADOW_MASK_INNER_EARS,
  HAT_SHADOW_MASK_EYES,
  HAT_SHADOW_MASK_WARPAINT,
  HAT_SHADOW_MASK_CORD,
} from './slugHatPathsHeroes';

function renderPatriotHelmet(ctx: CanvasRenderingContext2D): void {
  // 1. Tactical Deep Blue Helmet Shell
  ctx.fillStyle = '#1d4ed8';
  ctx.strokeStyle = '#172554';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_PATRIOT_SHELL);
  ctx.stroke(HAT_PATRIOT_SHELL);

  // 2. Forehead Visor Brow Ridge
  ctx.fillStyle = '#2563eb';
  ctx.fill(HAT_PATRIOT_VISOR_BRIM);
  ctx.stroke(HAT_PATRIOT_VISOR_BRIM);

  // 3. Leather Chinstrap & Brass Buckle
  ctx.fillStyle = '#3f1f0a';
  ctx.strokeStyle = '#1e0d04';
  ctx.lineWidth = 0.8;
  ctx.fill(HAT_PATRIOT_CHINSTRAP);
  ctx.stroke(HAT_PATRIOT_CHINSTRAP);

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(4.0, 3.2, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // 4. Layered Aerodynamic White Wings on Temples
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.9;
  ctx.fill(HAT_PATRIOT_WING_L);
  ctx.stroke(HAT_PATRIOT_WING_L);
  ctx.fill(HAT_PATRIOT_WING_R);
  ctx.stroke(HAT_PATRIOT_WING_R);

  // 5. Embossed White Capital "A" with Drop Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fill(HAT_PATRIOT_LETTER_A_SHADOW);

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 0.5;
  ctx.fill(HAT_PATRIOT_LETTER_A);
  ctx.stroke(HAT_PATRIOT_LETTER_A);
}

function renderTitaniumMask(ctx: CanvasRenderingContext2D): void {
  // 1. Glossy Armored Crimson Skull Base
  ctx.fillStyle = '#991b1b';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.4;
  ctx.fill(HAT_TITANIUM_HELMET_BASE);
  ctx.stroke(HAT_TITANIUM_HELMET_BASE);

  // 2. Sculpted Metallic Gold Faceplate
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.2;
  ctx.fill(HAT_TITANIUM_FACEPLATE);
  ctx.stroke(HAT_TITANIUM_FACEPLATE);

  // 3. Recessed Aerodynamic Cheek Indents
  ctx.fillStyle = '#78350f';
  ctx.fill(HAT_TITANIUM_CHEEK_RECESS);

  // 4. Forehead Plate Seam
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(1.5, -13.0); ctx.lineTo(7.5, -13.0);
  ctx.moveTo(3.2, -3.2); ctx.lineTo(5.8, -3.2);
  ctx.stroke();

  // 5. Blazing Cyan Arc-Reactor Eye Slots
  // Outer cyan glow
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.2;
  ctx.stroke(HAT_TITANIUM_EYE_L);
  ctx.stroke(HAT_TITANIUM_EYE_R);

  // Neon cyan fill & white core highlight
  ctx.fillStyle = '#22d3ee';
  ctx.fill(HAT_TITANIUM_EYE_L);
  ctx.fill(HAT_TITANIUM_EYE_R);

  ctx.fillStyle = '#f0fdf4';
  ctx.beginPath();
  ctx.fillRect(1.5, -10.8, 1.8, 0.8);
  ctx.fillRect(7.2, -10.1, 1.8, 0.8);
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
  // 1. Pristine Ivory Porcelain Mask Shell
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.3;
  ctx.fill(HAT_SHADOW_MASK_PORCELAIN);
  ctx.stroke(HAT_SHADOW_MASK_PORCELAIN);

  // 2. Soft Pink Inner Ears
  ctx.fillStyle = '#f472b6';
  ctx.fill(HAT_SHADOW_MASK_INNER_EARS);

  // 3. Slanted Feline Eye Cutouts
  ctx.fillStyle = '#09090b';
  ctx.fill(HAT_SHADOW_MASK_EYES);

  // 4. Ceremonial Vermilion Warpaint (Whisker curves, brow flame & snout)
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1.1;
  ctx.fill(HAT_SHADOW_MASK_WARPAINT);
  ctx.stroke(HAT_SHADOW_MASK_WARPAINT);

  // 5. Hanging Ceremonial Red Braided Cord & Amber Bead
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 0.8;
  ctx.fill(HAT_SHADOW_MASK_CORD);
  ctx.stroke(HAT_SHADOW_MASK_CORD);

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(-3.0, 1.2, 0.8, 0, Math.PI * 2);
  ctx.fill();
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

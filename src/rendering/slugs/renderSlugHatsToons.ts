import { HatRendererFn } from './renderSlugHatTypes';
import {
  HAT_MARINE_COOK_CROWN,
  HAT_MARINE_COOK_BAND,
  HAT_SPONGE_DOME_BODY,
  HAT_STARFISH_CONE,
  HAT_SODA_VISOR,
  HAT_SODA_CROWN,
  HAT_SODA_CAN_L,
  HAT_SODA_CAN_R,
  HAT_CRIMSON_BOW_L,
  HAT_CRIMSON_BOW_R,
  HAT_CRIMSON_BOW_TAIL_L,
  HAT_CRIMSON_BOW_TAIL_R,
  HAT_TWINTAIL_BALL_L,
  HAT_TWINTAIL_BALL_R,
  HAT_REBEL_HAIR,
  HAT_TRIO_BAND,
  HAT_ADVENTURER_HAIR,
  HAT_MONKEY_CREST,
  HAT_SATCHEL_BODY,
  HAT_SAFARI_BRIM,
  HAT_SAFARI_CROWN,
} from './slugHatPathsToons';

function renderMarineCookCap(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_MARINE_COOK_CROWN); ctx.stroke(HAT_MARINE_COOK_CROWN);
  ctx.fillStyle = '#e2e8f0'; ctx.fill(HAT_MARINE_COOK_BAND); ctx.stroke(HAT_MARINE_COOK_BAND);
  // Embroidered blue marine anchor
  ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(5.0, -14.2); ctx.lineTo(5.0, -11.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(5.0, -14.0, 0.7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(5.0, -12.2, 1.4, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
}

function renderPorousYellowDome(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_SPONGE_DOME_BODY); ctx.stroke(HAT_SPONGE_DOME_BODY);
  // Alveolar olive pores
  ctx.fillStyle = '#ca8a04';
  for (const [px, py, r] of [[0.0, -16.0, 1.2], [7.0, -18.0, 1.0], [9.5, -15.5, 0.8], [3.0, -19.0, 0.9], [4.5, -15.0, 1.1]]) {
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  // Two white buck teeth at base center
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.rect(3.8, -12.5, 1.1, 1.6); ctx.rect(5.1, -12.5, 1.1, 1.6); ctx.fill(); ctx.stroke();
}

function renderStarfishPinkCone(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f472b6'; ctx.strokeStyle = '#9d174d'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_STARFISH_CONE); ctx.stroke(HAT_STARFISH_CONE);
  // Purple dotted speckles
  ctx.fillStyle = '#be185d';
  for (const [px, py] of [[4.2, -22.0], [5.5, -19.5], [3.2, -17.0], [6.8, -16.2], [4.8, -14.8]]) {
    ctx.beginPath(); ctx.arc(px, py, 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

function renderSodaDispenserCap(ctx: CanvasRenderingContext2D, _color: string, animTime: number): void {
  ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.2;
  ctx.fill(HAT_SODA_CROWN); ctx.stroke(HAT_SODA_CROWN);
  ctx.fill(HAT_SODA_VISOR); ctx.stroke(HAT_SODA_VISOR);
  // Twin lateral soda cans
  ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#1e3a8a';
  ctx.fill(HAT_SODA_CAN_L); ctx.stroke(HAT_SODA_CAN_L);
  ctx.fill(HAT_SODA_CAN_R); ctx.stroke(HAT_SODA_CAN_R);
  // Wavy drinking straws
  const sway = Math.sin(animTime * 4) * 0.4;
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-4.0, -19.5); ctx.quadraticCurveTo(-7.0 + sway, -14.0, -3.0, -9.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13.8, -19.5); ctx.quadraticCurveTo(16.5 - sway, -14.0, 11.5, -8.5); ctx.stroke();
}

function renderCrimsonHeroRibbon(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  const sway = Math.sin(animTime * 3.5) * 0.5;
  ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.3;
  // Hanging ribbon tails behind
  ctx.fill(HAT_CRIMSON_BOW_TAIL_L); ctx.stroke(HAT_CRIMSON_BOW_TAIL_L);
  ctx.fill(HAT_CRIMSON_BOW_TAIL_R); ctx.stroke(HAT_CRIMSON_BOW_TAIL_R);
  // Large upright bow wings
  ctx.fill(HAT_CRIMSON_BOW_L); ctx.stroke(HAT_CRIMSON_BOW_L);
  ctx.fill(HAT_CRIMSON_BOW_R); ctx.stroke(HAT_CRIMSON_BOW_R);
  // Central bow knot
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(5.0, -17.5 + sway * 0.2, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function renderBouncyBlondeTwintails(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  const bounce = Math.sin(animTime * 4.5) * 0.7;
  ctx.fillStyle = '#06b6d4'; ctx.fillRect(-3.0, -14.5 + bounce, 1.8, 1.8); ctx.fillRect(11.2, -14.0 - bounce, 1.8, 1.8);
  ctx.save();
  ctx.translate(0, bounce);
  ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_TWINTAIL_BALL_L); ctx.stroke(HAT_TWINTAIL_BALL_L);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -bounce);
  ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_TWINTAIL_BALL_R); ctx.stroke(HAT_TWINTAIL_BALL_R);
  ctx.restore();
}

function renderRebelRavenCrop(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#09090b'; ctx.strokeStyle = '#27272a'; ctx.lineWidth = 1.2;
  ctx.fill(HAT_REBEL_HAIR); ctx.stroke(HAT_REBEL_HAIR);
  // Sharp highlight gloss on fringe
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(1.0, -14.5); ctx.quadraticCurveTo(5.0, -18.0, 9.0, -14.5); ctx.stroke();
}

function renderTrioColoredHearts(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.4; ctx.stroke(HAT_TRIO_BAND);
  // 3 Mini glossy hearts (Pink, Sky Blue, Lime Green)
  const drawHeart = (cx: number, cy: number, color: string) => {
    ctx.fillStyle = color; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx - 1.2, cy - 1.6, cx - 2.2, cy + 0.4, cx, cy + 2.0);
    ctx.bezierCurveTo(cx + 2.2, cy + 0.4, cx + 1.2, cy - 1.6, cx, cy);
    ctx.fill(); ctx.stroke();
  };
  drawHeart(1.5, -17.5, '#f472b6');
  drawHeart(5.0, -19.5, '#38bdf8');
  drawHeart(8.5, -17.5, '#4ade80');
}

function renderAdventurerFringeBob(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#54311c'; ctx.strokeStyle = '#271406'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_ADVENTURER_HAIR); ctx.stroke(HAT_ADVENTURER_HAIR);
  // Bright yellow sun hairclip on temple
  ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(10.2, -12.5, 1.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function renderPlayfulMonkeyCrest(ctx: CanvasRenderingContext2D, _c: string, animTime: number): void {
  const sway = Math.sin(animTime * 4) * 0.4;
  ctx.save();
  ctx.translate(sway, 0);
  ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_MONKEY_CREST); ctx.stroke(HAT_MONKEY_CREST);
  // Golden holding ring at the base
  ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.rect(3.5, -15.2, 3.0, 1.4); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function renderCheerfulSatchel(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#9333ea'; ctx.strokeStyle = '#581c87'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_SATCHEL_BODY); ctx.stroke(HAT_SATCHEL_BODY);
  // Orange shoulder straps
  ctx.fillStyle = '#f97316'; ctx.fillRect(1.0, -14.5, 1.5, 2.5); ctx.fillRect(7.5, -14.5, 1.5, 2.5);
  // Cheerful face (eyes and smile)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(3.5, -17.5, 0.9, 0, Math.PI * 2); ctx.arc(6.5, -17.5, 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath(); ctx.arc(3.7, -17.5, 0.45, 0, Math.PI * 2); ctx.arc(6.7, -17.5, 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(5.0, -15.5, 1.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
}

function renderSafariFieldHat(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 1.3;
  ctx.fill(HAT_SAFARI_CROWN); ctx.stroke(HAT_SAFARI_CROWN);
  // Pink ribbon band
  ctx.fillStyle = '#ec4899'; ctx.fillRect(-1.2, -14.2, 12.4, 2.0);
  ctx.fill(HAT_SAFARI_BRIM); ctx.stroke(HAT_SAFARI_BRIM);
}

export const TOONS_HAT_STRATEGIES: Record<string, HatRendererFn> = {
  marine_cook_cap: renderMarineCookCap,
  porous_yellow_dome: renderPorousYellowDome,
  starfish_pink_cone: renderStarfishPinkCone,
  soda_dispenser_cap: renderSodaDispenserCap,
  crimson_hero_ribbon: renderCrimsonHeroRibbon,
  bouncy_blonde_twintails: renderBouncyBlondeTwintails,
  rebel_raven_crop: renderRebelRavenCrop,
  trio_colored_hearts: renderTrioColoredHearts,
  adventurer_fringe_bob: renderAdventurerFringeBob,
  playful_monkey_crest: renderPlayfulMonkeyCrest,
  cheerful_satchel: renderCheerfulSatchel,
  safari_field_hat: renderSafariFieldHat,
};

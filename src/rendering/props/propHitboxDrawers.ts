import { SolidProp } from '../../core/types';

export type PropHitboxDrawer = (ctx: CanvasRenderingContext2D) => void;

export const SOLID_PROP_HITBOX_DRAWERS: Record<SolidProp['type'], PropHitboxDrawer> = {
  tree: (ctx) => {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-7, -45, 14, 45);
    ctx.beginPath();
    ctx.arc(0, -35, 18, 0, Math.PI * 2);
    ctx.stroke();
  },
  mushroom: (ctx) => {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-6, -16, 12, 16);
    ctx.beginPath();
    ctx.ellipse(0, -21, 14, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
  hedgehog: (ctx) => {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-2, -9, 14, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
  chick: (ctx) => {
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  },
  flower: (ctx) => {
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-2, -14, 4, 14);
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.stroke();
  },
  bunker: (ctx) => {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-18, -26, 36, 26);
  },
  totem: (ctx) => {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-12, -36, 24, 36);
  },
  cactus: (ctx) => {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-11, -38, 22, 38);
  },
  crystal: (ctx) => {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-13, -26, 26, 26);
  },
  oil_drum: (ctx) => {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-9, -24, 18, 24);
  },
  lamppost: (ctx) => {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-7, -42, 14, 42);
  },
};

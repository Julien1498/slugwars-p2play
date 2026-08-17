import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D, SolidProp, CraterRecord, ExplosionEvent, PlacedGirder } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { SeededRandom } from '../../core/terrainGenerator';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';

export type TargetPointPayload = Vector2D & { aimAngle?: number; aimPower?: number; facing?: 'left' | 'right' };

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire: (targetPoint?: TargetPointPayload) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onStartCharge?: (targetPoint?: TargetPointPayload) => void;
  onReleaseCharge?: (targetPoint?: TargetPointPayload) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

function getPixelHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export function drawSolidPropVector(ctx: CanvasRenderingContext2D, sprop: SolidProp, _animTime: number = 0) {
  ctx.save();
  ctx.translate(sprop.x, sprop.y);
  if (sprop.angleRad) {
    ctx.rotate(sprop.angleRad);
  }

  if (sprop.type === 'hedgehog') {
    const spikeAngles = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];

    // Dark Undercoat Spikes
    ctx.fillStyle = '#451a03';
    for (const a of spikeAngles) {
      const sx = Math.cos(a - 0.7) * 14;
      const sy = Math.sin(a - 0.7) * 11 - 10;
      ctx.beginPath();
      ctx.moveTo(sx * 0.5, sy * 0.5 - 6);
      ctx.lineTo(sx * 1.35, sy * 1.35);
      ctx.lineTo(sx * 0.5 + 3, sy * 0.5 - 6);
      ctx.closePath();
      ctx.fill();
    }

    // Golden/Brown Foreground Spikes
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 0.8;
    for (const a of spikeAngles) {
      const sx = Math.cos(a - 0.75) * 12;
      const sy = Math.sin(a - 0.75) * 9 - 10;
      ctx.beginPath();
      ctx.moveTo(sx * 0.4, sy * 0.4 - 5);
      ctx.lineTo(sx * 1.2, sy * 1.2);
      ctx.lineTo(sx * 0.4 + 2, sy * 0.4 - 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Plump Brown Body
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(-2, -9, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft Peach Face & Snout
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(4, -8, 8, 6.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Snout Tip Point
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(13, -7);
    ctx.lineTo(8, -4);
    ctx.closePath();
    ctx.fill();

    // Pink Cheek Blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.beginPath();
    ctx.ellipse(4, -5, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Button Nose
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(13, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Glossy Eye with White Sparkle
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(7, -10, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7.6, -10.6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Cute Ear
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-2, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute Dark Paws on Ground
    ctx.fillStyle = '#542608';
    ctx.beginPath();
    ctx.ellipse(-6, -1, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -1, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'chick') {
    // Bright Yellow Chick
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(-4, -10, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(10, -14);
    ctx.lineTo(17, -11);
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(7, -15, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7.5, -16, 1, 1);
  } else if (sprop.type === 'mushroom') {
    const isPurple = sprop.variant === 1;
    const isGold = sprop.variant === 2;

    // Grass Tufts at Base
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-6, -1, 4, 2, -0.4, 0, Math.PI * 2);
    ctx.ellipse(6, -1, 4, 2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Organic Curved Stem
    const stemGrad = ctx.createLinearGradient(0, -16, 0, 0);
    stemGrad.addColorStop(0, '#fef9c3');
    stemGrad.addColorStop(1, '#fde047');

    ctx.fillStyle = stemGrad;
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.quadraticCurveTo(-6, -6, -7, 0);
    ctx.lineTo(7, 0);
    ctx.quadraticCurveTo(6, -6, 4, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ring Veil under cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -14, 5.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Shadow under Cap Gills
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -16, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plump 3D Umbrella Dome Cap
    const capGrad = ctx.createLinearGradient(0, -28, 0, -14);
    if (isPurple) {
      capGrad.addColorStop(0, '#c084fc');
      capGrad.addColorStop(0.5, '#9333ea');
      capGrad.addColorStop(1, '#581c87');
    } else if (isGold) {
      capGrad.addColorStop(0, '#fde047');
      capGrad.addColorStop(0.5, '#d97706');
      capGrad.addColorStop(1, '#78350f');
    } else {
      capGrad.addColorStop(0, '#f87171');
      capGrad.addColorStop(0.5, '#dc2626');
      capGrad.addColorStop(1, '#7f1d1d');
    }

    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.moveTo(-14, -16);
    ctx.quadraticCurveTo(-15, -28, 0, -28);
    ctx.quadraticCurveTo(15, -28, 14, -16);
    ctx.quadraticCurveTo(0, -13, -14, -16);
    ctx.closePath();
    ctx.fill();

    // Polka Dots
    ctx.fillStyle = isPurple ? '#f472b6' : isGold ? '#fef3c7' : '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -21, 2.8, 0, Math.PI * 2);
    ctx.arc(-7, -20, 2.2, 0, Math.PI * 2);
    ctx.arc(7, -19, 2.4, 0, Math.PI * 2);
    ctx.arc(-2, -25, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'flower') {
    // Colorful Flower
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-1.5, -14, 3, 14);

    ctx.fillStyle = sprop.variant === 1 ? '#ec4899' : sprop.variant === 2 ? '#3b82f6' : '#c084fc';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 7, -16 + Math.sin(a) * 7, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -16, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'tree') {
    const isPine = sprop.variant === 1;

    // Wood Trunk & Flared Roots
    const trunkGrad = ctx.createLinearGradient(-6, -45, 6, 0);
    trunkGrad.addColorStop(0, '#78350f');
    trunkGrad.addColorStop(0.5, '#451a03');
    trunkGrad.addColorStop(1, '#27160a');
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-4, -20);
    ctx.lineTo(-8, -32);
    ctx.lineTo(-5, -33);
    ctx.lineTo(-2, -22);
    ctx.lineTo(2, -22);
    ctx.lineTo(6, -31);
    ctx.lineTo(8, -30);
    ctx.lineTo(4, -20);
    ctx.lineTo(7, 0);
    ctx.closePath();
    ctx.fill();

    // Wood Bark Texture Lines
    ctx.strokeStyle = '#27160a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(-1, -18);
    ctx.moveTo(2, -8);
    ctx.lineTo(3, -16);
    ctx.stroke();

    if (isPine) {
      const pineTiers = [
        { y: -16, r: 18, h: 16, color: '#064e3b' },
        { y: -26, r: 15, h: 14, color: '#047857' },
        { y: -35, r: 12, h: 12, color: '#10b981' },
        { y: -43, r: 8,  h: 10, color: '#34d399' },
      ];
      for (const tier of pineTiers) {
        ctx.fillStyle = tier.color;
        ctx.beginPath();
        ctx.moveTo(0, tier.y - tier.h);
        ctx.lineTo(tier.r, tier.y);
        ctx.lineTo(-tier.r, tier.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-8, -20, 2.5, 0, Math.PI * 2);
      ctx.arc(7, -28, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const oakClusters = [
        { x: -11, y: -28, r: 14, color: '#14532d' },
        { x: 11,  y: -28, r: 14, color: '#14532d' },
        { x: -7,  y: -38, r: 13, color: '#15803d' },
        { x: 7,   y: -38, r: 13, color: '#15803d' },
        { x: 0,   y: -44, r: 11, color: '#22c55e' },
      ];
      for (const c of oakClusters) {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-8, -32, 2.2, 0, Math.PI * 2);
      ctx.arc(6, -36, 2.0, 0, Math.PI * 2);
      ctx.arc(-2, -42, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (sprop.type === 'bunker') {
    // --- FORTIFIED MILITARY REINFORCED CONCRETE BUNKER ---
    const bunkerGrad = ctx.createLinearGradient(-18, -26, 18, 0);
    bunkerGrad.addColorStop(0, '#64748b');
    bunkerGrad.addColorStop(0.6, '#475569');
    bunkerGrad.addColorStop(1, '#334155');
    ctx.fillStyle = bunkerGrad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;

    // Trapezoidal Sloped Pillbox Shape
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-15, -22);
    ctx.lineTo(15, -22);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sandbag Bulwarks at base
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(-14, -3, 5, 3, 0.1, 0, Math.PI * 2);
    ctx.ellipse(-13, -7, 4.5, 2.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(14, -3, 5, 3, -0.1, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 4.5, 2.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Firing Slit Visor Window
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-10, -16, 20, 5);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -16, 20, 5);

    // Scanning Radar Light inside visor
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -13.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Yellow/Black Hazard Stripes
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-8, -10, 4, 3);
    ctx.fillRect(4, -10, 4, 3);

    // Steel Top Hatch & Antenna
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -24, 12, 2.5);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, -22);
    ctx.lineTo(8, -34);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(8, -34, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'totem') {
    // --- ANCIENT MYSTICAL CARVED STONE MOAI / TIKI IDOL ---
    const stoneGrad = ctx.createLinearGradient(-12, -36, 12, 0);
    stoneGrad.addColorStop(0, '#64748b');
    stoneGrad.addColorStop(0.5, '#475569');
    stoneGrad.addColorStop(1, '#334155');
    ctx.fillStyle = stoneGrad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;

    // Monolith Head Profile
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-12, -26);
    ctx.lineTo(-8, -34);
    ctx.lineTo(8, -34);
    ctx.lineTo(12, -26);
    ctx.lineTo(11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chiselled Heavy Brow
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -28, 20, 4);

    // Glowing Mystical Eyes
    const eyeGlow = sprop.variant === 1 ? '#06b6d4' : '#facc15';
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(-5, -22, 2.2, 0, Math.PI * 2);
    ctx.arc(5, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(-5, -22, 1, 0, Math.PI * 2);
    ctx.arc(5, -22, 1, 0, Math.PI * 2);
    ctx.fill();

    // Stylized Long Stone Nose
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -24);
    ctx.lineTo(3, -24);
    ctx.lineTo(4, -13);
    ctx.lineTo(-4, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stoic Stone Mouth Slit
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-6, -9, 12, 3);

    // Moss / Lichen Patches
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(-6, -33, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.ellipse(7, -31, 3.5, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Rock Cracks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.lineTo(-9, -12);
    ctx.lineTo(-7, -6);
    ctx.stroke();
  } else if (sprop.type === 'cactus') {
    // --- WILD WEST SAGUARO DESERT CACTUS ---
    const cactusGrad = ctx.createLinearGradient(-10, -36, 10, 0);
    cactusGrad.addColorStop(0, '#22c55e');
    cactusGrad.addColorStop(0.5, '#16a34a');
    cactusGrad.addColorStop(1, '#15803d');

    ctx.fillStyle = cactusGrad;
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.4;

    // Main Central Trunk
    ctx.beginPath();
    ctx.roundRect(-5.5, -36, 11, 36, [5, 5, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Left Branch Arm
    ctx.beginPath();
    ctx.moveTo(-5.5, -18);
    ctx.lineTo(-11, -18);
    ctx.lineTo(-11, -29);
    ctx.arc(-8.5, -29, 2.5, Math.PI, 0);
    ctx.lineTo(-6, -14);
    ctx.lineTo(-5.5, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Branch Arm
    ctx.beginPath();
    ctx.moveTo(5.5, -22);
    ctx.lineTo(11, -22);
    ctx.lineTo(11, -33);
    ctx.arc(8.5, -33, 2.5, 0, Math.PI);
    ctx.lineTo(6, -18);
    ctx.lineTo(5.5, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vertical Rib Lines
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2, -34);
    ctx.lineTo(-2, -1);
    ctx.moveTo(2, -34);
    ctx.lineTo(2, -1);
    ctx.stroke();

    // Prickly Needles
    ctx.fillStyle = '#fef08a';
    const needlesY = [-30, -24, -18, -12, -6];
    for (const ny of needlesY) {
      ctx.fillRect(-7, ny, 2, 1);
      ctx.fillRect(5.5, ny, 2, 1);
    }

    // Top Desert Blossom Flower
    ctx.fillStyle = sprop.variant === 1 ? '#f43f5e' : '#facc15';
    ctx.beginPath();
    ctx.arc(0, -36, 3.5, 0, Math.PI * 2);
    ctx.arc(-2.5, -38, 2, 0, Math.PI * 2);
    ctx.arc(2.5, -38, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'crystal') {
    // --- LUMINOUS GLOWING CRYSTAL GEODE CLUSTER ---
    const isAmethyst = sprop.variant === 0 || sprop.variant === undefined;
    const isCyan = sprop.variant === 1;

    // Dark Rock Crust Base
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-7, -9);
    ctx.lineTo(6, -9);
    ctx.lineTo(14, -6);
    ctx.lineTo(13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gem Crystals Array
    const shards = [
      { x: 0, y: -8, h: 22, w: 7, angle: 0 },
      { x: -6, y: -7, h: 17, w: 5.5, angle: -0.25 },
      { x: 6, y: -7, h: 18, w: 5.5, angle: 0.22 },
      { x: -10, y: -5, h: 12, w: 4.5, angle: -0.45 },
      { x: 10, y: -5, h: 13, w: 4.5, angle: 0.42 },
    ];

    for (const s of shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      const gemGrad = ctx.createLinearGradient(0, -s.h, 0, 0);
      if (isAmethyst) {
        gemGrad.addColorStop(0, '#f5d0fe');
        gemGrad.addColorStop(0.4, '#c084fc');
        gemGrad.addColorStop(1, '#6b21a8');
      } else if (isCyan) {
        gemGrad.addColorStop(0, '#e0f2fe');
        gemGrad.addColorStop(0.4, '#38bdf8');
        gemGrad.addColorStop(1, '#0284c7');
      } else {
        gemGrad.addColorStop(0, '#d1fae5');
        gemGrad.addColorStop(0.4, '#34d399');
        gemGrad.addColorStop(1, '#059669');
      }

      ctx.fillStyle = gemGrad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.moveTo(-s.w / 2, 0);
      ctx.lineTo(-s.w / 2, -s.h * 0.7);
      ctx.lineTo(0, -s.h);
      ctx.lineTo(s.w / 2, -s.h * 0.7);
      ctx.lineTo(s.w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s.h);
      ctx.stroke();

      ctx.restore();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -22, 1.8, 0, Math.PI * 2);
    ctx.arc(-6, -16, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (sprop.type === 'oil_drum') {
    // --- INDUSTRIAL RUSTED OIL / FUEL DRUM ---
    const isRust = sprop.variant === 1;
    const drumGrad = ctx.createLinearGradient(-9, -24, 9, 0);
    if (isRust) {
      drumGrad.addColorStop(0, '#b45309');
      drumGrad.addColorStop(0.5, '#78350f');
      drumGrad.addColorStop(1, '#451a03');
    } else {
      drumGrad.addColorStop(0, '#ef4444');
      drumGrad.addColorStop(0.5, '#b91c1c');
      drumGrad.addColorStop(1, '#7f1d1d');
    }

    ctx.fillStyle = drumGrad;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.roundRect(-9, -24, 18, 24, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, -19);
    ctx.lineTo(9, -19);
    ctx.moveTo(-9, -12);
    ctx.lineTo(9, -12);
    ctx.moveTo(-9, -5);
    ctx.lineTo(9, -5);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.fillRect(-9, -16, 18, 5);

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-2.5, -12);
    ctx.quadraticCurveTo(-4, -14, 0, -16);
    ctx.quadraticCurveTo(4, -14, 2.5, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-5, -26, 4, 2.5);
  } else if (sprop.type === 'lamppost') {
    // --- VICTORIAN WROUGHT-IRON STREET LAMP ---
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-2, -6);
    ctx.lineTo(2, -6);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.fillRect(-1.5, -34, 3, 28);
    ctx.strokeRect(-1.5, -34, 3, 28);

    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(6, -35, 6, -38);
    ctx.lineTo(0, -38);
    ctx.stroke();

    const glowGrad = ctx.createRadialGradient(0, -32, 2, 0, -32, 16);
    glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    glowGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -32, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -28);
    ctx.lineTo(-6, -35);
    ctx.lineTo(6, -35);
    ctx.lineTo(5, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-7, -35);
    ctx.lineTo(0, -40);
    ctx.lineTo(7, -35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function renderHDDestructibleProp(
  ctx: CanvasRenderingContext2D,
  sprop: SolidProp,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  animTime: number,
  grid: Uint8Array,
  width: number
) {
  // 1. Check if the foundation is completely gone across the base
  const halfW = Math.max(4, Math.floor(sprop.width / 2));
  let solidFoundationCount = 0;
  for (let ox = -halfW; ox <= halfW; ox += Math.max(1, Math.floor(halfW / 2))) {
    const gx = Math.floor(sprop.x + ox);
    const gy = Math.floor(sprop.y + 1);
    const idx = gy * width + gx;
    if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
      solidFoundationCount++;
    }
  }
  // If 100% of the ground below the entire prop base has been destroyed, prop collapses
  if (solidFoundationCount === 0) {
    sprop.destroyed = true;
    return;
  }

  const propRadius = Math.max(sprop.width, sprop.height) * 0.85;
  const propCenterY = sprop.y - sprop.height / 2;

  // 2. Find all overlapping craters
  const overlappingCraters: { x: number; y: number; radius: number }[] = [];

  if (craters) {
    for (const c of craters) {
      const dist = Math.hypot(c.x - sprop.x, c.y - propCenterY);
      if (dist <= c.radius + propRadius) {
        overlappingCraters.push(c);
      }
    }
  }
  if (explosions) {
    for (const ex of explosions) {
      const dist = Math.hypot(ex.x - sprop.x, ex.y - propCenterY);
      if (dist <= ex.radius + propRadius) {
        overlappingCraters.push(ex);
      }
    }
  }

  // 3. Fast Path: If NO craters touch this prop, render in direct razor-sharp HD Vector!
  if (overlappingCraters.length === 0) {
    drawSolidPropVector(ctx, sprop, animTime);
    return;
  }

  // 4. Carved Path: If craters DO touch the prop, carve them dynamically via native vector clipping!
  // This preserves 100% razor-sharp vector anti-aliasing & device pixel resolution without any bitmap rasterization!
  ctx.save();
  for (const c of overlappingCraters) {
    const notCircle = new Path2D();
    notCircle.rect(sprop.x - 200, sprop.y - 200, 400, 400);
    notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.clip(notCircle, 'evenodd');
  }

  drawSolidPropVector(ctx, sprop, animTime);
  ctx.restore();
}

export function renderHDDestructibleGirder(
  ctx: CanvasRenderingContext2D,
  g: PlacedGirder,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  grid: Uint8Array,
  width: number
) {
  if (g.destroyed) return;

  // 1. Check if the girder has any solid pixels remaining in grid
  const rad = (g.angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfL = g.length / 2;
  const halfT = g.thickness / 2;

  let solidCount = 0;
  const totalSamples = 13;
  for (let s = 0; s < totalSamples; s++) {
    const t = -halfL + (s / (totalSamples - 1)) * g.length;
    const px = Math.round(g.x + t * cos);
    const py = Math.round(g.y + t * sin);
    const idx = py * width + px;
    if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
      solidCount++;
    }
  }

  // If 100% of the girder's mass is destroyed, don't draw it
  if (solidCount === 0) {
    g.destroyed = true;
    return;
  }

  const girderRadius = Math.max(g.length, g.thickness) * 0.65;

  // 2. Find all overlapping craters & active explosions
  const overlappingCraters: { x: number; y: number; radius: number }[] = [];
  if (craters) {
    for (const c of craters) {
      const dist = Math.hypot(c.x - g.x, c.y - g.y);
      if (dist <= c.radius + girderRadius) {
        overlappingCraters.push(c);
      }
    }
  }
  if (explosions) {
    for (const ex of explosions) {
      const dist = Math.hypot(ex.x - g.x, ex.y - g.y);
      if (dist <= ex.radius + girderRadius) {
        overlappingCraters.push(ex);
      }
    }
  }

  ctx.save();

  // 3. Dynamic Vector Crater Carving: carve overlapping blast holes via native GPU vector clipping!
  if (overlappingCraters.length > 0) {
    for (const c of overlappingCraters) {
      const notCircle = new Path2D();
      notCircle.rect(g.x - 200, g.y - 200, 400, 400);
      notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.clip(notCircle, 'evenodd');
    }
  }

  // 4. Draw Girder Vector
  ctx.translate(g.x, g.y);
  ctx.rotate(rad);

  // Steel beam body
  ctx.fillStyle = '#475569';
  ctx.fillRect(-halfL, -halfT, g.length, g.thickness);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-halfL, -halfT, g.length, g.thickness);

  // Hazard stripes
  ctx.fillStyle = '#facc15';
  for (let i = -halfL + 6; i < halfL - 6; i += 16) {
    ctx.fillRect(i, -halfT + 2, 6, g.thickness - 4);
  }

  // Rivet dots
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(-halfL + 4, 0, 1.5, 0, Math.PI * 2);
  ctx.arc(halfL - 4, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = React.memo(({
  gameState,
  terrain,
  isMyTurn,
  showHitboxes = false,
  onFire,
  onPlaceSlug,
  onStartCharge,
  onReleaseCharge,
  onUpdateAim,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const occlusionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const terrainHitboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const distMapRef = useRef<Float32Array | null>(null);
  const lastSeedRef = useRef<string | null>(null);
  const lastTerrainRevisionRef = useRef<number>(-1);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsCanvasRef = useRef<Set<string>>(new Set());
  const knownCraterIdsCanvasRef = useRef<Set<string>>(new Set());
  const slugDeathTimestampsRef = useRef<Map<string, number>>(new Map());
  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;
  const showHitboxesRef = useRef(showHitboxes);
  showHitboxesRef.current = showHitboxes;

  // Smooth Camera Pan & Cursor-Centered Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  const [panOffset, setPanOffset] = useState<Vector2D>({ x: 0, y: 0 });
  const panRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isDraggingCameraRef = useRef<boolean>(false);
  const dragStartMouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragStartPanRef = useRef<Vector2D>({ x: 0, y: 0 });
  const hasMovedCameraRef = useRef<boolean>(false);
  const clientParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[]>([]);
  const clientExplosionsRef = useRef<{ id: string; x: number; y: number; radius: number; startTime: number; duration: number }[]>([]);
  const clientFloatingDamagesRef = useRef<{ id: string; x: number; y: number; damage: number; startTime: number; duration: number }[]>([]);
  const prevSlugHpsRef = useRef<Map<string, number>>(new Map());
  const currentRenderWaterYRef = useRef<number>(terrain.data.waterLevel);

  // Zero-Overhead In-Game Permanent FPS HUD Refs
  const fpsBadgeRef = useRef<HTMLDivElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);
  const fpsDotRef = useRef<HTMLSpanElement | null>(null);
  const fpsCounterFramesRef = useRef(0);
  const lastFpsHudUpdateRef = useRef(performance.now());

  // Subscribe to FPS HUD toggle without triggering any React component re-render
  useEffect(() => {
    const unsub = perfTracker.onFpsHudToggle((enabled) => {
      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.style.display = enabled ? 'flex' : 'none';
      }
    });
    return unsub;
  }, []);

  // Ultra-Fast 32-bit integer terrain rendering (<4ms full scan, <0.2ms dirty box!)
  const redrawOffscreenTerrain = useCallback((dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }) => {
    const { width, height, grid } = terrain.data;
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    if (offCanvas.width !== width || offCanvas.height !== height) {
      offCanvas.width = width;
      offCanvas.height = height;
    }
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    const isFullScan = !dirtyBox;
    const minX = dirtyBox ? Math.max(0, dirtyBox.minX) : 0;
    const maxX = dirtyBox ? Math.min(width - 1, dirtyBox.maxX) : width - 1;
    const minY = dirtyBox ? Math.max(0, dirtyBox.minY) : 0;
    const maxY = dirtyBox ? Math.min(height - 1, dirtyBox.maxY) : height - 1;

    if (isFullScan) {
      offCtx.clearRect(0, 0, width, height);
    }

    const dirtyW = maxX - minX + 1;
    const dirtyH = maxY - minY + 1;
    const imgData = offCtx.createImageData(dirtyW, dirtyH);
    const data32 = new Uint32Array(imgData.data.buffer);

    // Fast Little-Endian ABGR 32-bit integer colors
    const grassHighlight = 0xff35e6a3; // #a3e635 Lime top edge
    const grassBody = 0xff5ec522;      // #22c55e Rich grass green
    const grassShadow = 0xff3d8015;    // #15803d Dark forest green
    const grassDeep = 0xff2d5314;      // #14532d Deep undercoat shadow

    // Soil colors matching Earth (Light surface -> Dark deep cavern rock)
    const soilLight = 0xff183154;   // #543118 Warm topsoil
    const soilMedium = 0xff11233d;  // #3d2311 Rich earthy brown
    const soilDark = 0xff040914;    // #140904 Deep subterranean dark rock
    const soilSeam = 0xff02050b;    // #0b0502 Deep dark soil crack/seam

    let distMap = distMapRef.current;
    if (!distMap || distMap.length !== width * height) {
      distMap = new Float32Array(width * height);
      distMapRef.current = distMap;
    }
    distMap.fill(99);

    const waterThreshold = (terrain.data.waterLevel ?? (height - 60)) - 10;

    // Ultra-Fast 2-Pass Integer/Float Distance Transform
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      const prevRowOffset = (y - 1) * width;
      for (let x = minX; x <= maxX; x++) {
        const idx = rowOffset + x;
        if (grid[idx] === 0) {
          distMap[idx] = 0;
        } else {
          let d = 99;
          if (x > minX) {
            const leftD = distMap[idx - 1] + 1;
            if (leftD < d) d = leftD;
          }
          if (y > minY) {
            const topD = distMap[prevRowOffset + x] + 1;
            if (topD < d) d = topD;
            if (x > minX) {
              const diag1 = distMap[prevRowOffset + x - 1] + 1.414;
              if (diag1 < d) d = diag1;
            }
            if (x < maxX) {
              const diag2 = distMap[prevRowOffset + x + 1] + 1.414;
              if (diag2 < d) d = diag2;
            }
          }
          distMap[idx] = d;
        }
      }
    }

    for (let y = maxY; y >= minY; y--) {
      const rowOffset = y * width;
      const nextRowOffset = (y + 1) * width;
      for (let x = maxX; x >= minX; x--) {
        const idx = rowOffset + x;
        if (grid[idx] === 0) continue;
        let d = distMap[idx];
        if (x < maxX) {
          const rightD = distMap[idx + 1] + 1;
          if (rightD < d) d = rightD;
        }
        if (y < maxY) {
          const bottomD = distMap[nextRowOffset + x] + 1;
          if (bottomD < d) d = bottomD;
          if (x < maxX) {
            const diag1 = distMap[nextRowOffset + x + 1] + 1.414;
            if (diag1 < d) d = diag1;
          }
          if (x > minX) {
            const diag2 = distMap[nextRowOffset + x - 1] + 1.414;
            if (diag2 < d) d = diag2;
          }
        }
        distMap[idx] = d;
      }
    }

    // Render Terrain Pixels inside Dirty Bounding Box
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      const dirtyRowOffset = (y - minY) * dirtyW;
      for (let x = minX; x <= maxX; x++) {
        const idx = rowOffset + x;
        const dirtyIdx = dirtyRowOffset + (x - minX);

        if (grid[idx] === 1) {
          const airDist = distMap[idx];

          if (airDist <= 1.5) {
            data32[dirtyIdx] = grassHighlight;
          } else if (airDist <= 3.5) {
            data32[dirtyIdx] = grassBody;
          } else if (airDist <= 5.5) {
            data32[dirtyIdx] = grassShadow;
          } else if (airDist <= 7.0) {
            data32[dirtyIdx] = grassDeep;
          } else {
            const bx = (x / 4) | 0;
            const by = (y / 4) | 0;
            const blockHash = getPixelHash(bx, by);

            const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
            if (isSeam && (blockHash % 100 < 35)) {
              data32[dirtyIdx] = soilSeam;
            } else if (airDist <= 12) {
              data32[dirtyIdx] = soilLight;
            } else if (airDist <= 24) {
              data32[dirtyIdx] = soilMedium;
            } else {
              data32[dirtyIdx] = soilDark;
            }
          }
        } else {
          data32[dirtyIdx] = 0x00000000;
        }
      }
    }
    offCtx.putImageData(imgData, minX, minY);

    if (isFullScan) {
      // Pre-render Subterranean Soil Occlusion Mask to offscreen canvas
      if (!occlusionCanvasRef.current) {
        occlusionCanvasRef.current = document.createElement('canvas');
      }
      const occCanvas = occlusionCanvasRef.current;
      if (occCanvas.width !== width || occCanvas.height !== height) {
        occCanvas.width = width;
        occCanvas.height = height;
      }
      const occCtx = occCanvas.getContext('2d');
      if (occCtx) {
        occCtx.clearRect(0, 0, width, height);
        const occImgData = occCtx.createImageData(width, height);
        const occData32 = new Uint32Array(occImgData.data.buffer);

        for (let y = 0; y < height; y++) {
          const rowOffset = y * width;
          for (let x = 0; x < width; x++) {
            const idx = rowOffset + x;
            if (grid[idx] === 1) {
              const d = distMap[idx];
              if (d > 7) {
                const alpha = Math.min(145, Math.floor((d - 7) * 9));
                occData32[idx] = (alpha << 24) | 0x0a0503;
              }
            }
          }
        }
        occCtx.putImageData(occImgData, 0, 0);
      }

      // Pre-render Exact Ground Collision Hitbox Mask (Neon Emerald Border & Collision Hull)
      if (!terrainHitboxCanvasRef.current) {
        terrainHitboxCanvasRef.current = document.createElement('canvas');
      }
      const tbCanvas = terrainHitboxCanvasRef.current;
      if (tbCanvas.width !== width || tbCanvas.height !== height) {
        tbCanvas.width = width;
        tbCanvas.height = height;
      }
      const tbCtx = tbCanvas.getContext('2d');
      if (tbCtx) {
        tbCtx.clearRect(0, 0, width, height);
        const tbImgData = tbCtx.createImageData(width, height);
        const tbData32 = new Uint32Array(tbImgData.data.buffer);

        for (let y = 0; y < height; y++) {
          const rowOffset = y * width;
          for (let x = 0; x < width; x++) {
            const idx = rowOffset + x;
            if (grid[idx] > 0) {
              const d = distMap[idx];
              if (d <= 2.5) {
                // Surface Collision Perimeter Border (Bright Solid Neon Emerald #10b981)
                tbData32[idx] = 0xff81b910;
              } else {
                // Subterranean Solid Collision Mass (Translucent Green Tint)
                tbData32[idx] = 0x3522c55e;
              }
            }
          }
        }
        tbCtx.putImageData(tbImgData, 0, 0);
      }
    }
  }, [terrain]);

  // Carve crater on offscreen terrain canvas & occlusion shadow canvas when explosion happens
  const carveOffscreenCrater = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(0, radius || 0);
    if (safeRadius <= 0) return;

    // 1. Synchronize grid array & mark overlapping solidProps destroyed
    terrain.carveExplosion(x, y, safeRadius);

    // 2. Cut crater directly out of offscreen terrain canvas (erases terrain pixels and prop drawings)
    if (offscreenCanvasRef.current) {
      const offCtx = offscreenCanvasRef.current.getContext('2d');
      if (offCtx) {
        offCtx.save();
        offCtx.globalCompositeOperation = 'destination-out';
        offCtx.beginPath();
        offCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
        offCtx.fill();
        offCtx.restore();
      }
    }

    // 3. Cut crater out of subterranean shadow occlusion canvas
    if (occlusionCanvasRef.current) {
      const occCtx = occlusionCanvasRef.current.getContext('2d');
      if (occCtx) {
        occCtx.save();
        occCtx.globalCompositeOperation = 'destination-out';
        occCtx.beginPath();
        occCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
        occCtx.fill();
        occCtx.restore();
      }
    }

    // 4. Cut crater out of terrain collision hitbox canvas
    if (terrainHitboxCanvasRef.current) {
      const tbCtx = terrainHitboxCanvasRef.current.getContext('2d');
      if (tbCtx) {
        tbCtx.save();
        tbCtx.globalCompositeOperation = 'destination-out';
        tbCtx.beginPath();
        tbCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
        tbCtx.fill();
        tbCtx.restore();
      }
    }
  }, [terrain]);

  // Trigger high-framerate client-side visual explosion animation & fiery sparks (60+ FPS locally on both Host & Guest)
  const triggerClientExplosion = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(10, radius || 30);
    clientExplosionsRef.current.push({
      id: `cex_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: safeRadius,
      startTime: performance.now(),
      duration: 450,
    });

    // Spawn 24 fiery explosion spark & smoke debris particles
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.7 + 0.3) * (safeRadius / 7);
      clientParticlesRef.current.push({
        x: x + Math.cos(angle) * (safeRadius * 0.15),
        y: y + Math.sin(angle) * (safeRadius * 0.15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: Math.random() > 0.6 ? '#fef08a' : Math.random() > 0.3 ? '#f97316' : '#ef4444',
        size: Math.random() * 4 + 2,
        life: 1.0,
      });
    }
  }, []);

  // Trigger arcade-style floating damage/heal numbers (+50 HP / -45 HP) locally at 60 FPS
  const triggerClientFloatingDamage = useCallback((x: number, y: number, damage: number) => {
    clientFloatingDamagesRef.current.push({
      id: `cfd_${Date.now()}_${Math.random()}`,
      x,
      y: y - 18,
      damage,
      startTime: performance.now(),
      duration: 1000,
    });
  }, []);

  // Global mouseup to release camera dragging even if cursor leaves canvas/window
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Clamp camera pan offset to ensure the map always remains anchored on screen (never an empty black void!)
  const clampPan = useCallback(
    (pan: Vector2D, zoom: number): Vector2D => {
      const container = containerRef.current;
      if (!container) return pan;
      const cRect = container.getBoundingClientRect();
      const W = terrain.data.width;
      const H = terrain.data.height;
      const fitScale = Math.min(cRect.width / W, cRect.height / H);
      const scaledW = W * fitScale * zoom;
      const scaledH = H * fitScale * zoom;

      // Ensure the terrain always stays anchored on screen and cannot drift into black void
      const padX = Math.min(cRect.width * 0.2, 180);
      const padY = Math.min(cRect.height * 0.2, 140);
      const maxPanX = Math.max(scaledW * 0.15, (scaledW - cRect.width) / 2 + padX);
      const maxPanY = Math.max(scaledH * 0.15, (scaledH - cRect.height) / 2 + padY);

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
      };
    },
    [terrain]
  );

  // Center camera on a specific world point (e.g. active slug or center of terrain)
  const centerCamera = useCallback(
    (targetX?: number, targetY?: number, customZoom?: number) => {
      const container = containerRef.current;
      const zoom = customZoom ?? zoomRef.current;
      const W = terrain.data.width;
      const H = terrain.data.height;

      if (!container) {
        zoomRef.current = zoom;
        panRef.current = { x: 0, y: 0 };
        setZoomLevel(zoom);
        setPanOffset({ x: 0, y: 0 });
        return;
      }

      const cRect = container.getBoundingClientRect();
      const fitScale = Math.min(cRect.width / W, cRect.height / H);

      const tx = targetX ?? W / 2;
      const ty = targetY ?? H / 2;

      const newPanX = -(tx - W / 2) * fitScale * zoom;
      const newPanY = -(ty - H / 2) * fitScale * zoom;
      const clamped = clampPan({ x: newPanX, y: newPanY }, zoom);

      zoomRef.current = zoom;
      panRef.current = clamped;
      setZoomLevel(zoom);
      setPanOffset(clamped);
    },
    [terrain, clampPan]
  );

  // Exact 1:1 Screen-to-World Mouse Coordinate conversion (0 drift at ANY zoom or pan position!)
  const getCanvasMousePos = useCallback(
    (e: React.MouseEvent | MouseEvent): Vector2D => {
      const container = containerRef.current;
      if (!container) return { x: 700, y: 350 };
      const cRect = container.getBoundingClientRect();

      const W = terrain.data.width;
      const H = terrain.data.height;
      const fitScale = Math.min(cRect.width / W, cRect.height / H);
      const zoom = zoomRef.current;
      const pan = panRef.current;

      const screenX = e.clientX - cRect.left;
      const screenY = e.clientY - cRect.top;

      const centerX = cRect.width / 2;
      const centerY = cRect.height / 2;

      const dx = screenX - (centerX + pan.x);
      const dy = screenY - (centerY + pan.y);

      const totalScale = fitScale * zoom;

      const worldX = W / 2 + dx / totalScale;
      const worldY = H / 2 + dy / totalScale;

      return {
        x: worldX,
        y: worldY,
      };
    },
    [terrain]
  );

  // Cursor-Centered Mouse Wheel Zoom (Native non-passive listener to cleanly preventDefault without browser console warnings)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const cRect = container.getBoundingClientRect();

      const oldZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.5, Math.min(2.5, Math.round((oldZoom + delta) * 100) / 100));
      if (newZoom === oldZoom) return;

      const screenX = e.clientX - cRect.left;
      const screenY = e.clientY - cRect.top;
      const centerX = cRect.width / 2;
      const centerY = cRect.height / 2;

      const oldPan = panRef.current;
      const ratio = newZoom / oldZoom;

      const newPanX = (screenX - centerX) - (screenX - centerX - oldPan.x) * ratio;
      const newPanY = (screenY - centerY) - (screenY - centerY - oldPan.y) * ratio;
      const clamped = clampPan({ x: newPanX, y: newPanY }, newZoom);

      zoomRef.current = newZoom;
      panRef.current = clamped;
      setZoomLevel(newZoom);
      setPanOffset(clamped);
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [clampPan]);

  // Keyboard shortcut: Press C to reset zoom to 100% and center camera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        zoomRef.current = 1.0;
        panRef.current = { x: 0, y: 0 };
        setZoomLevel(1.0);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lastAimTimeRef = useRef<number>(0);

  // Throttled Real-time Mouse Aiming & Camera Drag Handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        const dx = e.clientX - dragStartMouseRef.current.x;
        const dy = e.clientY - dragStartMouseRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          hasMovedCameraRef.current = true;
        }
        const rawPan = {
          x: dragStartPanRef.current.x + dx,
          y: dragStartPanRef.current.y + dy,
        };
        const clampedPan = clampPan(rawPan, zoomRef.current);
        panRef.current = clampedPan;
        setPanOffset(clampedPan);
        return;
      }

      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const now = Date.now();
      if (now - lastAimTimeRef.current < 25) return;

      const dir = pos.x >= activeSlug.x ? 1 : -1;
      const originX = activeSlug.x + dir * 10;
      const originY = activeSlug.y - 10;

      const dx = pos.x - originX;
      const dy = pos.y - originY;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dir === 1 ? 'right' : 'left';

      if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        lastAimTimeRef.current = now;
        onUpdateAim?.(angle, activeSlug.aimPower, facing);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onUpdateAim]
  );

  const lockedTargetRef = useRef<Vector2D | null>(null);

  // Right-Click Context Menu / Target Locking Handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (hasMovedCameraRef.current) {
        // Camera drag finished, don't trigger target locking
        return;
      }

      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const pos = getCanvasMousePos(e);
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.requiresTarget) {
        lockedTargetRef.current = pos;
        sfx.play('tick');
      }
    },
    [isMyTurn, gameState, getCanvasMousePos]
  );

  // Mouse Down: Left-Click for game actions / Middle or Right Click for camera dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.button === 1 || e.button === 2) {
        isDraggingCameraRef.current = true;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartPanRef.current = { ...panRef.current };
        hasMovedCameraRef.current = false;
        return;
      }

      if (!isMyTurn) return;
      if (e.button !== 0) return; // Left Click Only for game actions!

      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

      if (gameState.phase === 'PLACEMENT') {
        onPlaceSlug?.({ x: mouseX, y: mouseY });
        return;
      }

      if (gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const dx = mouseX - activeSlug.x;
      const dy = mouseY - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
      onUpdateAim?.(angle, activeSlug.aimPower, facing);

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (!isInstantTarget) {
        const targetPt = lockedTargetRef.current || { x: mouseX, y: mouseY };
        onStartCharge?.(targetPt);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (e.button === 1 || e.button === 2) return;
      }

      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      if (e.button !== 0) return; // Left Click Only!

      const { x: clickX, y: clickY } = getCanvasMousePos(e);

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const targetPt = lockedTargetRef.current || { x: clickX, y: clickY };
      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (isInstantTarget) {
        onFire({ ...targetPt, aimAngle: activeSlug.aimAngle, aimPower: activeSlug.aimPower, facing: activeSlug.facing });
        lockedTargetRef.current = null;
      } else {
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
        angle = Math.max(-85, Math.min(85, angle));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, activeSlug.aimPower, facing);
        onReleaseCharge?.({ ...targetPt, aimAngle: angle, aimPower: activeSlug.aimPower, facing });
        lockedTargetRef.current = null;
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim]
  );

  // Render Loop
  useEffect(() => {
    const matchKey = `${terrain.data.seed}_${terrain.data.theme}`;
    if (lastSeedRef.current !== matchKey || lastTerrainRevisionRef.current > terrain.revision) {
      lastSeedRef.current = matchKey;
      lastTerrainRevisionRef.current = terrain.revision;
      carvedExplosionsRef.current.clear();
      knownGirderIdsCanvasRef.current.clear();
      knownCraterIdsCanvasRef.current.clear();
      slugDeathTimestampsRef.current.clear();
      lockedTargetRef.current = null;
      redrawOffscreenTerrain();
    }

    // Synchronize craters from persistent list (handles background tab recovery)
    if (gameState.craters && gameState.craters.length > 0) {
      for (const c of gameState.craters) {
        if (!knownCraterIdsCanvasRef.current.has(c.id)) {
          knownCraterIdsCanvasRef.current.add(c.id);
          carveOffscreenCrater(c.x, c.y, c.radius);
        }
      }
    }

    for (const ex of gameState.explosions) {
      if (!carvedExplosionsRef.current.has(ex.id)) {
        carvedExplosionsRef.current.add(ex.id);
        carveOffscreenCrater(ex.x, ex.y, ex.radius);
        triggerClientExplosion(ex.x, ex.y, ex.radius);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const renderStart = performance.now();
      const curState = gameStateRef.current;
      const { width, height, waterLevel, decorItems } = terrain.data;

      const container = containerRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cRect = container ? container.getBoundingClientRect() : { width, height };

      const targetW = Math.max(100, Math.round(cRect.width * dpr));
      const targetH = Math.max(100, Math.round(cRect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark atmospheric background fill behind the world
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(dpr, dpr);

      const W = width;
      const H = height;
      const fitScale = Math.min(cRect.width / W, cRect.height / H);
      const zoom = zoomRef.current;
      const pan = panRef.current;
      const totalScale = fitScale * zoom;

      // Set up Native World Camera View Matrix
      ctx.translate(cRect.width / 2 + pan.x, cRect.height / 2 + pan.y);
      ctx.scale(totalScale, totalScale);
      ctx.translate(-W / 2, -H / 2);

      // Enable crisp High-Quality image smoothing for terrain rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Seed/Theme/Revision reconciliation (Only full-redraws if a new terrain seed/theme or reset terrain is loaded!)
      const curMatchKey = `${terrain.data.seed}_${terrain.data.theme}`;
      if (lastSeedRef.current !== curMatchKey || lastTerrainRevisionRef.current > terrain.revision) {
        lastSeedRef.current = curMatchKey;
        lastTerrainRevisionRef.current = terrain.revision;
        carvedExplosionsRef.current.clear();
        knownGirderIdsCanvasRef.current.clear();
        knownCraterIdsCanvasRef.current.clear();
        slugDeathTimestampsRef.current.clear();
        redrawOffscreenTerrain();
      }

      // Reconcile persistent craters (guarantees 100% accurate terrain even if tab was in background / minimized!)
      if (curState && curState.craters && curState.craters.length > 0) {
        for (const c of curState.craters) {
          if (!knownCraterIdsCanvasRef.current.has(c.id)) {
            knownCraterIdsCanvasRef.current.add(c.id);
            carveOffscreenCrater(c.x, c.y, c.radius);
          }
        }
      }

      // Instant sub-millisecond GPU crater carving on incoming explosions
      if (curState && curState.explosions && curState.explosions.length > 0) {
        for (const ex of curState.explosions) {
          if (!carvedExplosionsRef.current.has(ex.id)) {
            carvedExplosionsRef.current.add(ex.id);
            carveOffscreenCrater(ex.x, ex.y, ex.radius);
            triggerClientExplosion(ex.x, ex.y, ex.radius);
          }
        }
      }

      // Detect slug HP changes to trigger arcade floating damage/heal popups locally
      if (curState && curState.slugs && curState.slugs.length > 0) {
        for (const slug of curState.slugs) {
          const prevHp = prevSlugHpsRef.current.get(slug.id);
          if (prevHp !== undefined && prevHp !== slug.hp && slug.isAlive) {
            triggerClientFloatingDamage(slug.x, slug.y, prevHp - slug.hp);
            if (prevHp > slug.hp) {
              sfx.play('ouch');
            }
          }
          prevSlugHpsRef.current.set(slug.id, slug.hp);
        }
      }

      // Live-paint newly placed girders onto offscreen canvas on host & guest instantly
      if (curState && curState.girders && curState.girders.length > 0) {
        let hasNewGirder = false;
        for (const g of curState.girders) {
          if (!knownGirderIdsCanvasRef.current.has(g.id)) {
            knownGirderIdsCanvasRef.current.add(g.id);
            hasNewGirder = true;
          }
        }
        if (hasNewGirder) {
          redrawOffscreenTerrain();
        }
      }

      const theme = curState?.config?.mapTheme || 'ISLAND';
      const isDay = (curState?.config?.dayNightCycle || 'DAY') === 'DAY';
      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      // =========================================================================
      // SEAMLESS INFINITE WORLD ATMOSPHERE (Sky, Mountains, Sun, Clouds & Ocean)
      // =========================================================================
      const worldLeft = -3500;
      const worldRight = width + 3500;
      const worldTop = -2500;
      const worldBottom = height + 3500;
      
      // Smooth 60 FPS local water rise interpolation
      const targetWaterLevel = curState?.waterLevel ?? waterLevel;
      if (Math.abs(currentRenderWaterYRef.current - targetWaterLevel) > 0.05) {
        currentRenderWaterYRef.current += (targetWaterLevel - currentRenderWaterYRef.current) * 0.08;
      } else {
        currentRenderWaterYRef.current = targetWaterLevel;
      }
      const waterY = currentRenderWaterYRef.current;

      // 1. Seamless Infinite Atmospheric Sky Horizon Gradient (Harmonious balanced middle-ground)
      const skyGradTop = Math.min(-650, -height * 0.9);
      const skyGrad = ctx.createLinearGradient(0, skyGradTop, 0, waterY);
      if (isDay) {
        if (theme === 'CAVERN') {
          // Warm Atmospheric Subterranean Amber Glow
          skyGrad.addColorStop(0, '#451a03');
          skyGrad.addColorStop(0.35, '#78350f');
          skyGrad.addColorStop(0.65, '#b45309');
          skyGrad.addColorStop(0.88, '#d97706');
          skyGrad.addColorStop(1, '#fef08a');
        } else if (theme === 'FORTRESS') {
          skyGrad.addColorStop(0, '#0f172a');
          skyGrad.addColorStop(0.35, '#0369a1');
          skyGrad.addColorStop(0.70, '#0284c7');
          skyGrad.addColorStop(0.90, '#38bdf8');
          skyGrad.addColorStop(1, '#e0f2fe');
        } else if (theme === 'FLOATING_CHAOS') {
          // Archipel Flottant: Radiant Vibrant Tropical Blue Sky
          skyGrad.addColorStop(0, '#0369a1');
          skyGrad.addColorStop(0.35, '#0284c7');
          skyGrad.addColorStop(0.72, '#38bdf8');
          skyGrad.addColorStop(1, '#e0f2fe');
        } else {
          // Standard / Island: Lush Balanced Tropical Cyan & Azure Sky
          skyGrad.addColorStop(0, '#0369a1');
          skyGrad.addColorStop(0.38, '#0284c7');
          skyGrad.addColorStop(0.74, '#38bdf8');
          skyGrad.addColorStop(1, '#e0f2fe');
        }
      } else {
        if (theme === 'CAVERN') {
          skyGrad.addColorStop(0, '#030102');
          skyGrad.addColorStop(0.35, '#170605');
          skyGrad.addColorStop(0.7, '#2b0c07');
          skyGrad.addColorStop(1, '#451a03');
        } else if (theme === 'FORTRESS') {
          skyGrad.addColorStop(0, '#020408');
          skyGrad.addColorStop(0.35, '#070b14');
          skyGrad.addColorStop(0.7, '#0f172a');
          skyGrad.addColorStop(1, '#1e293b');
        } else if (theme === 'FLOATING_CHAOS') {
          // Archipel Night: Deep Midnight Blue
          skyGrad.addColorStop(0, '#02040a');
          skyGrad.addColorStop(0.35, '#070d1a');
          skyGrad.addColorStop(0.7, '#0f172a');
          skyGrad.addColorStop(1, '#1e293b');
        } else {
          skyGrad.addColorStop(0, '#02040a');
          skyGrad.addColorStop(0.35, '#070d1a');
          skyGrad.addColorStop(0.7, '#0f172a');
          skyGrad.addColorStop(1, '#1e1b4b');
        }
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(worldLeft, worldTop, worldRight - worldLeft, waterY - worldTop);

      // 2. Day & Night Atmospheric Particles & Clouds (Spanning across full world)
      if (isDay) {
        if (theme === 'CAVERN') {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
          for (let b = 0; b < 9; b++) {
            const bx = worldLeft + ((b * 750 + 400) % (worldRight - worldLeft));
            ctx.beginPath();
            ctx.moveTo(bx - 20, worldTop);
            ctx.lineTo(bx + 20, worldTop);
            ctx.lineTo(bx + 160, waterY);
            ctx.lineTo(bx + 40, waterY);
            ctx.closePath();
            ctx.fill();
          }
        } else {
          // Drifting Crisp Cumulus Clouds across the high open sky (floating safely above hills & mountains)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          for (let c = 0; c < 12; c++) {
            const cx = (((Date.now() * 0.014 + c * 620) % (worldRight - worldLeft + 400)) + worldLeft) - 200;
            // Keep clouds in upper sky (between -300 and height * 0.22)
            const cy = -250 + (c * 42) % (Math.max(160, height * 0.22) + 250);
            const cSize = 28 + (c * 7) % 18;
            ctx.beginPath();
            ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
            ctx.arc(cx - cSize * 0.5, cy - cSize * 0.2, cSize * 0.65, 0, Math.PI * 2);
            ctx.arc(cx + cSize * 0.6, cy - cSize * 0.15, cSize * 0.7, 0, Math.PI * 2);
            ctx.arc(cx + cSize * 1.1, cy, cSize * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Deep Cosmic Twinkling Stars across infinite night sky
        for (let i = 0; i < 180; i++) {
          const sx = worldLeft + ((i * 317 + i * 83) % (worldRight - worldLeft));
          const sy = worldTop + ((i * 179 + i * 47) % (waterY - worldTop));
          const starAlpha = 0.15 + 0.65 * Math.abs(Math.sin(animTime * 0.7 + i * 1.6));
          const sz = i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.0;
          ctx.fillStyle = i % 5 === 0 ? `rgba(165, 243, 252, ${starAlpha})` : `rgba(255, 255, 255, ${starAlpha})`;
          ctx.fillRect(sx, sy, sz, sz);
        }
      }

      // 3. Iconic Celestial Focus (Sun / Moon)
      if (isDay) {
        if (theme === 'ISLAND' || theme === 'FORTRESS' || theme === 'FLOATING_CHAOS') {
          const sunX = width * 0.82;
          const sunY = height * 0.16;
          const sunR = 28;

          const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 4.0);
          sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
          sunGlow.addColorStop(0.3, 'rgba(250, 204, 21, 0.5)');
          sunGlow.addColorStop(0.7, 'rgba(253, 224, 71, 0.15)');
          sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = sunGlow;
          ctx.beginPath();
          ctx.arc(sunX, sunY, sunR * 4.0, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(sunX, sunY);
          ctx.rotate(animTime * 0.08);
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.3)';
          ctx.lineWidth = 2.5;
          for (let b = 0; b < 8; b++) {
            const bAngle = (b * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.moveTo(Math.cos(bAngle) * (sunR + 4), Math.sin(bAngle) * (sunR + 4));
            ctx.lineTo(Math.cos(bAngle) * (sunR + 26), Math.sin(bAngle) * (sunR + 26));
            ctx.stroke();
          }
          ctx.restore();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(sunX, sunY, sunR * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        if (theme === 'ISLAND') {
          const moonX = width * 0.82;
          const moonY = height * 0.16;
          const moonR = 26;

          const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 3.2);
          glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
          glow.addColorStop(0.5, 'rgba(129, 140, 248, 0.15)');
          glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(moonX, moonY, moonR * 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.translate(moonX, moonY);
          ctx.rotate(-0.35);
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, moonR * 2.2, moonR * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0a1329';
          ctx.beginPath();
          ctx.arc(moonX - moonR * 0.45, moonY - moonR * 0.2, moonR * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else if (theme === 'FLOATING_CHAOS') {
          const riftX = width * 0.78;
          const riftY = height * 0.18;
          const riftR = 30;

          const riftGlow = ctx.createRadialGradient(riftX, riftY, 5, riftX, riftY, riftR * 2.8);
          riftGlow.addColorStop(0, 'rgba(192, 132, 252, 0.55)');
          riftGlow.addColorStop(0.5, 'rgba(147, 51, 234, 0.18)');
          riftGlow.addColorStop(1, 'rgba(8, 3, 19, 0)');
          ctx.fillStyle = riftGlow;
          ctx.beginPath();
          ctx.arc(riftX, riftY, riftR * 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#c084fc';
          for (let s = 0; s < 6; s++) {
            const sAngle = (s * Math.PI * 2) / 6 + animTime * 0.15;
            const sDist = riftR * 1.1 + Math.sin(animTime * 0.5 + s) * 4;
            const sx = riftX + Math.cos(sAngle) * sDist;
            const sy = riftY + Math.sin(sAngle) * sDist;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (theme === 'FORTRESS') {
          const beamX = width * 0.22;
          const beamY = height * 0.52;
          const sweepAngle = -0.9 + Math.sin(slowTime * 1.2) * 0.45;
          const beamLen = height * 0.85;

          ctx.save();
          ctx.translate(beamX, beamY);
          ctx.rotate(sweepAngle);

          const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamLen);
          beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
          beamGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
          beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(-45, -beamLen);
          ctx.lineTo(45, -beamLen);
          ctx.lineTo(6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Layered Parallax Vector Mountains (Spanning infinite horizon seamlessly)
      // Layer 1: Distant Misty Mountain Ridges
      const mtGrad = ctx.createLinearGradient(0, height * 0.2, 0, waterY + 100);
      if (isDay) {
        if (theme === 'CAVERN') {
          mtGrad.addColorStop(0, 'rgba(180, 83, 9, 0.75)');
          mtGrad.addColorStop(1, 'rgba(120, 53, 15, 0.95)');
        } else if (theme === 'FORTRESS') {
          mtGrad.addColorStop(0, 'rgba(71, 85, 105, 0.75)');
          mtGrad.addColorStop(1, 'rgba(20, 83, 45, 0.90)');
        } else if (theme === 'FLOATING_CHAOS') {
          mtGrad.addColorStop(0, 'rgba(16, 185, 129, 0.75)');
          mtGrad.addColorStop(1, 'rgba(5, 150, 105, 0.90)');
        } else {
          mtGrad.addColorStop(0, 'rgba(34, 197, 94, 0.75)');
          mtGrad.addColorStop(1, 'rgba(21, 128, 61, 0.90)');
        }
      } else {
        if (theme === 'CAVERN') {
          mtGrad.addColorStop(0, 'rgba(23, 6, 5, 0.85)');
          mtGrad.addColorStop(1, 'rgba(10, 3, 2, 0.95)');
        } else if (theme === 'FORTRESS') {
          mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
          mtGrad.addColorStop(1, 'rgba(9, 13, 22, 0.95)');
        } else if (theme === 'FLOATING_CHAOS') {
          mtGrad.addColorStop(0, 'rgba(30, 11, 60, 0.85)');
          mtGrad.addColorStop(1, 'rgba(8, 3, 19, 0.95)');
        } else {
          mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
          mtGrad.addColorStop(1, 'rgba(7, 10, 22, 0.95)');
        }
      }
      ctx.fillStyle = mtGrad;
      ctx.beginPath();
      ctx.moveTo(worldLeft, waterY + 100);
      for (let x = worldLeft; x <= worldRight + 40; x += 35) {
        const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(worldRight, waterY + 100);
      ctx.closePath();
      ctx.fill();

      // Layer 2: Midground Ridge with Lush Hills
      if (isDay) {
        ctx.fillStyle = theme === 'CAVERN' ? '#78350f' : theme === 'FORTRESS' ? '#14532d' : theme === 'FLOATING_CHAOS' ? '#047857' : '#15803d';
      } else {
        ctx.fillStyle = theme === 'CAVERN' ? '#0d0403' : theme === 'FLOATING_CHAOS' ? '#0b0417' : '#070b16';
      }
      ctx.beginPath();
      ctx.moveTo(worldLeft, waterY + 100);
      for (let x = worldLeft; x <= worldRight + 40; x += 25) {
        const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(worldRight, waterY + 100);
      ctx.closePath();
      ctx.fill();

      // Dotted Lush Grass Blade Dashes on Green Hills
      if (isDay && (theme === 'ISLAND' || theme === 'FLOATING_CHAOS' || theme === 'FORTRESS' || !theme)) {
        ctx.strokeStyle = theme === 'FLOATING_CHAOS' ? '#6ee7b7' : '#4ade80';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let x = worldLeft; x <= worldRight; x += 14) {
          const by = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
          ctx.moveTo(x, by);
          ctx.lineTo(x + 2, by - 5);
        }
        ctx.stroke();
      }

      // Blinking Radio Beacon Lights on Horizon Ridge (Night Mode or Fortress)
      if (!isDay || theme === 'FORTRESS') {
        const beaconX1 = width * 0.28;
        const beaconY1 = height * 0.62 + Math.sin(beaconX1 * 0.005 + 2.4) * 45 - 8;
        const bOn1 = Math.sin(animTime * 4) > 0;
        ctx.fillStyle = bOn1 ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(beaconX1 - 1, beaconY1, 2, 8);
        ctx.beginPath();
        ctx.arc(beaconX1, beaconY1, 2, 0, Math.PI * 2);
        ctx.fill();

        const beaconX2 = width * 0.74;
        const beaconY2 = height * 0.62 + Math.sin(beaconX2 * 0.005 + 2.4) * 45 - 10;
        const bOn2 = Math.sin(animTime * 4 + 2) > 0;
        ctx.fillStyle = bOn2 ? '#06b6d4' : '#0e7490';
        ctx.fillRect(beaconX2 - 1, beaconY2, 2, 10);
        ctx.beginPath();
        ctx.arc(beaconX2, beaconY2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Deep Abyss Water Backdrop below Water Level (High-Contrast Rich Ocean Depth)
      const waterGradBottom = waterY + Math.max(500, height * 0.65);
      const waterBackdrop = ctx.createLinearGradient(0, waterY - 8, 0, waterGradBottom);
      if (isDay) {
        if (theme === 'CAVERN') {
          waterBackdrop.addColorStop(0, 'rgba(217, 119, 6, 0.95)');
          waterBackdrop.addColorStop(0.2, 'rgba(180, 83, 9, 0.98)');
          waterBackdrop.addColorStop(0.5, '#78350f');
          waterBackdrop.addColorStop(0.8, '#451a03');
          waterBackdrop.addColorStop(1, '#170602');
        } else {
          waterBackdrop.addColorStop(0, 'rgba(2, 132, 199, 0.95)');
          waterBackdrop.addColorStop(0.2, 'rgba(3, 105, 161, 0.98)');
          waterBackdrop.addColorStop(0.5, '#082f49');
          waterBackdrop.addColorStop(0.8, '#031826');
          waterBackdrop.addColorStop(1, '#020617');
        }
      } else {
        if (theme === 'CAVERN') {
          waterBackdrop.addColorStop(0, 'rgba(220, 38, 38, 0.90)');
          waterBackdrop.addColorStop(0.35, 'rgba(153, 27, 27, 0.98)');
          waterBackdrop.addColorStop(0.7, '#450a0a');
          waterBackdrop.addColorStop(1, '#030102');
        } else {
          waterBackdrop.addColorStop(0, 'rgba(2, 132, 199, 0.90)');
          waterBackdrop.addColorStop(0.3, 'rgba(15, 23, 42, 0.98)');
          waterBackdrop.addColorStop(0.7, '#070b14');
          waterBackdrop.addColorStop(1, '#02040a');
        }
      }
      ctx.fillStyle = waterBackdrop;
      ctx.fillRect(worldLeft, waterY - 5, worldRight - worldLeft, worldBottom - (waterY - 5));

      // Underwater Ambient Caustic Light Rays (Crisp Shimmering Rays)
      ctx.fillStyle = isDay ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)';
      for (let r = 0; r < 8; r++) {
        const rx = worldLeft + ((r * 620 + 200) % (worldRight - worldLeft)) + Math.sin(animTime * 0.4 + r) * 18;
        ctx.beginPath();
        ctx.moveTo(rx, waterY);
        ctx.lineTo(rx - 30, height + 400);
        ctx.lineTo(rx + 40, height + 400);
        ctx.lineTo(rx + 25, waterY);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Smooth Multi-Layer Continuous Surface Waves (Spanning infinite sea horizon with high-contrast crest)
      // Layer A: Main Rolling Blue Ocean Swell
      ctx.fillStyle = isDay ? 'rgba(2, 132, 199, 0.80)' : 'rgba(3, 105, 161, 0.70)';
      ctx.beginPath();
      ctx.moveTo(worldLeft, worldBottom);
      for (let x = worldLeft; x <= worldRight; x += 12) {
        const wy = waterY + Math.sin(x * 0.015 + slowTime * 2.2) * 3.5 + Math.sin(x * 0.035 - slowTime * 1.5) * 1.5;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(worldRight, worldBottom);
      ctx.closePath();
      ctx.fill();

      // Layer B: Luminous Turquoise Translucent Secondary Wave Crest
      ctx.fillStyle = isDay ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.30)';
      ctx.beginPath();
      ctx.moveTo(worldLeft, worldBottom);
      for (let x = worldLeft; x <= worldRight; x += 15) {
        const wy = waterY + 2 + Math.sin(x * 0.018 + slowTime * 2.8 + 1.2) * 2.8;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(worldRight, worldBottom);
      ctx.closePath();
      ctx.fill();

      // Layer C: Crisp Gentle White Foam Crest Line along Wave Peak
      ctx.strokeStyle = isDay ? 'rgba(255, 255, 255, 0.95)' : 'rgba(186, 230, 253, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      let firstWavePt = true;
      for (let x = worldLeft; x <= worldRight; x += 12) {
        const wy = waterY + Math.sin(x * 0.015 + slowTime * 2.2) * 3.5 + Math.sin(x * 0.035 - slowTime * 1.5) * 1.5;
        if (firstWavePt) {
          ctx.moveTo(x, wy);
          firstWavePt = false;
        } else {
          ctx.lineTo(x, wy);
        }
      }
      ctx.stroke();

      // Draw Pre-rendered Offscreen Terrain
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      // Draw Placed Steel Girders (in full razor-sharp vector HD with dynamic crater carving!)
      const { grid, solidProps } = terrain.data;
      if (curState.girders && curState.girders.length > 0) {
        for (const g of curState.girders) {
          if (g.destroyed) continue;
          renderHDDestructibleGirder(ctx, g, curState.craters, curState.explosions, grid, width);
        }
      }

      // Draw HD Solid Destructible Decor Props (in full razor-sharp vector HD with dynamic crater carving!)
      if (solidProps) {
        for (const sprop of solidProps) {
          if (sprop.destroyed) continue;
          renderHDDestructibleProp(ctx, sprop, curState.craters, curState.explosions, animTime, grid, width);
        }
      }

      // Subterranean Real-Time Dynamic Light & Occlusion Engine
      if (occlusionCanvasRef.current) {
        ctx.drawImage(occlusionCanvasRef.current, 0, 0);
      }

      // Draw Visual Decor Items (Hanging Leaf Roots & Floating Butterflies)
      if (decorItems) {
        for (const item of decorItems) {
          if (item.destroyed) continue;

          if (item.type === 'hanging_leaf') {
            // Verify ceiling anchor is still solid (disappears if ceiling is destroyed!)
            const topSolid =
              terrain.isSolid(item.x, item.y - 1) ||
              terrain.isSolid(item.x, item.y - 2) ||
              terrain.isSolid(item.x - 2, item.y - 1) ||
              terrain.isSolid(item.x + 2, item.y - 1);

            if (!topSolid) {
              item.destroyed = true;
              continue;
            }
          }

          ctx.save();
          ctx.translate(item.x, item.y);

          if (item.type === 'hanging_leaf') {
            // HD Organic Swaying Jungle Vines & Creepers!
            const scale = item.scale || 1.0;
            ctx.scale(scale, scale);

            const sway = Math.sin(animTime * 1.8 + item.x) * 0.12;
            ctx.rotate(sway);

            // 1. Root Anchor Collar at Ceiling
            ctx.fillStyle = '#63310d';
            ctx.fillRect(-3, -2, 6, 3);

            // 2. Main Thin Vine Stem
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-4, 10, 2, 20);
            ctx.quadraticCurveTo(6, 28, 0, 36);
            ctx.stroke();

            // 3. Alternating Teardrop Tropical Leaves
            const leaves = [
              { x: -3, y: 7, rx: -0.4, size: 4 },
              { x: 3, y: 13, rx: 0.5, size: 4.5 },
              { x: -2, y: 19, rx: -0.6, size: 4 },
              { x: 4, y: 26, rx: 0.4, size: 3.5 },
              { x: 0, y: 36, rx: 0.1, size: 3 }, // Tip leaf
            ];

            for (const leaf of leaves) {
              ctx.save();
              ctx.translate(leaf.x, leaf.y);
              ctx.rotate(leaf.rx);

              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.ellipse(0, 0, leaf.size, leaf.size * 0.4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Leaf Center Vein Highlight
              ctx.fillStyle = '#84cc16';
              ctx.beginPath();
              ctx.ellipse(0, 0, leaf.size * 0.6, leaf.size * 0.2, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }

            // 4. Little Red Berry on Tip
            if ((item.variant || 0) % 2 === 1) {
              ctx.fillStyle = '#f43f5e';
              ctx.beginPath();
              ctx.arc(2, 38, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (item.type === 'butterfly') {
            const flap = Math.abs(Math.sin(animTime * 4 + item.x));
            ctx.scale(flap, 1);
            ctx.fillStyle = item.variant === 1 ? '#f97316' : '#a855f7';
            ctx.beginPath();
            ctx.ellipse(-5, 0, 5, 3, -0.4, 0, Math.PI * 2);
            ctx.ellipse(5, 0, 5, 3, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(-1, -3, 2, 6);
          }

          ctx.restore();
        }
      }

      // Draw Landmines (Tactical Artillery Style Classic Mines!)
      if (curState.mines) {
        for (const mine of curState.mines) {
          // Metallic Base Disc
          ctx.fillStyle = '#4b5563';
          ctx.beginPath();
          ctx.ellipse(mine.x, mine.y, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Flashing Red LED Light
          const blink = mine.isTriggered
            ? Math.floor(Date.now() / 100) % 2 === 0
            : Math.floor(Date.now() / 600) % 2 === 0;

          ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(mine.x, mine.y - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (mine.isTriggered && mine.fuseTimerMs !== undefined) {
            const sec = (mine.fuseTimerMs / 1000).toFixed(1);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'extrabold 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚠️ ${sec}s`, mine.x, mine.y - 12);
          }
        }
      }

      // Draw Helicopters (Vector Military Attack Helicopter with Spinning Rotor & Cockpit Glass!)
      if (curState.helicopters) {
        const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);

        for (const heli of curState.helicopters) {
          ctx.save();
          ctx.translate(heli.x, heli.y);
          if (heli.facing === 'left') ctx.scale(-1, 1);

          // 1. Landing Skids
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-18, 14);
          ctx.lineTo(18, 14);
          ctx.moveTo(-10, 8);
          ctx.lineTo(-12, 14);
          ctx.moveTo(10, 8);
          ctx.lineTo(12, 14);
          ctx.stroke();

          // 2. Main Body Fuselage (Dark Gunmetal)
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 3. Cockpit Glass Canopy (Cyan Glass)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(8, -2, 11, 7, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4. Pilot Slug Head in Cockpit
          if (heli.pilotSlugId) {
            const pilot = curState.slugs.find((s) => s.id === heli.pilotSlugId);
            const team = pilot ? curState.teams.find((t) => t.id === pilot.teamId) : null;
            const teamColor = team ? team.color : '#a855f7';

            ctx.save();
            ctx.translate(7, -3);

            // Pilot Slug Head
            ctx.fillStyle = teamColor;
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Aviator Flight Helmet
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, -1, 5, Math.PI, Math.PI * 2);
            ctx.fill();

            // Helmet Visor
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-2, -1, 5, 2.5);

            ctx.restore();
          }

          // 5. Tail Boom & Rear Tail Rotor
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-35, -3, 20, 5);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-37, -9, 4, 12);

          const isPiloted = Boolean(heli.pilotSlugId);
          const isAirborne = isPiloted || (Math.abs(heli.vx) > 0.1 || Math.abs(heli.vy) > 0.1);

          // Spinning Tail Rotor Blades (calculated locally at 60 FPS on both host and guest!)
          const tailRotorSpeed = isPiloted ? 45 : isAirborne ? 20 : 6;
          const tSpin = Math.sin(animTime * tailRotorSpeed);
          ctx.strokeStyle = isPiloted ? '#cbd5e1' : '#94a3b8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-35, -3 - tSpin * 8);
          ctx.lineTo(-35, -3 + tSpin * 8);
          ctx.stroke();

          // 6. Top Main Rotor Shaft & Spinning Main Blades
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -16, 4, 6);

          // High-speed rotor blur disc when flying
          if (isPiloted) {
            ctx.save();
            ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
            ctx.beginPath();
            ctx.ellipse(0, -16, 45, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Spinning Main Blades (calculated locally at 60 FPS on both host and guest!)
          const mainRotorSpeed = isPiloted ? 35 : isAirborne ? 16 : 4;
          const currentRotorAngle = animTime * mainRotorSpeed;
          const bladeWidth = Math.cos(currentRotorAngle) * 45;
          ctx.strokeStyle = isPiloted ? '#e2e8f0' : '#64748b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-bladeWidth, -16);
          ctx.lineTo(bladeWidth, -16);
          ctx.stroke();

          // Rotor Hub Cap
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Blinking LED Nav Lights
          // Red LED on Tail
          const redBlink = Math.floor(Date.now() / 400) % 2 === 0;
          ctx.fillStyle = redBlink ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(-35, -3, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Green LED on Main Rotor Tip
          const greenBlink = Math.floor(Date.now() / 200) % 2 === 0;
          ctx.fillStyle = greenBlink ? '#22c55e' : '#14532d';
          ctx.beginPath();
          ctx.arc(bladeWidth, -16, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Searchlight Spotlight Cone (Golden Beam from Nose)
          ctx.save();
          const lightOriginX = 14;
          const lightOriginY = 4;
          
          const lightGrad = ctx.createLinearGradient(lightOriginX, lightOriginY, lightOriginX + 60, lightOriginY + 120);
          lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          lightGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
          lightGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.moveTo(lightOriginX, lightOriginY);
          ctx.lineTo(lightOriginX - 35, lightOriginY + 130);
          ctx.lineTo(lightOriginX + 75, lightOriginY + 130);
          ctx.closePath();
          ctx.fill();

          // Floating Light Dust Motes in Cone
          ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
          for (let m = 0; m < 5; m++) {
            const mx = lightOriginX + Math.sin(Date.now() * 0.002 + m) * 20;
            const my = lightOriginY + 20 + ((Date.now() * 0.03 + m * 25) % 100);
            ctx.beginPath();
            ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 7. Side Rocket Pod
          ctx.fillStyle = '#475569';
          ctx.fillRect(-6, 4, 14, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, 5, 2, 3);

          ctx.restore();

          // 8. Health Bar above Helicopter
          const hpPct = Math.max(0, heli.hp / heli.maxHp);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(heli.x - 20, heli.y - 28, 40, 5);
          ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
          ctx.fillRect(heli.x - 20, heli.y - 28, 40 * hpPct, 5);

          // 9. Interactive Prompt when Active Slug is Near
          if (isMyTurnRef.current && activeSlug && !activeSlug.inVehicleId) {
            const dist = Math.hypot(activeSlug.x - heli.x, activeSlug.y - heli.y);
            if (dist < 65) {
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'black 11px Outfit, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🚁 Appuyez sur [ENTRER / E] pour Piloter', heli.x, heli.y - 36);
            }
          }
        }
      }

      // Draw Slugs
      // Placement Ghost Preview (Rendered ONLY for the player whose turn it is to place a slug)
      if (curState.phase === 'PLACEMENT' && isMyTurnRef.current) {
        const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);
        const team = curState.teams.find((t) => t.id === curState.activeTeamId);
        const mPos = mousePosRef.current;

        ctx.save();
        ctx.translate(mPos.x, mPos.y);

        // Pulsing Tactical Placement Ring
        const ringPulse = Math.sin(animTime * 6) * 2;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, -8, 16 + ringPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Translucent Ghost Slug Body
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = team?.color || '#a855f7';
        ctx.beginPath();
        ctx.arc(0, -8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, -10, 2.5, 0, Math.PI * 2);
        ctx.arc(-3, -10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(3, -10, 1.2, 0, Math.PI * 2);
        ctx.arc(-3, -10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Tactical Placement Tooltip Badge
        ctx.save();
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        const pLabel = `📍 Placer ${activeSlug?.name || 'Limace'}`;
        ctx.font = 'bold 11px Outfit, sans-serif';
        const pMetrics = ctx.measureText(pLabel);
        const pW = pMetrics.width + 16;
        ctx.beginPath();
        ctx.roundRect(mPos.x - pW / 2, mPos.y - 40, pW, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pLabel, mPos.x, mPos.y - 30);
        ctx.restore();
      }

      // Draw Tombstones & Ascending Cute Ghosts for Fallen Slugs
      for (const slug of curState.slugs) {
        if (slug.isAlive || !slug.isPlaced) continue;
        const team = curState.teams.find((t) => t.id === slug.teamId);
        const teamColor = team?.color || '#ec4899';

        // A. Weathered Stone Tombstone (Only on solid ground / dry land)
        if (slug.y < waterLevel + 10) {
          ctx.save();
          ctx.translate(slug.x, slug.y);

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 2, 9, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Stone Slab (Arch Top)
          const stoneGrad = ctx.createLinearGradient(0, -18, 0, 2);
          stoneGrad.addColorStop(0, '#94a3b8');
          stoneGrad.addColorStop(1, '#475569');
          ctx.fillStyle = stoneGrad;
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.4;

          ctx.beginPath();
          ctx.moveTo(-7, 2);
          ctx.lineTo(-7, -10);
          ctx.quadraticCurveTo(-7, -18, 0, -18);
          ctx.quadraticCurveTo(7, -18, 7, -10);
          ctx.lineTo(7, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Carved Cross in Stone
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-1, -14, 2, 8);
          ctx.fillRect(-3.5, -12, 7, 2);

          // Team Ribbon / Base Floral Accent
          ctx.fillStyle = teamColor;
          ctx.beginPath();
          ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Stone Crack Details
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(3, -15);
          ctx.lineTo(1, -11);
          ctx.lineTo(4, -8);
          ctx.stroke();

          ctx.restore();
        }

        // B. Cute Floating Ghost with Angelic Halo & Tail Sway (Ascends ONCE upon death!)
        if (!slugDeathTimestampsRef.current.has(slug.id)) {
          slugDeathTimestampsRef.current.set(slug.id, Date.now());
        }
        const deathTime = slugDeathTimestampsRef.current.get(slug.id) || Date.now();
        const elapsedMs = Date.now() - deathTime;
        const ghostDurationMs = 3600; // 3.6 seconds one-shot gentle flight to heaven

        if (elapsedMs < ghostDurationMs) {
          const progress = elapsedMs / ghostDurationMs; // 0.0 to 1.0
          const ghostY = slug.y - 10 - progress * 120;
          const ghostX = slug.x + Math.sin(animTime * 2.5 + slug.id.charCodeAt(0)) * 5;
          const ghostAlpha = (1 - progress) * (0.85 + Math.sin(animTime * 4) * 0.15);

          if (ghostAlpha > 0.02 && ghostY > -30) {
            ctx.save();
            ctx.translate(ghostX, ghostY);
            ctx.globalAlpha = ghostAlpha;

            // Floating Angelic Halo
            const haloY = -18 + Math.sin(animTime * 3) * 1.5;
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, haloY, 5, 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Ghost Body with Tail Ripple
            const ghostGrad = ctx.createRadialGradient(-2, -6, 2, 0, 0, 12);
            ghostGrad.addColorStop(0, '#ffffff');
            ghostGrad.addColorStop(0.7, '#e0f2fe');
            ghostGrad.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
            ctx.fillStyle = ghostGrad;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.2;

            const tailWave = Math.sin(animTime * 5 + slug.id.charCodeAt(0)) * 2;
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.quadraticCurveTo(-7, -8, 0, -12);
            ctx.quadraticCurveTo(7, -8, 6, 2);
            // Wavy bottom skirt
            ctx.quadraticCurveTo(4, 5 + tailWave, 2, 2);
            ctx.quadraticCurveTo(0, -1 - tailWave, -2, 2);
            ctx.quadraticCurveTo(-4, 5 + tailWave, -6, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cute Ghost Eyes
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-2, -6, 1.3, 0, Math.PI * 2);
            ctx.arc(2, -6, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Cute Pink Blush
            ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
            ctx.beginPath();
            ctx.arc(-3.5, -4, 1.2, 0, Math.PI * 2);
            ctx.arc(3.5, -4, 1.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      for (const slug of curState.slugs) {
        if (!slug.isAlive || !slug.isPlaced) continue;
        const team = curState.teams.find((t) => t.id === slug.teamId);
        const teamColor = team?.color || '#ec4899';
        const teamIndex = curState.teams.findIndex((t) => t.id === slug.teamId);
        const isActive = slug.id === curState.activeSlugId;
        const isAiming = isActive && curState.phase === 'AIMING';
        const aimRad = (slug.aimAngle * Math.PI) / 180;

        // Airborne Ballistic Blast Velocity Check
        const speed = Math.hypot(slug.vx, slug.vy);
        const isAirbornePanic = speed > 2.0;

        // Proximity Danger Check (Dangerous incoming projectile or triggered landmine or low HP)
        let isDangerNear = slug.hp < 35;
        if (!isDangerNear && curState.projectiles && curState.projectiles.length > 0) {
          for (const p of curState.projectiles) {
            if (Math.hypot(slug.x - p.x, slug.y - p.y) < 70) {
              isDangerNear = true;
              break;
            }
          }
        }
        if (!isDangerNear && curState.mines && curState.mines.length > 0) {
          for (const m of curState.mines) {
            if (m.isTriggered && Math.hypot(slug.x - m.x, slug.y - m.y) < 55) {
              isDangerNear = true;
              break;
            }
          }
        }

        // Active Slug Yellow Floating Arrow Marker (Polished Animated Beacon)
        if (isActive) {
          const arrowBounce = Math.sin(animTime * 1.5) * 3;
          const arrowY = slug.y - 46 + arrowBounce;
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#09090b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(slug.x, arrowY + 8);
          ctx.lineTo(slug.x - 6, arrowY);
          ctx.lineTo(slug.x - 2, arrowY);
          ctx.lineTo(slug.x - 2, arrowY - 8);
          ctx.lineTo(slug.x + 2, arrowY - 8);
          ctx.lineTo(slug.x + 2, arrowY);
          ctx.lineTo(slug.x + 6, arrowY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Airborne Speed Trail Lines in High-Velocity Flight
        if (isAirbornePanic) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.5;
          for (let s = -1; s <= 1; s++) {
            ctx.beginPath();
            ctx.moveTo(slug.x - slug.vx * 1.8 + s * 4, slug.y - slug.vy * 1.8 + s * 3);
            ctx.lineTo(slug.x - slug.vx * 3.6 + s * 4, slug.y - slug.vy * 3.6 + s * 3);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Squish & Stretch Animation during locomotion + Scaled to match exact hitbox bounds
        const isMoving = Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1;
        const squishX = isAirbornePanic ? Math.min(0.35, speed * 0.035) : (isMoving ? Math.sin(animTime * 14) * 0.12 : 0);
        const squishY = isAirbornePanic ? -Math.min(0.2, speed * 0.02) : (isMoving ? -Math.sin(animTime * 14) * 0.12 : 0);
        const slugScale = 0.72; // Perfect 1:1 scale matching the 8px radius / 16px hitbox

        ctx.save();
        ctx.translate(slug.x, slug.y - 2);

        // Airborne blast tilt rotation
        if (isAirbornePanic) {
          const tilt = Math.atan2(slug.vy, slug.vx * (slug.facing === 'left' ? -1 : 1)) * 0.25;
          ctx.rotate(tilt);
        }

        if (slug.facing === 'left') {
          ctx.scale(-1 * (1 + squishX) * slugScale, (1 + squishY) * slugScale);
        } else {
          ctx.scale((1 + squishX) * slugScale, (1 + squishY) * slugScale);
        }

        // --- 1. DROP SHADOW ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- 2. 3D SHADED FLESHY SLUG BODY (Matching Menu Vector Art) ---
        const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 2, 14);
        bodyGrad.addColorStop(0, '#fef08a'); // Warm top highlight
        bodyGrad.addColorStop(0.35, teamColor);
        bodyGrad.addColorStop(1, '#180828');

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = isActive ? '#facc15' : '#18181b';
        ctx.lineWidth = isActive ? 2.2 : 1.6;
        ctx.beginPath();
        ctx.moveTo(-11, 4);
        ctx.quadraticCurveTo(-13, -1, -6, -7);
        ctx.quadraticCurveTo(0, -13, 8, -7);
        ctx.quadraticCurveTo(14, 0, 11, 6);
        ctx.quadraticCurveTo(0, 8, -11, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // --- 3. SOFT BELLY UNDERLAYER ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 3, 7.5, 3, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // --- 4. BODY SEGMENT CREASE ---
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-3, 2, 4, -Math.PI * 0.4, Math.PI * 0.2);
        ctx.stroke();

        // --- 5. EYESTALKS ---
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(1, -6);
        ctx.lineTo(2, -10);
        ctx.moveTo(6, -5);
        ctx.lineTo(8, -9);
        ctx.stroke();

        // --- 6. BIG EXPRESSIVE CARTOON EYES ---
        const isBlinking = !isAirbornePanic && !isDangerNear && Math.sin(animTime * 1.5 + (slug.id.charCodeAt(0) % 10)) > 0.94;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.4;

        if (isAirbornePanic) {
          // SHOCKED PANIC EYES (Wide Ovals & Pinpoint Terrified Pupils)
          // Left Eye
          ctx.beginPath();
          ctx.arc(2, -10, 5.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Eye
          ctx.beginPath();
          ctx.arc(8, -9, 4.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Tiny pinpoint terrified pupils with nervous tremor
          const jitterX = Math.sin(animTime * 20) * 0.6;
          const jitterY = Math.cos(animTime * 20) * 0.6;
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(2.5 + jitterX, -10 + jitterY, 1.2, 0, Math.PI * 2);
          ctx.arc(8.5 + jitterX, -9 + jitterY, 1.1, 0, Math.PI * 2);
          ctx.fill();

          // Panicked eye shine
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(2.2 + jitterX, -10.8 + jitterY, 0.5, 0, Math.PI * 2);
          ctx.arc(8.2 + jitterX, -9.8 + jitterY, 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Normal Expressive Eyes
          // Left Eye
          ctx.beginPath();
          ctx.arc(2, -10, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Eye
          ctx.beginPath();
          ctx.arc(8, -9, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (!isBlinking) {
            // Pupils tracking aim direction or looking ahead
            const pupilOffX = isAiming ? Math.cos(aimRad) * 1.4 : Math.sin(animTime * 1.2) * 0.8;
            const pupilOffY = isAiming ? -Math.sin(aimRad) * 1.4 : 0;

            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.arc(2.5 + pupilOffX, -10 + pupilOffY, 1.8, 0, Math.PI * 2);
            ctx.arc(8.5 + pupilOffX, -9 + pupilOffY, 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Eye Light Glints
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(2 + pupilOffX, -11 + pupilOffY, 0.8, 0, Math.PI * 2);
            ctx.arc(8 + pupilOffX, -10 + pupilOffY, 0.7, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Blinking eye slits
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-1, -10);
            ctx.lineTo(5, -10);
            ctx.moveTo(6, -9);
            ctx.lineTo(11, -9);
            ctx.stroke();
          }
        }

        // --- 7. TEAM SOLDIER HATS / ACCESSORIES ---
        if (teamIndex % 4 === 0) {
          // Green Camo Soldier Helmet with Gold Star
          ctx.fillStyle = '#3f6212';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(5, -13, 9, 5, 0.1, Math.PI, 0);
          ctx.fill();
          ctx.stroke();
          // Star
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(5, -15, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (teamIndex % 4 === 1) {
          // Red Pirate Bandana with Fluttering Tails
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(5, -12, 8.5, 3.5, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Bandana tail flutter
          ctx.beginPath();
          ctx.moveTo(-3, -12);
          ctx.lineTo(-11 + Math.sin(animTime * 6) * 2, -15);
          ctx.lineTo(-9 + Math.sin(animTime * 6) * 2, -10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (teamIndex % 4 === 2) {
          // --- HIGH-TECH DUAL NIGHT VISION GOGGLES (Matching Lobby Exact Geometry!) ---
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.4;

          // Left Eyepiece Housing (centered on Left Eye at x=2, y=-10)
          ctx.beginPath();
          ctx.roundRect(-1.5, -13.5, 7, 7, 2);
          ctx.fill();
          ctx.stroke();

          // Right Eyepiece Housing (centered on Right Eye at x=8, y=-9)
          ctx.beginPath();
          ctx.roundRect(5, -12.5, 6.5, 7, 2);
          ctx.fill();
          ctx.stroke();

          // Bridge & Headstrap
          ctx.strokeStyle = '#09090b';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-5, -10);
          ctx.lineTo(-1.5, -10);
          ctx.moveTo(3.5, -10);
          ctx.lineTo(6, -10);
          ctx.stroke();

          // Luminous Neon Emerald Laser Lenses
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(2, -10, 2.2, 0, Math.PI * 2);
          ctx.arc(8, -9, 2.0, 0, Math.PI * 2);
          ctx.fill();

          // Glowing laser center dots
          ctx.fillStyle = '#6ee7b7';
          ctx.beginPath();
          ctx.arc(2, -10, 1.0, 0, Math.PI * 2);
          ctx.arc(8, -9, 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else if (teamIndex % 4 === 3) {
          // --- SPECIAL OPS TACTICAL RADIO HEADSET & BOOM MIC ---
          // 1. Headband Arc
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(4, -12, 7.5, -Math.PI * 0.8, -Math.PI * 0.1);
          ctx.stroke();

          // 2. Ear Cup
          ctx.fillStyle = teamColor;
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(-2, -9, 3, 4.5, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 3. Boom Microphone
          ctx.strokeStyle = '#09090b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-2, -7);
          ctx.quadraticCurveTo(2, -4, 6, -3);
          ctx.stroke();
          // Mic Foam Tip
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(6, -3, 1.4, 0, Math.PI * 2);
          ctx.fill();

          // 4. Antenna Mast with Blinking Beacon
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-2, -12);
          ctx.lineTo(-7, -22);
          ctx.stroke();
          // Blinking Transmitter Beacon
          const beaconFlash = Math.sin(animTime * 6) > 0;
          ctx.fillStyle = beaconFlash ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(-7, -22, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- SPECIAL FORCES COMMANDER BERET WITH GOLD CREST ---
          ctx.fillStyle = teamColor;
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-4, -10);
          ctx.quadraticCurveTo(0, -18, 12, -13);
          ctx.quadraticCurveTo(8, -8, -4, -10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Golden Combat Insignia Crest
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(1, -12, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // --- 8. MOUTH (Smirk or Screaming Scream in Airborne Panic) ---
        if (isAirbornePanic) {
          // Wide open screaming mouth
          ctx.fillStyle = '#09090b';
          ctx.strokeStyle = '#831843';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(6, 0, 3.5, 5, 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Pink Tongue
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.ellipse(6, 2.5, 2.2, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic Smirk Mouth
          ctx.strokeStyle = '#831843';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(5, -1, 3, 0.2, Math.PI * 0.7);
          ctx.stroke();
        }

        // --- 9. DANGER / LOW HP ANIMATED SWEAT DROPS ---
        if (isDangerNear || isAirbornePanic) {
          const sweatAnim = Math.sin(animTime * 8) * 1.5;

          // Main Teardrop
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-5, -12 + sweatAnim);
          ctx.quadraticCurveTo(-7.5, -8 + sweatAnim, -5, -6 + sweatAnim);
          ctx.quadraticCurveTo(-2.5, -8 + sweatAnim, -5, -12 + sweatAnim);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // White Sparkle Glint on Sweat Drop
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-5.5, -8 + sweatAnim, 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Secondary mini-droplet if intense danger
          if (isAirbornePanic || slug.hp < 20) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(-9, -10 - sweatAnim * 0.8, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // --- 10. HELD WEAPON IN HAND (When Aiming) ---
        if (isAiming) {
          const weaponId = slug.selectedWeaponId;

          ctx.save();
          ctx.translate(5, -4);
          ctx.rotate(-aimRad);

          if (weaponId === 'bazooka' || weaponId === 'homing_missile') {
            // Heavy Gunmetal Bazooka with Hazard Warning Stripes
            ctx.fillStyle = '#3f3f46';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 1.4;
            ctx.fillRect(0, -3.5, 16, 6);
            ctx.strokeRect(0, -3.5, 16, 6);

            // Hazard Stripes
            ctx.fillStyle = '#eab308';
            ctx.fillRect(8, -3.5, 2.5, 6);
            ctx.fillRect(13, -3.5, 2.5, 6);
          } else if (weaponId === 'baseball_bat') {
            // Wooden Baseball Bat
            ctx.fillStyle = '#b45309';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.2;
            ctx.fillRect(0, -2.5, 18, 5);
            ctx.strokeRect(0, -2.5, 18, 5);
          } else if (weaponId === 'holy_grenade') {
            // Golden Holy Hand Grenade with Cross
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(8, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Golden Cross
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(7, -7, 2, 5);
            ctx.fillRect(5.5, -5.5, 5, 2);
          } else if (weaponId === 'banana_bomb') {
            // Curved Banana Bomb
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#854d0e';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(8, 0, 6, 3, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (weaponId === 'dynamite') {
            // 3-Stick Dynamite Pack with Sparkling Flame Fuse
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(3, -5, 8, 10);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(3, -2, 8, 3);
            // Sparkling flame tip
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(12, -6, 2.5 + Math.sin(animTime * 18) * 1, 0, Math.PI * 2);
            ctx.fill();
          } else if (weaponId === 'blowtorch' || slug.isBlowtorching) {
            // Red Gas Cylinder & Steel Nozzle
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, -1, 7, 10);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(6, -3, 10, 4);

            // Fiery 3-Stage Animated Plasma Jet
            const flamePulse = Math.sin(Date.now() * 0.05) * 4;
            const flameLen = 30 + flamePulse;

            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(16, -5);
            ctx.lineTo(16 + flameLen, -1);
            ctx.lineTo(16, 3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(16, -3);
            ctx.lineTo(16 + flameLen * 0.7, -1);
            ctx.lineTo(16, 1);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(16, -1, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Pineapple Grenade
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(7, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          ctx.restore();
        }

        ctx.restore();

        // --- 11. MODERN FLOATING GLASS HP BADGE ---
        const badgeW = 38;
        const badgeH = 14;
        const badgeX = slug.x - badgeW / 2;
        const badgeY = slug.y - 34;

        ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        // HP Number
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${slug.hp}`, slug.x, badgeY + badgeH / 2);
      }

      // Classic Animated Aiming Crosshair & Charging Gauge Bar
      const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);
      if (activeSlug && (curState.phase === 'AIMING' || curState.phase === 'TURN_TIME')) {
        const weapon = getWeapon(activeSlug.selectedWeaponId);
        const rad = (activeSlug.aimAngle * Math.PI) / 180;
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        const originX = activeSlug.x + dir * 10;
        const originY = activeSlug.y - 10;

        if (isMyTurnRef.current && !weapon.requiresTarget && weapon.id !== 'girder') {
          // Classic Animated Aiming Reticle (Fixed Distance Orbit, Center Aligned in Exact Mouse Direction)
          const reticleDist = 58;
          const retX = originX + Math.cos(rad) * reticleDist * dir;
          const retY = originY - Math.sin(rad) * reticleDist;

          ctx.save();
          ctx.translate(retX, retY);

          // Classic Yellow Dotted Connecting Trace from weapon to crosshair
          ctx.strokeStyle = activeSlug.isChargingPower ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(-(retX - originX), -(retY - originY));
          ctx.lineTo(0, 0);
          ctx.stroke();
          ctx.setLineDash([]);

          // Outer Pulsing Glow Circle
          const pulse = Math.sin(animTime * 6) * 1.5;
          const outerR = 14 + pulse;
          ctx.strokeStyle = activeSlug.isChargingPower ? '#ef4444' : '#facc15';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, outerR, 0, Math.PI * 2);
          ctx.stroke();

          // 4 Cardinal Precision Ticks (Crosshair +)
          const tickLen = 6;
          ctx.lineWidth = 2;
          ctx.beginPath();
          // Top
          ctx.moveTo(0, -outerR - 2);
          ctx.lineTo(0, -outerR - 2 - tickLen);
          // Bottom
          ctx.moveTo(0, outerR + 2);
          ctx.lineTo(0, outerR + 2 + tickLen);
          // Left
          ctx.moveTo(-outerR - 2, 0);
          ctx.lineTo(-outerR - 2 - tickLen, 0);
          // Right
          ctx.moveTo(outerR + 2, 0);
          ctx.lineTo(outerR + 2 + tickLen, 0);
          ctx.stroke();

          // Rotating Inner Segmented Ring
          ctx.save();
          ctx.rotate(animTime * 2);
          ctx.strokeStyle = activeSlug.isChargingPower ? 'rgba(239, 68, 68, 0.8)' : 'rgba(254, 240, 138, 0.8)';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 7.5, (i * Math.PI) / 2 + 0.25, ((i + 1) * Math.PI) / 2 - 0.25);
            ctx.stroke();
          }
          ctx.restore();

          // Center Glowing Bullseye Dot
          ctx.fillStyle = activeSlug.isChargingPower ? '#ef4444' : '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Angle Readout Floating Glass Badge
          const badgeX = dir === 1 ? 18 : -18;
          const badgeY = -16;
          const badgeText = `${Math.round(activeSlug.aimAngle)}°`;

          ctx.font = 'bold 9.5px monospace';
          const textW = ctx.measureText(badgeText).width;
          const padW = textW + 10;
          const padH = 14;

          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.strokeStyle = activeSlug.isChargingPower ? '#ef4444' : '#eab308';
          ctx.lineWidth = 1;
          ctx.fillRect(badgeX - padW / 2, badgeY - padH / 2, padW, padH);
          ctx.strokeRect(badgeX - padW / 2, badgeY - padH / 2, padW, padH);

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX, badgeY);

          ctx.restore();
        }

        // 3. Ninja Rope Aim Guide & Anchor Preview
        if (isMyTurn && weapon.id === 'ninja_rope') {
          const maxDist = 250;
          let hitX = originX + Math.cos(rad) * maxDist * dir;
          let hitY = originY - Math.sin(rad) * maxDist;
          let hasSolid = false;

          for (let d = 10; d <= maxDist; d += 4) {
            const tx = originX + Math.cos(rad) * d * dir;
            const ty = originY - Math.sin(rad) * d;
            if (tx < 0 || tx >= terrain.data.width || ty < 0) break;
            if (terrain.isSolid(Math.floor(tx), Math.floor(ty))) {
              hitX = tx;
              hitY = ty;
              hasSolid = true;
              break;
            }
          }

          ctx.save();
          ctx.strokeStyle = hasSolid ? '#38bdf8' : '#71717a';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(hitX, hitY);
          ctx.stroke();
          ctx.setLineDash([]);

          if (hasSolid) {
            ctx.strokeStyle = '#38bdf8';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.beginPath();
            ctx.arc(hitX, hitY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. Girder Hologram Blueprint Preview
        if (isMyTurn && weapon.id === 'girder') {
          const targetPt = lockedTargetRef.current || mousePosRef.current;
          const length = 110;
          const thickness = 14;
          const angleDeg = activeSlug.aimAngle || 0;
          const gRad = (angleDeg * Math.PI) / 180;

          ctx.save();
          ctx.translate(targetPt.x, targetPt.y);
          ctx.rotate(gRad);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
          ctx.strokeRect(-length / 2, -thickness / 2, length, thickness);
          ctx.setLineDash([]);

          // Center Placement Pivot Cross
          ctx.strokeStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.stroke();

          ctx.restore();
        }

        // 5. Power Charging Bar Gauge & Glowing Percentage Readout
        if (activeSlug.isChargingPower) {
          const barW = 44;
          const barH = 7;
          const barX = activeSlug.x - barW / 2;
          const barY = activeSlug.y - 36;

          ctx.save();
          ctx.fillStyle = '#09090b';
          ctx.fillRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

          const pct = Math.min(1, Math.max(0.05, activeSlug.aimPower / 100));
          const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          pGrad.addColorStop(0, '#22c55e');
          pGrad.addColorStop(0.5, '#eab308');
          pGrad.addColorStop(1, '#ef4444');

          ctx.fillStyle = pGrad;
          ctx.fillRect(barX, barY, barW * pct, barH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(barX, barY, barW, barH);

          // Numeric Percentage Badge
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`⚡ ${Math.round(activeSlug.aimPower)}%`, activeSlug.x, barY - 3);
          ctx.restore();
        }

        // 6. Tactical Target Reticle (for weapons requiring a target!)
        if (isMyTurnRef.current && weapon.requiresTarget) {
          const targetPt = lockedTargetRef.current || mousePosRef.current;
          const isLocked = !!lockedTargetRef.current;

          ctx.save();
          ctx.translate(targetPt.x, targetPt.y);

          const retColor = isLocked ? '#ef4444' : '#38bdf8';

          // Pulsing Outer Radar Ping Ring
          const pingR = 18 + ((animTime * 18) % 16);
          const pingAlpha = Math.max(0, 1 - (pingR - 18) / 16);
          ctx.strokeStyle = isLocked ? `rgba(239, 68, 68, ${pingAlpha})` : `rgba(56, 189, 248, ${pingAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, pingR, 0, Math.PI * 2);
          ctx.stroke();

          // Main Reticle Ring
          ctx.strokeStyle = retColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.stroke();

          // 4 Tactical Corner Brackets
          const bSize = 22;
          const bLen = 6;
          ctx.lineWidth = 2.2;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(-bSize, -bSize + bLen);
          ctx.lineTo(-bSize, -bSize);
          ctx.lineTo(-bSize + bLen, -bSize);
          // Top-Right
          ctx.moveTo(bSize - bLen, -bSize);
          ctx.lineTo(bSize, -bSize);
          ctx.lineTo(bSize, -bSize + bLen);
          // Bottom-Left
          ctx.moveTo(-bSize, bSize - bLen);
          ctx.lineTo(-bSize, bSize);
          ctx.lineTo(-bSize + bLen, bSize);
          // Bottom-Right
          ctx.moveTo(bSize - bLen, bSize);
          ctx.lineTo(bSize, bSize);
          ctx.lineTo(bSize, bSize - bLen);
          ctx.stroke();

          // Center Crosshairs
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(10, 0);
          ctx.moveTo(0, -10);
          ctx.lineTo(0, 10);
          ctx.stroke();

          // Center precision dot
          ctx.fillStyle = retColor;
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Tactical HUD Status Label
          ctx.fillStyle = isLocked ? '#ef4444' : '#38bdf8';
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const label = isLocked
            ? '🎯 CIBLE VERROUILLÉE (CLIC GAUCHE = TIRER)'
            : '🎯 POSITIONNER CIBLE (CLIC DROIT / GAUCHE)';
          ctx.fillText(label, 0, -bSize - 5);

          ctx.restore();
        }
      }

      // Draw Projectiles (Upgraded High-Definition Vector Weapons & Super Sheep!)
      for (const proj of curState.projectiles) {
        if (!proj || !Number.isFinite(proj.x) || !Number.isFinite(proj.y)) continue;

        ctx.save();
        ctx.translate(proj.x, proj.y);
        const vx = Number.isFinite(proj.vx) ? proj.vx : 0;
        const vy = Number.isFinite(proj.vy) ? proj.vy : 0;
        const angle = Math.atan2(vy, vx);
        if (Number.isFinite(angle)) {
          ctx.rotate(angle);
        }

        if (proj.weaponId === 'bazooka' || proj.weaponId === 'homing_missile') {
          // --- HD STREAMLINED BAZOOKA / MISSILE WARHEAD ---
          ctx.fillStyle = '#3f3f46'; // Gunmetal Body
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.2;
          ctx.fillRect(-8, -3.5, 12, 7);
          ctx.strokeRect(-8, -3.5, 12, 7);

          // Red Nose Cone
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(4, -3.5);
          ctx.lineTo(11, 0);
          ctx.lineTo(4, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Yellow Stabilizing Fins
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-9, -5.5, 3.5, 11);

          // Glowing Thruster Exhaust Flame
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-8, -2.5);
          ctx.lineTo(-15 + Math.sin(animTime * 14) * 3, 0);
          ctx.lineTo(-8, 2.5);
          ctx.closePath();
          ctx.fill();
        } else if (proj.weaponId === 'super_sheep') {
          // --- HD STYLIZED SUPER SHEEP (Exact match to menu art!) ---
          // 1. Trailing Speed Wind Streaks
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(-32, 0);
          ctx.moveTo(-14, -6);
          ctx.lineTo(-26, -6);
          ctx.moveTo(-14, 6);
          ctx.lineTo(-26, 6);
          ctx.stroke();

          // 2. Fluttering Red Superhero Cape
          const capeWave = Math.sin(animTime * 12) * 4;
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-8, 0);
          ctx.lineTo(-24 + capeWave, -8);
          ctx.lineTo(-20 + capeWave, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 3. Fluffy Cloud Wool Body (Multi-lobed white puffs with gentle shading)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(-5, 0, 7, 0, Math.PI * 2);
          ctx.arc(2, -2, 6.5, 0, Math.PI * 2);
          ctx.arc(8, 0, 6, 0, Math.PI * 2);
          ctx.arc(2, 5, 5.5, 0, Math.PI * 2);
          ctx.arc(-4, 4, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4. Dark Sheep Face & Snout
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(10, 1, 4.5, 3.5, 0.2, 0, Math.PI * 2);
          ctx.fill();

          // 5. Cute Shiny Sheep Eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(9.5, 0, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(10, 0, 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.weaponId === 'holy_grenade') {
          // --- HD GOLDEN HOLY HAND GRENADE ---
          const orbGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 6);
          orbGrad.addColorStop(0, '#fef08a');
          orbGrad.addColorStop(0.5, '#eab308');
          orbGrad.addColorStop(1, '#a16207');
          ctx.fillStyle = orbGrad;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Pearl Girdle
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.stroke();

          // Golden Cross on Top
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1.5, -9, 3, 5);
          ctx.fillRect(-3.5, -7.5, 7, 2.5);
        } else if (proj.weaponId === 'banana_bomb') {
          // --- HD CLUSTER BANANA BOMB ---
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 4, 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Banana Stem
          ctx.fillStyle = '#713f12';
          ctx.fillRect(6, -2, 3, 2);
        } else if (proj.weaponId === 'dynamite') {
          // --- HD DYNAMITE STICK WITH SPARKLING FUSE ---
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1.2;
          ctx.fillRect(-8, -4, 16, 8);
          ctx.strokeRect(-8, -4, 16, 8);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-8, -1.5, 16, 3);
          // Spark
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(10, -4, 3 + Math.sin(animTime * 18) * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.weaponId === 'concrete_donkey') {
          // --- HD CHISELLED CONCRETE DONKEY STATUE ---
          ctx.save();
          ctx.rotate(-angle);

          // Pedestal
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-18, 10, 36, 8);
          ctx.strokeRect(-18, 10, 36, 8);

          // Donkey Body
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-14, -10, 28, 20);
          ctx.strokeRect(-14, -10, 28, 20);

          // Head & Long Ears
          ctx.fillRect(-18, -18, 12, 12);
          ctx.fillRect(-16, -24, 4, 8);
          ctx.fillRect(-10, -24, 4, 8);

          ctx.restore();
        } else {
          // Standard Projectile Orb
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bouncing Timer Countdown Badge
        if (proj.fuseTimerMs !== undefined && proj.fuseTimerMs > 0) {
          const sec = (proj.fuseTimerMs / 1000).toFixed(1);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'extrabold 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText(`⚠️ ${sec}s`, 0, -12);
          ctx.fillText(`⚠️ ${sec}s`, 0, -12);
        }

        ctx.restore();
      }

      // Spawn & Draw Client-Side Smoke & Fire Trail Particles at 60 FPS (0 Network Overhead!)
      if (curState.projectiles && curState.projectiles.length > 0) {
        for (const proj of curState.projectiles) {
          if (Math.hypot(proj.vx, proj.vy) > 0.5 && clientParticlesRef.current.length < 50) {
            clientParticlesRef.current.push({
              x: proj.x - proj.vx * 0.8,
              y: proj.y - proj.vy * 0.8,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6 - 0.2,
              color: Math.random() > 0.35 ? '#f97316' : '#71717a',
              size: Math.random() * 3 + 2,
              life: 1.0,
            });
          }
        }
      }

      const remainingParticles: typeof clientParticlesRef.current = [];
      for (const p of clientParticlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
        if (p.life > 0) {
          remainingParticles.push(p);
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life * 0.85);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      clientParticlesRef.current = remainingParticles;

      // Render Client-Side Fiery Explosions with Smooth Expanding Shockwave Core at 60+ FPS locally
      const nowAnim = performance.now();
      const remainingExplosions: typeof clientExplosionsRef.current = [];
      for (const ex of clientExplosionsRef.current) {
        const elapsed = nowAnim - ex.startTime;
        const progress = Math.min(1, elapsed / ex.duration);
        const alpha = Math.max(0, 1 - progress);
        const safeRadius = ex.radius;

        // Outer Shockwave Ring (expands rapidly)
        const shockRadius = safeRadius * (0.3 + progress * 0.9);
        if (shockRadius > 0) {
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
          ctx.lineWidth = Math.max(1, 3.5 * (1 - progress));
          ctx.beginPath();
          ctx.arc(ex.x, ex.y, shockRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner Fireball Core with smooth expansion & fade
        const fireballRadius = safeRadius * (0.35 + progress * 0.65);
        const exGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, fireballRadius);
        exGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        exGrad.addColorStop(0.25, `rgba(250, 204, 21, ${alpha * 0.9})`);
        exGrad.addColorStop(0.65, `rgba(239, 68, 68, ${alpha * 0.7})`);
        exGrad.addColorStop(1, `rgba(127, 29, 29, 0)`);

        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, fireballRadius, 0, Math.PI * 2);
        ctx.fill();

        if (progress < 1) {
          remainingExplosions.push(ex);
        }
      }
      clientExplosionsRef.current = remainingExplosions;

      // Draw Ninja Rope & Hook Anchors
      for (const s of curState.slugs) {
        if (s.isAlive && s.ropeState) {
          const rope = s.ropeState;
          ctx.save();
          // Braided steel cable line
          ctx.strokeStyle = '#e4e4e7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(rope.hookX, rope.hookY);
          ctx.lineTo(s.x, s.y - 8);
          ctx.stroke();

          ctx.strokeStyle = '#71717a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rope.hookX, rope.hookY);
          ctx.lineTo(s.x, s.y - 8);
          ctx.stroke();

          // Metallic Anchor Spike
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(rope.hookX, rope.hookY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Supply Crates (Parachute & Wooden Supply Boxes)
      if (curState.supplyCrates) {
        for (const crate of curState.supplyCrates) {
          ctx.save();
          ctx.translate(crate.x, crate.y);

          if (!crate.isLanded) {
            // Parachute Canopy
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -22, 16, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // White stripes on canopy
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -22, 8, Math.PI, 0);
            ctx.fill();

            // Suspension cords
            ctx.strokeStyle = '#e4e4e7';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-14, -22);
            ctx.lineTo(0, -8);
            ctx.moveTo(14, -22);
            ctx.lineTo(0, -8);
            ctx.moveTo(0, -38);
            ctx.lineTo(0, -8);
            ctx.stroke();
          }

          // Supply Crate Box (Military olive wooden box with red cross)
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(-9, -9, 18, 18);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-9, -9, 18, 18);

          // Red Cross Medical Icon (+50 HP)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, -6, 4, 12);
          ctx.fillRect(-6, -2, 12, 4);

          // Crate Label
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+50 HP', 0, 16);

          ctx.restore();
        }
      }

      // Floating Damage & Healing Numbers (Arcade Style bouncing +50 HP / -45 HP!)
      const nowFd = performance.now();
      const remainingFloatingDamages: typeof clientFloatingDamagesRef.current = [];
      for (const fd of clientFloatingDamagesRef.current) {
        const elapsed = nowFd - fd.startTime;
        const progress = Math.min(1, elapsed / fd.duration);
        const alpha = Math.max(0, 1 - progress);
        const floatY = fd.y - progress * 30;

        ctx.save();
        ctx.globalAlpha = alpha;
        const isHeal = fd.damage < 0;
        ctx.fillStyle = isHeal ? '#22c55e' : '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.font = 'extrabold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const text = isHeal ? `+${-fd.damage} HP` : `-${fd.damage}`;
        ctx.strokeText(text, fd.x, floatY);
        ctx.fillText(text, fd.x, floatY);
        ctx.restore();

        if (progress < 1) {
          remainingFloatingDamages.push(fd);
        }
      }
      clientFloatingDamagesRef.current = remainingFloatingDamages;

      // COMPREHENSIVE DEBUG HITBOX OVERLAY RENDERING (Slugs, Projectiles, Vehicles, Crates, Mines, Girders, Solid Props, Terrain & Water)
      if (showHitboxesRef.current) {
        ctx.save();

        // 0. Solid Ground Terrain Exact Physical Collision Hull & Mask (Neon Emerald Border)
        if (terrainHitboxCanvasRef.current) {
          ctx.drawImage(terrainHitboxCanvasRef.current, 0, 0);
        }

        // 1. World Map Boundaries & Deep Sea Danger Water Level
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(0, 0, width, height);
        ctx.setLineDash([]);

        // Water Hazard Danger Line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, waterLevel);
        ctx.lineTo(width, waterLevel);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`⚠️ NIVEAU DE L'EAU (NOYADE INSTANTANÉE: y=${waterLevel})`, 10, waterLevel - 6);

        // 2. Solid Destructible Decor Props Hitboxes
        const { solidProps } = terrain.data;
        if (solidProps) {
          for (const sprop of solidProps) {
            if (sprop.destroyed) continue;

            ctx.save();
            ctx.translate(sprop.x, sprop.y);
            if (sprop.angleRad) {
              ctx.rotate(sprop.angleRad);
            }

            // Ground Foundation Anchor Point
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(-1.5, -1.5, 3, 3);

            ctx.setLineDash([2, 2]);
            if (sprop.type === 'tree') {
              ctx.strokeStyle = '#10b981'; // Emerald
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-7, -45, 14, 45); // Trunk
              ctx.beginPath();
              ctx.arc(0, -35, 18, 0, Math.PI * 2); // Foliage
              ctx.stroke();
            } else if (sprop.type === 'mushroom') {
              ctx.strokeStyle = '#a855f7'; // Purple
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-6, -16, 12, 16);
              ctx.beginPath();
              ctx.ellipse(0, -21, 14, 8, 0, 0, Math.PI * 2);
              ctx.stroke();
            } else if (sprop.type === 'hedgehog') {
              ctx.strokeStyle = '#f59e0b'; // Amber
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(-2, -9, 14, 10, 0, 0, Math.PI * 2);
              ctx.stroke();
            } else if (sprop.type === 'chick') {
              ctx.strokeStyle = '#eab308'; // Yellow
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(0, -12, 14, 12, 0, 0, Math.PI * 2);
              ctx.stroke();
            } else if (sprop.type === 'flower') {
              ctx.strokeStyle = '#ec4899'; // Pink
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-2, -14, 4, 14);
              ctx.beginPath();
              ctx.arc(0, -16, 8, 0, Math.PI * 2);
              ctx.stroke();
            } else if (sprop.type === 'bunker') {
              ctx.strokeStyle = '#94a3b8'; // Slate
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-18, -26, 36, 26);
            } else if (sprop.type === 'totem') {
              ctx.strokeStyle = '#f59e0b'; // Amber
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-12, -36, 24, 36);
            } else if (sprop.type === 'cactus') {
              ctx.strokeStyle = '#22c55e'; // Green
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-11, -38, 22, 38);
            } else if (sprop.type === 'crystal') {
              ctx.strokeStyle = '#c084fc'; // Purple
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-13, -26, 26, 26);
            } else if (sprop.type === 'oil_drum') {
              ctx.strokeStyle = '#ef4444'; // Red
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-9, -24, 18, 24);
            } else if (sprop.type === 'lamppost') {
              ctx.strokeStyle = '#facc15'; // Yellow
              ctx.lineWidth = 1.2;
              ctx.strokeRect(-7, -42, 14, 42);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Prop:${sprop.type}`, 0, -4);

            ctx.restore();
          }
        }

        // 3. Vehicles (Helicopters) Hitboxes
        if (curState.helicopters) {
          for (const heli of curState.helicopters) {
            // Fuselage Bounding Rect (44x22)
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            ctx.strokeRect(heli.x - 22, heli.y - 11, 44, 22);

            // Rotor Collision Span (90px)
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(heli.x - 45, heli.y - 16);
            ctx.lineTo(heli.x + 45, heli.y - 16);
            ctx.stroke();

            // Boarding Proximity Zone (65px)
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(heli.x, heli.y, 65, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#06b6d4';
            ctx.font = 'bold 8.5px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`🚁 Hélico (Zone: 65px)`, heli.x, heli.y + 18);
          }
        }

        // 4. Supply Crates Hitboxes
        if (curState.supplyCrates) {
          for (const crate of curState.supplyCrates) {
            // Crate Box Bounding Box (18x18)
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(crate.x - 9, crate.y - 9, 18, 18);

            if (!crate.isLanded) {
              // Parachute Collision Arc (16px radius)
              ctx.strokeStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(crate.x, crate.y - 22, 16, Math.PI, 0);
              ctx.stroke();
            }
            ctx.setLineDash([]);

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`📦 Caisse 18x18`, crate.x, crate.y - 12);
          }
        }

        // 5. Placed Steel Girders Hitboxes
        if (curState.girders) {
          for (const g of curState.girders) {
            if (!g) continue;
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate((g.angleDeg * Math.PI) / 180);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([3, 2]);
            ctx.strokeRect(-g.length / 2, -g.thickness / 2, g.length, g.thickness);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Poutre ${g.length}x${g.thickness}`, 0, 3);
            ctx.restore();
          }
        }

        // 6. Landmines Hitboxes & Proximity Trigger Radii
        if (curState.mines) {
          for (const m of curState.mines) {
            if (!m) continue;
            // Proximity Trigger Detection Zone (25px)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([3, 2]);
            ctx.beginPath();
            ctx.arc(m.x, m.y - 8, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Base Anchor
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(m.x - 2, m.y - 2, 4, 4);

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`💣 Mine (r=25)`, m.x, m.y - 16);
          }
        }

        // 7. Projectiles Hitboxes & Blast Radii
        for (const proj of curState.projectiles) {
          if (!proj) continue;
          const weapon = getWeapon(proj.weaponId);

          // Projectile Collision Circle
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.radius || 4, 0, Math.PI * 2);
          ctx.stroke();

          // Explosion Blast Danger Ring
          if (weapon && weapon.radius > 0) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, weapon.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Velocity Vector
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x + proj.vx * 3, proj.y + proj.vy * 3);
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${proj.weaponId} (r=${proj.radius}, blast=${weapon?.radius || 0})`, proj.x, proj.y - 8);
        }

        // 8. Slugs Hitboxes, Ground Sensors & Velocity Vectors
        for (const slug of curState.slugs) {
          if (!slug.isAlive) continue;

          // Body Bounding Circle (Radius 8)
          ctx.strokeStyle = '#06b6d4'; // Cyan
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(slug.x, slug.y - 8, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Feet Ground Detection Line (slug.y + 1)
          ctx.strokeStyle = '#22c55e'; // Lime Green
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(slug.x - 4, slug.y + 1);
          ctx.lineTo(slug.x + 4, slug.y + 1);
          ctx.stroke();

          // Head Ceiling Collision Marker (slug.y - 16)
          ctx.fillStyle = '#ef4444'; // Red
          ctx.fillRect(slug.x - 2, slug.y - 16, 4, 2);

          // Center Pivot Dot
          ctx.fillStyle = '#facc15'; // Yellow
          ctx.fillRect(slug.x - 1, slug.y - 8 - 1, 2, 2);

          // Velocity Vector Line
          if (Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(slug.x, slug.y - 8);
            ctx.lineTo(slug.x + slug.vx * 5, slug.y - 8 + slug.vy * 5);
            ctx.stroke();
          }

          // Label
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${slug.name} (r=8)`, slug.x, slug.y - 20);
        }

        ctx.restore();
      }

      ctx.restore();

      const renderDuration = performance.now() - renderStart;
      perfTracker.markFrame(renderDuration, {
        slugs: curState?.slugs?.length || 0,
        livingSlugs: curState?.slugs?.filter((s) => s.isAlive).length || 0,
        projectiles: curState?.projectiles?.length || 0,
        explosions: curState?.explosions?.length || 0,
        particles: curState?.particles?.length || 0,
        mines: curState?.mines?.length || 0,
        crates: curState?.supplyCrates?.length || 0,
      });

      // Zero-overhead In-Game Permanent FPS HUD Updater (0 React re-renders, direct DOM mutation)
      if (fpsTextRef.current && perfTracker.getFpsHudEnabled()) {
        const now = performance.now();
        fpsCounterFramesRef.current++;
        if (now - lastFpsHudUpdateRef.current >= 250) {
          const fps = Math.round((fpsCounterFramesRef.current * 1000) / (now - lastFpsHudUpdateRef.current));
          fpsCounterFramesRef.current = 0;
          lastFpsHudUpdateRef.current = now;
          fpsTextRef.current.textContent = `${fps} FPS`;
          if (fpsDotRef.current) {
            fpsDotRef.current.className = `w-2 h-2 rounded-full ${
              fps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : fps >= 30 ? 'bg-amber-400' : 'bg-red-400'
            }`;
          }
          if (fpsBadgeRef.current) {
            fpsBadgeRef.current.className = `absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border rounded-lg text-xs font-mono font-black shadow-lg flex items-center gap-2 select-none z-20 ${
              fps >= 50 ? 'text-emerald-400 border-emerald-500/30' : fps >= 30 ? 'text-amber-300 border-amber-500/30' : 'text-red-400 border-red-500/30'
            }`;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [terrain, redrawOffscreenTerrain, carveOffscreenCrater]);

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl select-none"
    >
      {/* Zero-Overhead In-Game Permanent FPS Counter HUD */}
      <div
        ref={fpsBadgeRef}
        style={{ display: perfTracker.getFpsHudEnabled() ? 'flex' : 'none' }}
        className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border border-emerald-500/30 rounded-lg text-xs font-mono font-black text-emerald-400 shadow-lg flex items-center gap-2 select-none z-20"
      >
        <span ref={fpsDotRef} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span ref={fpsTextRef}>60 FPS</span>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair pointer-events-none"
      />

      {/* Tactical Artillery Style Floating Camera Zoom & Pan Controls */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1.5 rounded-xl shadow-xl backdrop-blur select-none z-10 text-xs"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.max(0.5, Math.round((zoomLevel - 0.2) * 10) / 10);
            const clamped = clampPan(panRef.current, newZ);
            zoomRef.current = newZ;
            panRef.current = clamped;
            setZoomLevel(newZ);
            setPanOffset(clamped);
          }}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Dézoomer (- / Molette Bas)"
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomRef.current = 1.0;
            panRef.current = { x: 0, y: 0 };
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2.5 h-7 flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 font-bold rounded-lg border border-zinc-600/50 transition text-xs font-mono"
          title="Recentrer la vue & Zoom 100% (Touche C)"
        >
          🎯 {Math.round(zoomLevel * 100)}% [C]
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.min(2.5, Math.round((zoomLevel + 0.2) * 10) / 10);
            const clamped = clampPan(panRef.current, newZ);
            zoomRef.current = newZ;
            panRef.current = clamped;
            setZoomLevel(newZ);
            setPanOffset(clamped);
          }}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Zoomer (+ / Molette Haut)"
        >
          +
        </button>
      </div>
    </div>
  );
});

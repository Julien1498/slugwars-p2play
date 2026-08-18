import { SolidProp, CraterRecord, ExplosionEvent, PlacedGirder } from '../core/types';

export function getPixelHash(x: number, y: number): number {
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
        { y: -43, r: 8, h: 10, color: '#34d399' },
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
        { x: 11, y: -28, r: 14, color: '#14532d' },
        { x: -7, y: -38, r: 13, color: '#15803d' },
        { x: 7, y: -38, r: 13, color: '#15803d' },
        { x: 0, y: -44, r: 11, color: '#22c55e' },
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

    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -28, 20, 4);

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

    ctx.fillStyle = '#09090b';
    ctx.fillRect(-6, -9, 12, 3);

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(-6, -33, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.ellipse(7, -31, 3.5, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.beginPath();
    ctx.roundRect(-5.5, -36, 11, 36, [5, 5, 0, 0]);
    ctx.fill();
    ctx.stroke();

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

    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2, -34);
    ctx.lineTo(-2, -1);
    ctx.moveTo(2, -34);
    ctx.lineTo(2, -1);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    const needlesY = [-30, -24, -18, -12, -6];
    for (const ny of needlesY) {
      ctx.fillRect(-7, ny, 2, 1);
      ctx.fillRect(5.5, ny, 2, 1);
    }

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

  if (solidFoundationCount === 0) {
    sprop.destroyed = true;
    return;
  }

  const propRadius = Math.max(sprop.width, sprop.height) * 0.85;
  const propCenterY = sprop.y - sprop.height / 2;

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

  if (overlappingCraters.length === 0) {
    drawSolidPropVector(ctx, sprop, animTime);
    return;
  }

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

  if (solidCount === 0) {
    g.destroyed = true;
    return;
  }

  const girderRadius = Math.max(g.length, g.thickness) * 0.65;

  const overlappingCraters: { x: number; y: number; radius: number }[] = [];
  if (craters) {
    const minIndex = g.initialCraterCount !== undefined ? g.initialCraterCount : 0;
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      // Ignore craters that existed before this girder was placed
      if (g.initialCraterCount !== undefined) {
        if (i < minIndex) continue;
      } else if (g.createdAt && c.createdAt && c.createdAt < g.createdAt) {
        continue;
      }
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

  if (overlappingCraters.length > 0) {
    for (const c of overlappingCraters) {
      const notCircle = new Path2D();
      notCircle.rect(g.x - 200, g.y - 200, 400, 400);
      notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.clip(notCircle, 'evenodd');
    }
  }

  ctx.translate(g.x, g.y);
  ctx.rotate(rad);

  ctx.fillStyle = '#475569';
  ctx.fillRect(-halfL, -halfT, g.length, g.thickness);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-halfL, -halfT, g.length, g.thickness);

  ctx.fillStyle = '#facc15';
  for (let i = -halfL + 6; i < halfL - 6; i += 16) {
    ctx.fillRect(i, -halfT + 2, 6, g.thickness - 4);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(-halfL + 4, 0, 1.5, 0, Math.PI * 2);
  ctx.arc(halfL - 4, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

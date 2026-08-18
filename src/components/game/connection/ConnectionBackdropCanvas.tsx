import React, { useEffect, useRef } from 'react';

const drawRoundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 4
) => {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + w - radius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + radius);
  c.lineTo(x + w, y + h - radius);
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  c.lineTo(x + radius, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
};

const drawSafeEllipse = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number = 0,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2
) => {
  const safeRx = Math.max(0.1, Math.abs(rx));
  const safeRy = Math.max(0.1, Math.abs(ry));
  c.beginPath();
  c.ellipse(x, y, safeRx, safeRy, rot, startAngle, endAngle);
};

const drawSlug = (
  c: CanvasRenderingContext2D,
  scale: number,
  skinColor: string = '#ec4899',
  bellyColor: string = '#f472b6',
  eyeOffset: { x: number; y: number } = { x: 0, y: 0 },
  isBlinking: boolean = false
) => {
  c.save();
  c.scale(scale, scale);

  // Body drop shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawSafeEllipse(c, 0, 18, 28, 7);
  c.fill();

  // Main Fleshy Slug Body Gradient
  const bodyGrad = c.createRadialGradient(-4, -4, 4, 0, 6, 28);
  bodyGrad.addColorStop(0, '#fbcfe8');
  bodyGrad.addColorStop(0.45, skinColor);
  bodyGrad.addColorStop(1, '#831843');

  c.fillStyle = bodyGrad;
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-24, 16);
  c.quadraticCurveTo(-28, 4, -14, -10);
  c.quadraticCurveTo(-2, -24, 16, -14);
  c.quadraticCurveTo(28, 2, 24, 16);
  c.quadraticCurveTo(0, 22, -24, 16);
  c.closePath();
  c.fill();
  c.stroke();

  // Belly soft highlight
  c.fillStyle = bellyColor;
  drawSafeEllipse(c, 0, 10, 15, 6, -0.1);
  c.fill();

  // Body Segment creases
  c.strokeStyle = 'rgba(131, 24, 67, 0.6)';
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(-6, 8, 8, -Math.PI * 0.4, Math.PI * 0.2);
  c.moveTo(6, 6);
  c.arc(6, 6, 8, -Math.PI * 0.3, Math.PI * 0.2);
  c.stroke();

  // Eyestalks
  c.strokeStyle = skinColor;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(2, -10);
  c.lineTo(4, -18);
  c.moveTo(12, -8);
  c.lineTo(15, -16);
  c.stroke();

  // Big Expressive Cartoon Eyes
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.2;

  // Left Eye
  c.beginPath();
  c.arc(4, -18, 8.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Right Eye
  c.beginPath();
  c.arc(16, -16, 7.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  if (!isBlinking) {
    // Pupils
    c.fillStyle = '#09090b';
    c.beginPath();
    c.arc(5 + eyeOffset.x, -18 + eyeOffset.y, 3.4, 0, Math.PI * 2);
    c.arc(16 + eyeOffset.x, -16 + eyeOffset.y, 3, 0, Math.PI * 2);
    c.fill();

    // Eye Light Glints
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(4 + eyeOffset.x, -20 + eyeOffset.y, 1.4, 0, Math.PI * 2);
    c.arc(15 + eyeOffset.x, -18 + eyeOffset.y, 1.2, 0, Math.PI * 2);
    c.fill();
  } else {
    // Blinking slits
    c.strokeStyle = '#18181b';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-2, -18);
    c.lineTo(10, -18);
    c.moveTo(11, -16);
    c.lineTo(21, -16);
    c.stroke();
  }

  // Smirk / Smile
  c.strokeStyle = '#831843';
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(10, -1, 6, 0.2, Math.PI * 0.7);
  c.stroke();

  c.restore();
};

const drawRockyLedge = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  c.save();
  c.translate(x, y);

  // Rock Body
  c.fillStyle = '#27272a';
  c.strokeStyle = '#18181b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.quadraticCurveTo(-w / 2 - 10, h * 0.5, -w * 0.2, h);
  c.quadraticCurveTo(0, h + 15, w * 0.2, h);
  c.quadraticCurveTo(w / 2 + 10, h * 0.5, w / 2, 0);
  c.closePath();
  c.fill();
  c.stroke();

  // Top Lush Grass Layer
  c.fillStyle = '#15803d';
  drawRoundRect(c, -w / 2 - 4, -4, w + 8, 12, 6);
  c.fill();
  c.fillStyle = '#22c55e';
  drawRoundRect(c, -w / 2 - 2, -4, w + 4, 6, 3);
  c.fill();

  // Grass fringe details
  c.strokeStyle = '#4ade80';
  c.lineWidth = 2.5;
  c.beginPath();
  for (let gx = -w / 2 + 8; gx <= w / 2 - 8; gx += 12) {
    c.moveTo(gx, 4);
    c.lineTo(gx + 2, 9);
  }
  c.stroke();

  c.restore();
};

export const ConnectionBackdropCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const clouds = Array.from({ length: 6 }, () => ({
      x: Math.random() * width,
      y: 40 + Math.random() * (height * 0.35),
      speed: 0.15 + Math.random() * 0.3,
      size: 45 + Math.random() * 60,
      opacity: 0.12 + Math.random() * 0.2,
    }));

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: Math.random() * 2 + 0.8,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    const sheep = {
      x: -100,
      y: 110,
      speed: 2.2,
    };

    const smokePuffs: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
    let t = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.03;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#09090b');
        sky.addColorStop(0.35, '#1e1035');
        sky.addColorStop(0.75, '#2e1065');
        sky.addColorStop(1, '#09090b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars
        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Clouds
        for (const cloud of clouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Distant Bottom Hills
        ctx.fillStyle = 'rgba(20, 20, 28, 0.95)';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 20) {
          const hillY = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.lineTo(x, hillY);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        // Grass Edge Accents on bottom hills (Green Dotted Grass Blades)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -10; x <= width + 20; x += 14) {
          const y = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.moveTo(x, y);
          ctx.lineTo(x + 2, y - 4.5);
        }
        ctx.stroke();

        // 5. Flying Super Sheep with Fluttering Red Cape 🐑💨
        sheep.x += sheep.speed;
        if (sheep.x > width + 120) sheep.x = -100;
        const sheepY = sheep.y + Math.sin(t * 3) * 10;

        ctx.save();
        ctx.translate(sheep.x, sheepY);

        // Fluttering Red Cape
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-44 + Math.sin(t * 8) * 6, -10 + Math.cos(t * 7) * 4);
        ctx.lineTo(-40 + Math.sin(t * 8) * 6, 8 + Math.sin(t * 7) * 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fluffy White Sheep Body
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-8, 0, 12, 0, Math.PI * 2);
        ctx.arc(4, -2, 11, 0, Math.PI * 2);
        ctx.arc(14, 0, 10, 0, Math.PI * 2);
        ctx.arc(4, 8, 9, 0, Math.PI * 2);
        ctx.arc(-6, 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sheep Face
        ctx.fillStyle = '#1e293b';
        drawSafeEllipse(ctx, 18, 2, 7, 5, 0.2);
        ctx.fill();
        // Sheep Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(17, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(18, 0, 1, 0, Math.PI * 2);
        ctx.fill();

        // Speed Wind Streaks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-48, 0);
        ctx.lineTo(-65, 0);
        ctx.moveTo(-42, -10);
        ctx.lineTo(-58, -10);
        ctx.stroke();
        ctx.restore();

        // 6. TOP LEFT: AIRBORNE PARATROOPER SLUG 🪂
        const paraX = Math.max(90, Math.min(width * 0.16, 260));
        const paraY = Math.max(120, height * 0.22) + Math.sin(t * 1.5) * 15;
        const paraAngle = Math.sin(t * 1.5) * 0.15;

        ctx.save();
        ctx.translate(paraX, paraY);
        ctx.rotate(paraAngle);

        // Parachute Dome
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -50, 40, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, -50, 22, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Suspension Ropes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-38, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(-18, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(18, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(38, -50);
        ctx.lineTo(0, -8);
        ctx.stroke();

        // Hanging Paratrooper Slug
        drawSlug(ctx, 0.85, '#ec4899', '#f472b6', { x: 1, y: 1 }, false);
        ctx.restore();

        // 7. TOP RIGHT: HOVERING COMBAT HELICOPTER SLUG 🚁
        const chopX = Math.max(width - 260, width * 0.84);
        const chopY = Math.max(110, height * 0.2) + Math.sin(t * 2) * 10;
        const rotorAngle = t * 14;

        ctx.save();
        ctx.translate(chopX, chopY);

        // Spinning Rotor Blades
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3.5;
        drawSafeEllipse(ctx, 0, -26, 44 * Math.abs(Math.cos(rotorAngle)), 4);
        ctx.stroke();

        // Chopper Body
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawRoundRect(ctx, -26, -16, 52, 28, 12);
        ctx.fill();
        ctx.stroke();

        // Glass Dome Cockpit
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(12, -2, 13, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.stroke();

        // Tail Boom & Rotor
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-26, -2);
        ctx.lineTo(-52, -12);
        ctx.stroke();
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, -52, -12, 4, 14 * Math.abs(Math.sin(rotorAngle * 2)));
        ctx.stroke();

        // Pilot Slug
        ctx.save();
        ctx.translate(8, 3);
        drawSlug(ctx, 0.55, '#ec4899', '#f472b6', { x: 1, y: 0 }, false);
        // Aviator Glasses
        ctx.fillStyle = '#09090b';
        ctx.fillRect(2, -11, 10, 5);
        ctx.restore();

        ctx.restore();

        // 8. LEFT FLANKING PLATFORM & VETERAN BAZOOKA SLUG 🪖🚀
        const leftLedgeX = Math.max(120, Math.min(width * 0.16, 280));
        const leftLedgeY = Math.max(380, height * 0.58);

        // Draw Rocky Ledge Platform
        drawRockyLedge(ctx, leftLedgeX, leftLedgeY + 22, 160, 80);

        // Draw Veteran Bazooka Slug on Ledge
        ctx.save();
        ctx.translate(leftLedgeX, leftLedgeY);

        const isLeftBlink = Math.sin(t * 1.7) > 0.95;
        drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 }, isLeftBlink);

        // Authentic Military Corporal Peaked Cap
        ctx.save();
        ctx.scale(1.35, 1.35);

        // 1. Cap Crown (Dôme vert militaire d'officier au-dessus des yeux)
        const capGrad = ctx.createLinearGradient(4, -37, 12, -25);
        capGrad.addColorStop(0, '#4d7c0f');
        capGrad.addColorStop(0.55, '#365314');
        capGrad.addColorStop(1, '#1a2e05');
        ctx.fillStyle = capGrad;
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        // Base line along top of brow (parfaitement au-dessus des yeux)
        ctx.moveTo(-3, -25.5);
        ctx.quadraticCurveTo(9, -27, 21, -23.5);
        // Front upward peak
        ctx.lineTo(22, -26.5);
        ctx.quadraticCurveTo(15, -38, 7, -37);
        // Back downward slope
        ctx.quadraticCurveTo(-1, -35, -3.5, -26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Leather Finished Base Rim
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-3, -25.5);
        ctx.quadraticCurveTo(9, -27, 21, -23.5);
        ctx.lineTo(21.2, -22.3);
        ctx.quadraticCurveTo(9, -25.8, -3.3, -24.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Golden Braid Cord
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-1.5, -26);
        ctx.quadraticCurveTo(9, -27.2, 20.5, -24);
        ctx.stroke();

        // 4. Subtle Glossy Visor (Visière profilée noire vers l'avant)
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(8, -25.5);
        ctx.quadraticCurveTo(17, -26.5, 25, -23.5);
        ctx.quadraticCurveTo(17, -24, 8, -24.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Golden Corporal Insignia
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(9, -32.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(9, -32.5, 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Heavy Metal Bazooka
        ctx.save();
        ctx.translate(16, -10);
        const bazAngle = -0.5 + Math.sin(t * 1.5) * 0.12;
        ctx.rotate(bazAngle);
        // Bazooka Barrel Tube
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawRoundRect(ctx, -10, -9, 54, 15, 4);
        ctx.fill();
        ctx.stroke();
        // Yellow Hazard Warning Stripes
        ctx.fillStyle = '#eab308';
        ctx.fillRect(20, -8, 5, 13);
        ctx.fillRect(30, -8, 5, 13);
        // Laser Sight Beam pointing towards center
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(44, -1);
        ctx.lineTo(260, -1);
        ctx.stroke();
        ctx.setLineDash([]);
        // Laser Red Dot
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(260, -1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // 9. RIGHT FLANKING PLATFORM & DYNAMITE SLUG 🏴‍☠️🧨
        const rightLedgeX = Math.max(width - 280, width * 0.84);
        const rightLedgeY = Math.max(380, height * 0.58);

        // Draw Rocky Ledge Platform
        drawRockyLedge(ctx, rightLedgeX, rightLedgeY + 22, 160, 80);

        // Draw Dynamite Slug on Ledge
        ctx.save();
        ctx.translate(rightLedgeX, rightLedgeY);
        ctx.scale(-1, 1); // Face towards center card

        const isRightBlink = Math.sin(t * 2.1) > 0.95;
        drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 }, isRightBlink);

        // Red Pirate Headband
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, 10, -22, 18, 6, 0.1);
        ctx.fill();
        ctx.stroke();
        // Headband knot tails fluttering
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.lineTo(-28 + Math.sin(t * 6) * 5, -28 + Math.cos(t * 5) * 4);
        ctx.lineTo(-24 + Math.sin(t * 6) * 5, -18 + Math.sin(t * 5) * 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3-Stick Dynamite Pack
        ctx.save();
        ctx.translate(22, -6);
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, -5, -14, 12, 26, 3);
        ctx.fill();
        ctx.stroke();
        drawRoundRect(ctx, 5, -16, 12, 26, 3);
        ctx.fill();
        ctx.stroke();
        // Yellow TNT Strap
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -4, 22, 7);

        // Burning Fuse
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(10, -16);
        ctx.quadraticCurveTo(18, -26, 25, -24);
        ctx.stroke();

        // Sparkling Flame Tip
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(25, -24, 3.5 + Math.sin(t * 18) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(25, -24, 7 + Math.sin(t * 18) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Smoke particles from fuse
        if (Math.random() < 0.35) {
          smokePuffs.push({
            x: rightLedgeX - 25,
            y: rightLedgeY - 30,
            vx: -(Math.random() * 0.5 + 0.2),
            vy: -(Math.random() * 0.9 + 0.6),
            life: 1,
            size: 4 + Math.random() * 3,
          });
        }
        ctx.restore();

        ctx.restore();

        // 10. Update & Render Smoke Puffs
        for (let i = smokePuffs.length - 1; i >= 0; i--) {
          const p = smokePuffs[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.025;
          p.size += 0.25;
          if (p.life <= 0) {
            smokePuffs.splice(i, 1);
          } else {
            ctx.fillStyle = `rgba(212, 212, 216, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } catch (err) {
        console.error('Backdrop canvas render loop error:', err);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />;
};

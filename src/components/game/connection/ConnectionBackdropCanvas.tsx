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

  c.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawSafeEllipse(c, 0, 18, 28, 7);
  c.fill();

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

  c.fillStyle = bellyColor;
  drawSafeEllipse(c, 0, 10, 15, 6, -0.1);
  c.fill();

  c.strokeStyle = skinColor;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(2, -10);
  c.lineTo(4, -18);
  c.moveTo(12, -8);
  c.lineTo(15, -16);
  c.stroke();

  c.fillStyle = '#ffffff';
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(4, -18, 8.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  c.beginPath();
  c.arc(16, -16, 7.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  if (!isBlinking) {
    c.fillStyle = '#09090b';
    c.beginPath();
    c.arc(5 + eyeOffset.x, -18 + eyeOffset.y, 3.4, 0, Math.PI * 2);
    c.arc(16 + eyeOffset.x, -16 + eyeOffset.y, 3, 0, Math.PI * 2);
    c.fill();
  }

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

  c.fillStyle = '#15803d';
  drawRoundRect(c, -w / 2 - 4, -4, w + 8, 12, 6);
  c.fill();
  c.fillStyle = '#22c55e';
  drawRoundRect(c, -w / 2 - 2, -4, w + 4, 6, 3);
  c.fill();

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

    const sheep = { x: -100, y: 110, speed: 2.2 };
    const smokePuffs: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
    let t = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.03;

      try {
        ctx.clearRect(0, 0, width, height);

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#09090b');
        sky.addColorStop(0.35, '#1e1035');
        sky.addColorStop(0.75, '#2e1065');
        sky.addColorStop(1, '#09090b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const cloud of clouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.fill();
        }

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

        // Flying Super Sheep
        sheep.x += sheep.speed;
        if (sheep.x > width + 120) sheep.x = -100;
        const sheepY = sheep.y + Math.sin(t * 3) * 10;

        ctx.save();
        ctx.translate(sheep.x, sheepY);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-30, -6, 20, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Left Ledge & Slug
        const leftLedgeX = Math.max(120, Math.min(width * 0.16, 280));
        const leftLedgeY = Math.max(380, height * 0.58);
        drawRockyLedge(ctx, leftLedgeX, leftLedgeY + 22, 160, 80);
        ctx.save();
        ctx.translate(leftLedgeX, leftLedgeY);
        drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 });
        ctx.restore();

        // Right Ledge & Slug
        const rightLedgeX = Math.max(width - 280, width * 0.84);
        const rightLedgeY = Math.max(380, height * 0.58);
        drawRockyLedge(ctx, rightLedgeX, rightLedgeY + 22, 160, 80);
        ctx.save();
        ctx.translate(rightLedgeX, rightLedgeY);
        ctx.scale(-1, 1);
        drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 });
        ctx.restore();
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

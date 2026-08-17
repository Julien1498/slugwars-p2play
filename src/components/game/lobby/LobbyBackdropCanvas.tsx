import React, { useRef, useEffect } from 'react';

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

export const LobbyBackdropCanvas: React.FC = () => {
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

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65),
      size: Math.random() * 2 + 0.6,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    const nebulaClouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: 30 + Math.random() * (height * 0.35),
      speed: 0.1 + Math.random() * 0.2,
      size: 55 + Math.random() * 65,
      opacity: 0.12 + Math.random() * 0.15,
    }));

    interface Flare {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      trail: { x: number; y: number; alpha: number }[];
    }
    const flares: Flare[] = [];

    let t = 0;

    const drawTacticalSlug = (
      c: CanvasRenderingContext2D,
      scale: number,
      gear: 'NIGHT_VISION' | 'RADIO_COMM',
      facingRight: boolean = true
    ) => {
      c.save();
      c.scale(facingRight ? scale : -scale, scale);

      c.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawSafeEllipse(c, 0, 16, 22, 6);
      c.fill();

      const bodyGrad = c.createRadialGradient(-3, -3, 3, 0, 5, 24);
      bodyGrad.addColorStop(0, '#fbcfe8');
      bodyGrad.addColorStop(0.45, '#ec4899');
      bodyGrad.addColorStop(1, '#831843');

      c.fillStyle = bodyGrad;
      c.strokeStyle = '#18181b';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-20, 14);
      c.quadraticCurveTo(-24, 2, -12, -8);
      c.quadraticCurveTo(-2, -20, 14, -12);
      c.quadraticCurveTo(24, 2, 20, 14);
      c.quadraticCurveTo(0, 19, -20, 14);
      c.closePath();
      c.fill();
      c.stroke();

      c.strokeStyle = '#ec4899';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(2, -8);
      c.lineTo(3, -15);
      c.moveTo(11, -6);
      c.lineTo(13, -13);
      c.stroke();

      c.fillStyle = '#ffffff';
      c.strokeStyle = '#18181b';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(3, -15, 7, 0, Math.PI * 2);
      c.arc(13, -13, 6, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      const pupilShift = Math.sin(t * 1.8) * 1.8;
      c.fillStyle = '#09090b';
      c.beginPath();
      c.arc(4 + pupilShift, -15, 2.8, 0, Math.PI * 2);
      c.arc(14 + pupilShift, -13, 2.4, 0, Math.PI * 2);
      c.fill();

      if (gear === 'NIGHT_VISION') {
        c.fillStyle = '#1e293b';
        c.strokeStyle = '#18181b';
        c.lineWidth = 2;
        drawRoundRect(c, -3, -19, 11, 9, 3);
        c.fill();
        c.stroke();
        drawRoundRect(c, 8, -17, 10, 8, 3);
        c.fill();
        c.stroke();

        c.fillStyle = '#10b981';
        c.beginPath();
        c.arc(2.5, -14.5, 3, 0, Math.PI * 2);
        c.arc(13, -13, 2.6, 0, Math.PI * 2);
        c.fill();
      } else if (gear === 'RADIO_COMM') {
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(8, -14, 12, -Math.PI * 0.7, -Math.PI * 0.1);
        c.stroke();

        c.strokeStyle = '#e4e4e7';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-10, 4);
        c.lineTo(-24, -28);
        c.stroke();

        c.fillStyle = Math.sin(t * 7) > 0 ? '#ef4444' : '#991b1b';
        c.beginPath();
        c.arc(-24, -28, 3.8, 0, Math.PI * 2);
        c.fill();
      }

      c.restore();
    };

    const drawFortifiedBastion = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      title: string,
      accentColor: string
    ) => {
      c.save();
      c.translate(x, y);

      c.fillStyle = '#1e1e24';
      c.strokeStyle = '#09090b';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-w / 2, 0);
      c.lineTo(-w / 2 - 12, h);
      c.lineTo(w / 2 + 12, h);
      c.lineTo(w / 2, 0);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = accentColor;
      drawRoundRect(c, -w * 0.25, 18, w * 0.5, 6, 2);
      c.fill();

      c.fillStyle = '#15803d';
      drawRoundRect(c, -w / 2 - 6, -6, w + 12, 12, 5);
      c.fill();
      c.fillStyle = '#22c55e';
      drawRoundRect(c, -w / 2 - 4, -6, w + 8, 6, 3);
      c.fill();

      c.fillStyle = 'rgba(0, 0, 0, 0.85)';
      drawRoundRect(c, -38, h - 10, 76, 15, 4);
      c.fill();
      c.fillStyle = '#a1a1aa';
      c.font = 'bold 9px monospace';
      c.textAlign = 'center';
      c.fillText(title, 0, h + 1);

      c.restore();
    };

    const renderBackdrop = () => {
      animId = requestAnimationFrame(renderBackdrop);
      t += 0.025;

      try {
        ctx.clearRect(0, 0, width, height);

        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#06060c');
        sky.addColorStop(0.35, '#120924');
        sky.addColorStop(0.7, '#240e46');
        sky.addColorStop(1, '#09090f');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(192, 132, 252, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const cloud of nebulaClouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(15, 12, 28, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 25) {
          const my = height * 0.7 + Math.sin(x * 0.003 + 0.5) * 55;
          ctx.lineTo(x, my);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0f0f17';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 20) {
          const by = height * 0.85 + Math.sin(x * 0.004 + 2.1) * 35;
          ctx.lineTo(x, by);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        const leftBastionX = Math.max(90, Math.min(width * 0.12, 220));
        const leftBastionY = Math.max(260, height * 0.52);
        drawFortifiedBastion(ctx, leftBastionX, leftBastionY + 20, 150, 95, 'POSTE OBSERV.', '#10b981');

        ctx.save();
        ctx.translate(leftBastionX - 15, leftBastionY);
        drawTacticalSlug(ctx, 1.25, 'NIGHT_VISION', true);
        ctx.restore();

        const rightBastionX = Math.max(width - 220, width * 0.88);
        const rightBastionY = Math.max(260, height * 0.52);
        drawFortifiedBastion(ctx, rightBastionX, rightBastionY + 20, 150, 95, 'TRANSMISSIONS', '#38bdf8');

        ctx.save();
        ctx.translate(rightBastionX + 15, rightBastionY);
        drawTacticalSlug(ctx, 1.25, 'RADIO_COMM', false);
        ctx.restore();

        for (let i = flares.length - 1; i >= 0; i--) {
          const f = flares[i];
          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.12;
          f.life -= 0.014;
          if (f.life <= 0 || f.y > height) flares.splice(i, 1);
        }
      } catch (err) {
        console.error('Lobby backdrop render error:', err);
      }
    };

    renderBackdrop();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none w-full h-full z-0" />;
};

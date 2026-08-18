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
        // 1. Left/Rear Tactical Earcup (oreillette gauche à l'extérieur de l'œil gauche)
        c.fillStyle = '#0f172a';
        c.strokeStyle = '#18181b';
        c.lineWidth = 1.4;
        drawSafeEllipse(c, -3, -15, 3.5, 6.5, 0.1);
        c.fill();
        c.stroke();
        c.fillStyle = '#38bdf8';
        drawSafeEllipse(c, -3, -15, 1.8, 3.8, 0.1);
        c.fill();

        // 2. Tactical Headband Arch (arceau passant au-dessus des pédoncules oculaires)
        c.strokeStyle = '#0f172a';
        c.lineWidth = 3.8;
        c.beginPath();
        c.moveTo(-3, -17);
        c.quadraticCurveTo(7, -26, 18, -15);
        c.stroke();

        c.strokeStyle = '#38bdf8';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(-2, -18);
        c.quadraticCurveTo(7, -25, 17, -16);
        c.stroke();

        // 3. Right/Front Tactical Earcup (oreillette droite à l'extérieur de l'œil droit)
        c.fillStyle = '#0f172a';
        c.strokeStyle = '#18181b';
        c.lineWidth = 1.4;
        drawSafeEllipse(c, 18, -13, 3.5, 6.5, 0.1);
        c.fill();
        c.stroke();
        c.fillStyle = '#38bdf8';
        drawSafeEllipse(c, 18, -13, 1.8, 3.8, 0.1);
        c.fill();

        // 4. Flexible Boom Microphone (micro-tige délicat orienté vers la bouche)
        c.strokeStyle = '#64748b';
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(18, -10);
        c.quadraticCurveTo(20, -3, 13, 0);
        c.stroke();

        // Foam Mic Windscreen
        c.fillStyle = '#09090b';
        c.strokeStyle = '#18181b';
        c.lineWidth = 1.0;
        c.beginPath();
        c.arc(13, 0, 2.0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 5. Tactical Antenna with Flashing Radio LED
        c.strokeStyle = '#94a3b8';
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-3, -18);
        c.lineTo(-14, -36);
        c.stroke();

        c.fillStyle = Math.sin(t * 7) > 0 ? '#ef4444' : '#7f1d1d';
        c.beginPath();
        c.arc(-14, -36, 2.8, 0, Math.PI * 2);
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

      // Heavy Concrete Bunker Base with armored bevels
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

      // Concrete Wall Armor Panel Seams & Rivets
      c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-w / 2 + 15, 12);
      c.lineTo(-w / 2 + 5, h - 10);
      c.moveTo(w / 2 - 15, 12);
      c.lineTo(w / 2 - 5, h - 10);
      c.stroke();

      // Steel Rivets
      c.fillStyle = '#71717a';
      for (let r = 0; r < 4; r++) {
        const ry = 18 + r * 18;
        c.beginPath();
        c.arc(-w / 2 + 8, ry, 1.8, 0, Math.PI * 2);
        c.arc(w / 2 - 8, ry, 1.8, 0, Math.PI * 2);
        c.fill();
      }

      // Glowing Slit Observation / Radar Window with Pulsing Screen
      c.fillStyle = accentColor;
      c.shadowColor = accentColor;
      c.shadowBlur = 10;
      drawRoundRect(c, -w * 0.28, 16, w * 0.56, 8, 2);
      c.fill();
      c.shadowBlur = 0;

      // Interior Radar Waveform / Scope Glint inside Window
      c.fillStyle = '#ffffff';
      c.fillRect(-w * 0.15 + Math.sin(t * 4) * w * 0.1, 18, 4, 4);

      // Flashing Alert Indicator LEDs on Bunker Wall
      const ledBlink = Math.sin(t * 6) > 0;
      c.fillStyle = ledBlink ? '#ef4444' : '#7f1d1d';
      c.beginPath();
      c.arc(-w * 0.35, 10, 2.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = ledBlink ? '#22c55e' : '#14532d';
      c.beginPath();
      c.arc(-w * 0.35 + 8, 10, 2.5, 0, Math.PI * 2);
      c.fill();

      // Platform Top Deck (Grass / Camo Grid)
      c.fillStyle = '#15803d';
      drawRoundRect(c, -w / 2 - 6, -6, w + 12, 12, 5);
      c.fill();
      c.fillStyle = '#22c55e';
      drawRoundRect(c, -w / 2 - 4, -6, w + 8, 6, 3);
      c.fill();

      // Barbed Wire Protection Strand along Platform Edge
      c.strokeStyle = '#a1a1aa';
      c.lineWidth = 1.2;
      c.beginPath();
      for (let bx = -w / 2 - 4; bx <= w / 2 + 4; bx += 10) {
        c.moveTo(bx, -6);
        c.lineTo(bx + 5, -11);
        c.lineTo(bx + 10, -6);
      }
      c.stroke();

      // Heavy Metal Nameplate with Glowing Tactical Border
      c.fillStyle = 'rgba(0, 0, 0, 0.85)';
      c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      c.lineWidth = 1;
      drawRoundRect(c, -44, h - 14, 88, 18, 4);
      c.fill();
      c.stroke();

      c.fillStyle = '#e4e4e7';
      c.font = 'bold 10px monospace';
      c.textAlign = 'center';
      c.fillText(title, 0, h - 1);

      c.restore();
    };

    const renderBackdrop = () => {
      animId = requestAnimationFrame(renderBackdrop);
      t += 0.025;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#06060c');
        sky.addColorStop(0.35, '#120924');
        sky.addColorStop(0.7, '#240e46');
        sky.addColorStop(1, '#09090f');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars
        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(192, 132, 252, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Clouds
        for (const cloud of nebulaClouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Distant Mountain Silhouette Ridges
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

        // Foreground Fortified Bunker Hills
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

        // Green Dotted Grass Blade Dashes
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -10; x <= width + 20; x += 14) {
          const by = height * 0.85 + Math.sin(x * 0.004 + 2.1) * 35;
          ctx.moveTo(x, by);
          ctx.lineTo(x + 2, by - 4.5);
        }
        ctx.stroke();

        // 5. LEFT FLANKING FORTIFIED BASTION & SENTRY SLUG
        const leftBastionX = Math.max(90, Math.min(width * 0.12, 220));
        const leftBastionY = Math.max(260, height * 0.52);

        drawFortifiedBastion(ctx, leftBastionX, leftBastionY + 20, 150, 95, 'POSTE OBSERV.', '#10b981');

        ctx.save();
        ctx.translate(leftBastionX - 15, leftBastionY);
        drawTacticalSlug(ctx, 1.25, 'NIGHT_VISION', true);
        ctx.restore();

        // Searchlight Mounted on Left Watchtower
        const searchlightX = leftBastionX + 35;
        const searchlightY = leftBastionY - 14;
        const sweepAngle = -Math.PI * 0.35 + Math.sin(t * 0.9) * 0.55;

        // Solid Mechanical Support Mast & Mounting Bracket down to Bunker Deck
        ctx.save();
        ctx.translate(searchlightX, searchlightY);

        // 1. Heavy Steel Lattice Mast & Base Platform
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Left & Right Support Legs extending down to bunker roof (+28px)
        ctx.moveTo(-7, 28);
        ctx.lineTo(-4, 4);
        ctx.moveTo(7, 28);
        ctx.lineTo(4, 4);
        // Cross-bracing struts
        ctx.moveTo(-6, 22);
        ctx.lineTo(5, 12);
        ctx.moveTo(6, 22);
        ctx.lineTo(-5, 12);
        ctx.stroke();

        // 2. Bolted Concrete Base Collar on Roof
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, -10, 24, 20, 6, 2);
        ctx.fill();
        ctx.stroke();

        // 3. Swiveling Turret Yoke Bracket
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 4, 5, 0, Math.PI);
        ctx.fill();
        ctx.stroke();

        // 4. Searchlight Housing Sphere
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pivot Hub Bolt
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Volumetric Beam
        ctx.rotate(sweepAngle);
        const beamGrad = ctx.createRadialGradient(0, 0, 5, 0, -height * 0.85, height * 0.65);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
        beamGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.22)');
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-80, -height * 0.85);
        ctx.lineTo(80, -height * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 6. RIGHT FLANKING COMMUNICATIONS OUTPOST & RADIO OPERATOR SLUG
        const rightBastionX = Math.max(width - 220, width * 0.88);
        const rightBastionY = Math.max(260, height * 0.52);

        drawFortifiedBastion(ctx, rightBastionX, rightBastionY + 20, 150, 95, 'TRANSMISSIONS', '#38bdf8');

        ctx.save();
        ctx.translate(rightBastionX + 15, rightBastionY);
        drawTacticalSlug(ctx, 1.25, 'RADIO_COMM', false);
        ctx.restore();

        // Spinning Tactical Radar Dish on Right Outpost
        const radarX = rightBastionX - 35;
        const radarY = rightBastionY - 14;
        const radarAngle = t * 3;

        ctx.save();
        ctx.translate(radarX, radarY);

        // 1. Reinforced Communication Tripod Legs extending down to Bunker Deck (+28px)
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-10, 28);
        ctx.lineTo(0, 0);
        ctx.lineTo(10, 28);
        // Horizontal stabilization ring
        ctx.moveTo(-6, 16);
        ctx.lineTo(6, 16);
        ctx.stroke();

        // 2. Bolted Anchor Base Pads
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, -12, 24, 24, 6, 2);
        ctx.fill();
        ctx.stroke();

        // 3. Rotating Motor Gearbox
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(-4, -2, 8, 6);

        // Pulsing Blue Data Link LED
        ctx.fillStyle = Math.sin(t * 8) > 0 ? '#38bdf8' : '#0369a1';
        ctx.beginPath();
        ctx.arc(0, 1, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 4. Rotating Dish Ellipse
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawSafeEllipse(ctx, 0, -4, 14 * Math.abs(Math.cos(radarAngle)), 14);
        ctx.fill();
        ctx.stroke();

        // Center Spike
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 7. TOP SKY: TACTICAL RECON SURVEILLANCE DRONE 🛸
        const droneX = Math.max(100, Math.min(width * 0.18, 280)) + Math.sin(t * 1.2) * 20;
        const droneY = Math.max(80, height * 0.15) + Math.cos(t * 1.5) * 10;

        ctx.save();
        ctx.translate(droneX, droneY);
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, -14, -8, 28, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        const rotorSpin = t * 25;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-26, -4);
        ctx.stroke();
        drawSafeEllipse(ctx, -26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(26, -4);
        ctx.stroke();
        drawSafeEllipse(ctx, 26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(Math.sin(t * 3) * 30, 160);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 8. Artillery Tracer Flares
        if (Math.random() < 0.018 && flares.length < 3) {
          flares.push({
            x: Math.random() < 0.5 ? -20 : width + 20,
            y: height * 0.4 + Math.random() * (height * 0.2),
            vx: (Math.random() * 4 + 3) * (Math.random() < 0.5 ? 1 : -1),
            vy: -(Math.random() * 5 + 4),
            life: 1,
            color: Math.random() < 0.5 ? '#f59e0b' : '#ec4899',
            trail: [],
          });
        }

        for (let i = flares.length - 1; i >= 0; i--) {
          const f = flares[i];
          f.trail.push({ x: f.x, y: f.y, alpha: 0.8 });
          if (f.trail.length > 12) f.trail.shift();

          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.12;
          f.life -= 0.014;

          for (let j = 0; j < f.trail.length; j++) {
            const tr = f.trail[j];
            ctx.fillStyle = `${f.color}${Math.floor((j / f.trail.length) * 180).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, (j / f.trail.length) * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
          ctx.fill();

          if (f.life <= 0 || f.y > height) {
            flares.splice(i, 1);
          }
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

import React, { useState, useEffect, useRef } from 'react';
import { extractRoomCodeFromUrl, subscribeRoomUrlChanges, clearRoomUrlFromAddressBar } from 'p2play-core';
import { loadProfile, saveProfile } from '../../core/profile';
import { Sparkles, Swords, Zap, Rocket, LogIn, PlusCircle, AlertCircle } from 'lucide-react';

interface SlugWarsConnectionScreenProps {
  status: string;
  error?: string | null;
  isConnecting?: boolean;
  onHost: (username: string, avatar: string) => void;
  onJoin: (username: string, avatar: string, roomCode: string) => void;
}

// Solid standard cross-platform emojis that render reliably on all OS/browsers
const AVATARS = ['🐌', '🤠', '🤖', '🧙', '👑', '🐑', '🎯', '💣', '🚀'];

export const SlugWarsConnectionScreen: React.FC<SlugWarsConnectionScreenProps> = ({
  status,
  error,
  isConnecting,
  onHost,
  onJoin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initialCode = extractRoomCodeFromUrl() || '';
  const savedProfile = loadProfile();
  const [username, setUsername] = useState(() => {
    return savedProfile?.username || ('Limace_' + Math.floor(100 + Math.random() * 900));
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return savedProfile?.avatar || '🐌';
  });
  const [invitationCode, setInvitationCode] = useState<string>(initialCode);
  const [roomCode, setRoomCode] = useState<string>(initialCode);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Subscribe to external address bar changes (e.g. user pasting link or clicking invite)
  useEffect(() => {
    return subscribeRoomUrlChanges((code) => {
      if (code) {
        setInvitationCode(code);
        setRoomCode(code);
      }
    });
  }, []);

  // Dynamic High-Quality Vector Canvas Backdrop
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

    // Flying Super Sheep
    const sheep = {
      x: -100,
      y: 110,
      speed: 2.2,
    };

    // Smoke particles for dynamite & chopper
    const smokePuffs: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];

    let t = 0;

    // --- HELPER: SAFE ROUNDED RECTANGLE (Cross-browser guarantee) ---
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

    // --- HELPER: SAFE ELLIPSE (Prevents negative radius crashes) ---
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

    // --- HELPER: DRAW DETAILED VECTOR SLUG BODY ---
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

    // --- HELPER: DRAW FLOATING ROCK CRAG / LEDGE ---
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
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 30) {
          const hillY = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.lineTo(x, hillY);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Grass Edge Accents on bottom hills
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 16) {
          const y = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.moveTo(x, y);
          ctx.lineTo(x + 2, y - 4);
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

        // Spinning Rotor Blades (Guaranteed non-negative radius)
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

        // Green Camo Helmet
        ctx.fillStyle = '#3f6212';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, 8, -24, 20, 11, 0.1, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Gold Helmet Star
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(8, -28, 3.5, 0, Math.PI * 2);
        ctx.fill();

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

  const handleHostClick = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setValidationError('Veuillez entrer un pseudo');
      return;
    }
    saveProfile({ username: trimmed, avatar: selectedAvatar });
    setValidationError(null);
    onHost(trimmed, selectedAvatar);
  };

  const handleJoinClick = () => {
    const trimmedUser = username.trim();
    const trimmedCode = roomCode.trim().toUpperCase();
    if (!trimmedUser) {
      setValidationError('Veuillez entrer un pseudo');
      return;
    }
    if (!trimmedCode) {
      setValidationError('Veuillez entrer un code de salon');
      return;
    }
    saveProfile({ username: trimmedUser, avatar: selectedAvatar });
    setValidationError(null);
    onJoin(trimmedUser, selectedAvatar, trimmedCode);
  };

  // Connecting Screen
  if (isConnecting) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />
        <div className="relative z-10 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/50 p-8 rounded-2xl text-center space-y-4 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="relative inline-block">
            <div className="text-6xl animate-bounce">🐌</div>
            <div className="absolute -top-1 -right-2 text-2xl animate-spin" style={{ animationDuration: '3s' }}>
              🎯
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-amber-300">
              Connexion en cours...
            </h2>
            <p className="text-xs text-zinc-400">Établissement du tunnel WebRTC P2P direct</p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 overflow-x-hidden selection:bg-violet-500 selection:text-white">
      {/* Background Animated HD Vector Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Foreground Container */}
      <div className="relative z-10 max-w-md w-full space-y-5 my-auto py-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-950/80 border border-violet-500/40 rounded-full text-xs font-bold text-violet-300 shadow-md backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Artillerie Tactique Multijoueur & Terrains Destructibles</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl md:text-5xl drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">🐌</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-violet-100 to-violet-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              SLUG WARS
            </h1>
            <span className="text-4xl md:text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">💣</span>
          </div>

          <p className="text-xs md:text-sm text-zinc-400 max-w-sm mx-auto font-medium">
            Formez vos escouades, armez vos bazookas et détruisez le terrain adverse !
          </p>
        </div>

        {/* Unified Clean Glass Card */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Error Banner */}
          {(error || validationError) && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Invitation Banner if Room Code was in URL */}
          {invitationCode && (
            <div className="p-3 bg-violet-950/90 border border-violet-500/60 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-lg">💌</span>
                <div>
                  <div className="text-zinc-400 text-[11px]">Invitation reçue pour la partie :</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">#{invitationCode}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInvitationCode('');
                  setRoomCode('');
                  clearRoomUrlFromAddressBar();
                }}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
              >
                Changer
              </button>
            </div>
          )}

          {/* Pseudo Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Votre Pseudo</label>
            <input
              type="text"
              maxLength={18}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: SuperSlug"
              className="w-full bg-zinc-950/80 border border-zinc-700/80 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-500 focus:outline-none transition"
            />
          </div>

          {/* Avatar Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Choisir un Avatar</label>
            <div className="flex items-center justify-between gap-1 p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-x-auto">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-8 h-8 flex items-center justify-center text-base rounded-lg transition ${
                    selectedAvatar === av
                      ? 'bg-violet-600 border border-violet-300 scale-110 shadow-md shadow-violet-950'
                      : 'hover:bg-zinc-800/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* If invited via link: Primary Join Button First */}
          {invitationCode ? (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 animate-pulse"
              >
                <LogIn className="w-4 h-4" />
                <span>Rejoindre la partie ({invitationCode})</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleHostClick}
                  className="text-xs font-semibold text-zinc-400 hover:text-violet-300 transition flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ou créer une nouvelle partie</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Standard Mode: Host Button */}
              <button
                type="button"
                onClick={handleHostClick}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Créer un salon</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-900 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest absolute">
                  OU
                </span>
              </div>

              {/* Join Form */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Rejoindre un salon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Code du salon..."
                    className="flex-1 bg-zinc-950/80 border border-zinc-700/80 focus:border-violet-500 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none transition uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleJoinClick}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 hover:border-zinc-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-violet-400" />
                    <span>Rejoindre</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" /> WebRTC Direct
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-violet-400" /> 18+ Armes & Véhicules
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Swords className="w-3 h-3 text-emerald-400" /> 2 à 6 Équipes
          </span>
        </div>
      </div>
    </div>
  );
};

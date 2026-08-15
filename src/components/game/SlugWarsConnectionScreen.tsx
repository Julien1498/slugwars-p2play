import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Swords, Zap, Rocket, LogIn, PlusCircle, AlertCircle } from 'lucide-react';

interface SlugWarsConnectionScreenProps {
  status: string;
  error?: string | null;
  isConnecting?: boolean;
  onHost: (username: string, avatar: string) => void;
  onJoin: (username: string, avatar: string, roomCode: string) => void;
}

const AVATARS = ['🐌', '🪖', '🏴‍☠️', '🤠', '🥷', '🤖', '🧙', '👑', '🐑'];

export const SlugWarsConnectionScreen: React.FC<SlugWarsConnectionScreenProps> = ({
  status,
  error,
  isConnecting,
  onHost,
  onJoin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [username, setUsername] = useState(() => {
    return 'Limace_' + Math.floor(100 + Math.random() * 900);
  });
  const [selectedAvatar, setSelectedAvatar] = useState('🐌');
  const [roomCode, setRoomCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

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

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: Math.random() * 2 + 0.8,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    // Floating Paratrooper Slug
    const paratrooper = {
      x: width * 0.25,
      y: -60,
      speedY: 0.65,
      driftAngle: 0,
    };

    // Flying Super Sheep
    const sheep = {
      x: -100,
      y: height * 0.2,
      speed: 2.2,
    };

    // Hovering Chopper Slug
    const chopper = {
      x: width * 0.82,
      y: height * 0.18,
      rotorAngle: 0,
    };

    // Smoke puffs for dynamite & chopper
    const smokePuffs: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];

    let t = 0;

    // --- HELPER: DRAW DETAILED VECTOR SLUG BODY ---
    const drawSlugBody = (
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
      c.fillStyle = 'rgba(0, 0, 0, 0.4)';
      c.beginPath();
      c.ellipse(0, 18, 26, 6, 0, 0, Math.PI * 2);
      c.fill();

      // Main Fleshy Slug Body
      const bodyGrad = c.createRadialGradient(-4, -4, 4, 0, 6, 26);
      bodyGrad.addColorStop(0, '#f9a8d4');
      bodyGrad.addColorStop(0.5, skinColor);
      bodyGrad.addColorStop(1, '#9d174d');

      c.fillStyle = bodyGrad;
      c.strokeStyle = '#18181b';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-22, 16);
      c.quadraticCurveTo(-26, 6, -14, -8);
      c.quadraticCurveTo(-2, -22, 14, -12);
      c.quadraticCurveTo(26, 2, 22, 16);
      c.quadraticCurveTo(0, 20, -22, 16);
      c.closePath();
      c.fill();
      c.stroke();

      // Belly soft highlight
      c.fillStyle = bellyColor;
      c.beginPath();
      c.ellipse(0, 10, 14, 5, -0.1, 0, Math.PI * 2);
      c.fill();

      // Body Segment creases
      c.strokeStyle = 'rgba(157, 23, 77, 0.5)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(-6, 8, 8, -Math.PI * 0.4, Math.PI * 0.2);
      c.moveTo(6, 6);
      c.arc(6, 6, 8, -Math.PI * 0.3, Math.PI * 0.2);
      c.stroke();

      // Big Expressive Cartoon Eyes
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#18181b';
      c.lineWidth = 2;

      // Left Eye
      c.beginPath();
      c.arc(4, -16, 7.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Right Eye
      c.beginPath();
      c.arc(15, -14, 6.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      if (!isBlinking) {
        // Pupils
        c.fillStyle = '#09090b';
        c.beginPath();
        c.arc(5 + eyeOffset.x, -16 + eyeOffset.y, 3, 0, Math.PI * 2);
        c.arc(15 + eyeOffset.x, -14 + eyeOffset.y, 2.6, 0, Math.PI * 2);
        c.fill();

        // Eye White Light Glint
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(4 + eyeOffset.x, -18 + eyeOffset.y, 1.2, 0, Math.PI * 2);
        c.arc(14 + eyeOffset.x, -16 + eyeOffset.y, 1, 0, Math.PI * 2);
        c.fill();
      } else {
        // Blinking eye slit
        c.strokeStyle = '#18181b';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-2, -16);
        c.lineTo(10, -16);
        c.moveTo(10, -14);
        c.lineTo(20, -14);
        c.stroke();
      }

      // Cute Smile / Smirk
      c.strokeStyle = '#831843';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(10, -2, 5, 0.2, Math.PI * 0.7);
      c.stroke();

      c.restore();
    };

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, width, height);

      // 1. Dusk / Violet Night Sky
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#09090b');
      sky.addColorStop(0.35, '#1e1035');
      sky.addColorStop(0.7, '#2e1065');
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

      // 4. Distant Layered Silhouetted Hills
      ctx.fillStyle = 'rgba(20, 20, 28, 0.95)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 30) {
        const hillY = height - 170 + Math.sin(x * 0.003 + 1.2) * 55 + Math.cos(x * 0.008) * 20;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Front Left Hill
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width * 0.45; x += 20) {
        const hillY = height - 100 + Math.sin(x * 0.006) * 45;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width * 0.45, height);
      ctx.closePath();
      ctx.fill();

      // Front Right Hill
      ctx.beginPath();
      ctx.moveTo(width * 0.55, height);
      for (let x = width * 0.55; x <= width; x += 20) {
        const hillY = height - 110 + Math.cos((x - width * 0.55) * 0.005) * 50;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Grass Edge Accents on Hills
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= width * 0.38; x += 12) {
        const y = height - 100 + Math.sin(x * 0.006) * 45;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y - 4);
      }
      for (let x = width * 0.62; x <= width; x += 12) {
        const y = height - 110 + Math.cos((x - width * 0.55) * 0.005) * 50;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y - 4);
      }
      ctx.stroke();

      // 5. Paratrooper Slug Drifting in Sky
      paratrooper.y += paratrooper.speedY;
      paratrooper.driftAngle = Math.sin(t * 1.5) * 0.2;
      paratrooper.x = width * 0.2 + Math.sin(t * 1.2) * 35;
      if (paratrooper.y > height + 80) paratrooper.y = -80;

      ctx.save();
      ctx.translate(paratrooper.x, paratrooper.y);
      ctx.rotate(paratrooper.driftAngle);

      // Parachute Canopy Dome
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -45, 34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(0, -45, 18, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Suspension Ropes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-32, -45);
      ctx.lineTo(0, -6);
      ctx.moveTo(-16, -45);
      ctx.lineTo(0, -6);
      ctx.moveTo(16, -45);
      ctx.lineTo(0, -6);
      ctx.moveTo(32, -45);
      ctx.lineTo(0, -6);
      ctx.stroke();

      // Hanging Slug
      drawSlugBody(ctx, 0.65, '#ec4899', '#f472b6', { x: 1, y: 1 }, false);
      ctx.restore();

      // 6. Flying Super Sheep with Fluttering Red Cape 🐑💨
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
      ctx.beginPath();
      ctx.ellipse(18, 2, 7, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Little Sheep Eye
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

      // 7. Hovering Helicopter Slug 🚁
      const chopperY = chopper.y + Math.sin(t * 2) * 8;
      chopper.rotorAngle += 0.55;

      ctx.save();
      ctx.translate(chopper.x, chopperY);

      // Spinning Rotor Blades
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -22, 36 * Math.cos(chopper.rotorAngle), 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Chopper Fuselage (Olive Green / Metal)
      ctx.fillStyle = '#3f3f46';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -14, 44, 24, 10);
      ctx.fill();
      ctx.stroke();

      // Glass Cockpit
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(10, -3, 11, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.stroke();

      // Tail Boom & Rotor
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-22, -2);
      ctx.lineTo(-44, -10);
      ctx.stroke();
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-44, -10, 4, 12 * Math.sin(chopper.rotorAngle * 2), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pilot Slug inside Cockpit
      ctx.save();
      ctx.translate(6, 2);
      drawSlugBody(ctx, 0.45, '#ec4899', '#f472b6', { x: 1, y: 0 }, false);
      // Aviator Goggles
      ctx.fillStyle = '#09090b';
      ctx.fillRect(1, -9, 8, 4);
      ctx.restore();

      ctx.restore();

      // 8. LEFT HILL: VETERAN SOLDIER SLUG WITH BAZOOKA 🪖🚀
      const leftSlugX = width * 0.12;
      const leftSlugY = height - 85 + Math.sin(leftSlugX * 0.006) * 45;
      const bazAngle = -0.55 + Math.sin(t * 1.5) * 0.15;
      const isLeftBlinking = Math.sin(t * 2) > 0.96;

      ctx.save();
      ctx.translate(leftSlugX, leftSlugY);

      // Draw Slug Body
      drawSlugBody(ctx, 1.1, '#ec4899', '#f472b6', { x: 2, y: -1 }, isLeftBlinking);

      // Army Camo Soldier Helmet
      ctx.fillStyle = '#3f6212';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(6, -20, 16, 9, 0.1, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      // Helmet Rim & Badge
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(6, -24, 3, 0, Math.PI * 2);
      ctx.fill();

      // Big Bazooka Cannon resting on shoulder
      ctx.save();
      ctx.translate(14, -8);
      ctx.rotate(bazAngle);
      // Bazooka Tube
      ctx.fillStyle = '#4b5563';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-8, -7, 44, 12, 3);
      ctx.fill();
      ctx.stroke();
      // Yellow Hazard Stripes
      ctx.fillStyle = '#eab308';
      ctx.fillRect(18, -6, 4, 10);
      ctx.fillRect(26, -6, 4, 10);
      // Laser Sight Pointer
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(36, -1);
      ctx.lineTo(160, -1);
      ctx.stroke();
      ctx.setLineDash([]);
      // Laser Dot at End
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(160, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // 9. RIGHT HILL: MAD BOMBER SLUG WITH DYNAMITE BUNDLE 🏴‍☠️🧨
      const rightSlugX = width * 0.84;
      const rightSlugY = height - 95 + Math.cos((rightSlugX - width * 0.55) * 0.005) * 50;
      const isRightBlinking = Math.sin(t * 1.8) > 0.96;

      ctx.save();
      ctx.translate(rightSlugX, rightSlugY);
      ctx.scale(-1, 1); // Face towards center

      // Draw Slug Body
      drawSlugBody(ctx, 1.1, '#ec4899', '#f472b6', { x: 2, y: -1 }, isRightBlinking);

      // Red Pirate / Rambo Headband with Fluttering Tails
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(8, -18, 14, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Headband fluttering knot
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(-24 + Math.sin(t * 6) * 4, -22 + Math.cos(t * 5) * 3);
      ctx.lineTo(-20 + Math.sin(t * 6) * 4, -14 + Math.sin(t * 5) * 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3-Stick Red Dynamite Bundle in Hand
      ctx.save();
      ctx.translate(18, -4);
      // Red Sticks
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-4, -12, 10, 22, 2);
      ctx.roundRect(4, -14, 10, 22, 2);
      ctx.fill();
      ctx.stroke();
      // Yellow TNT Strap
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-4, -4, 18, 6);

      // Burning Fuse
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -14);
      ctx.quadraticCurveTo(14, -22, 20, -20);
      ctx.stroke();

      // Sparkling Spark at Fuse Tip
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(20, -20, 3 + Math.sin(t * 18) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(20, -20, 6 + Math.sin(t * 18) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Emit smoke puffs
      if (Math.random() < 0.3) {
        smokePuffs.push({
          x: rightSlugX - 20,
          y: rightSlugY - 24,
          vx: -(Math.random() * 0.4 + 0.2),
          vy: -(Math.random() * 0.8 + 0.5),
          life: 1,
          size: 3 + Math.random() * 3,
        });
      }
      ctx.restore();

      ctx.restore();

      // 10. Update & Draw Dynamite Smoke Puffs
      for (let i = smokePuffs.length - 1; i >= 0; i--) {
        const p = smokePuffs[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size += 0.2;
        if (p.life <= 0) {
          smokePuffs.splice(i, 1);
        } else {
          ctx.fillStyle = `rgba(200, 200, 210, ${p.life * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
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

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full space-y-6 my-auto py-6">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-violet-950/80 border border-violet-500/40 rounded-full text-xs font-bold text-violet-300 shadow-md backdrop-blur">
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
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Error Banner */}
          {(error || validationError) && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{validationError || error}</span>
            </div>
          )}

          {/* Pseudo Input */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Choisir un Avatar</label>
            <div className="flex items-center justify-between gap-1 p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-x-auto">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg transition ${
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

          {/* Host Button */}
          <button
            type="button"
            onClick={handleHostClick}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer un salon</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest absolute">
              OU
            </span>
          </div>

          {/* Join Form */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Rejoindre un salon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Code du salon..."
                className="flex-1 bg-zinc-950/80 border border-zinc-700/80 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none transition uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={handleJoinClick}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 hover:border-zinc-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-violet-400" />
                <span>Rejoindre</span>
              </button>
            </div>
          </div>
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

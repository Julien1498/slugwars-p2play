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

  // Dynamic SlugWars backdrop canvas
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

    const clouds = Array.from({ length: 7 }, () => ({
      x: Math.random() * width,
      y: 40 + Math.random() * (height * 0.35),
      speed: 0.2 + Math.random() * 0.4,
      size: 45 + Math.random() * 60,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    const sheep = {
      x: -60,
      y: height * 0.22,
      speed: 1.8,
      bobOffset: 0,
    };

    const heli = {
      x: width * 0.85,
      y: height * 0.18,
      hoverOffset: 0,
      propAngle: 0,
    };

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.6),
      size: Math.random() * 2 + 0.8,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    let t = 0;

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, width, height);

      // 1. Dusk Sky
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#09090b');
      sky.addColorStop(0.4, '#1e1035');
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

      // 4. Silhouetted Hills
      ctx.fillStyle = 'rgba(24, 24, 32, 0.9)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 30) {
        const hillY = height - 160 + Math.sin(x * 0.003 + 1.2) * 60 + Math.cos(x * 0.008) * 25;
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

      // 5. Flying Super Sheep 🐑💨
      sheep.x += sheep.speed;
      if (sheep.x > width + 100) sheep.x = -80;
      sheep.bobOffset = Math.sin(t * 3) * 12;

      ctx.save();
      ctx.translate(sheep.x, sheep.y + sheep.bobOffset);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-16, -2);
      ctx.lineTo(-32 + Math.sin(t * 8) * 4, -8 + Math.cos(t * 6) * 4);
      ctx.lineTo(-28 + Math.sin(t * 8) * 4, 6 + Math.sin(t * 6) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = '28px sans-serif';
      ctx.fillText('🐑', -10, 8);
      ctx.restore();

      // 6. Hovering Helicopter Slug 🚁
      heli.hoverOffset = Math.sin(t * 2) * 8;
      heli.propAngle += 0.45;

      ctx.save();
      ctx.translate(heli.x, heli.y + heli.hoverOffset);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -16, 24 * Math.cos(heli.propAngle), 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '32px sans-serif';
      ctx.fillText('🚁', -16, 8);
      ctx.font = '16px sans-serif';
      ctx.fillText('🐌', -10, 4);
      ctx.restore();

      // 7. Left Slug (Bazooka Aiming)
      const leftSlugX = width * 0.12;
      const leftSlugY = height - 90 + Math.sin(leftSlugX * 0.006) * 45;
      ctx.save();
      ctx.translate(leftSlugX, leftSlugY);
      ctx.font = '38px sans-serif';
      ctx.fillText('🐌', -18, -2);
      ctx.font = '20px sans-serif';
      ctx.fillText('🪖', -2, -18);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8, -8);
      const bazAngle = -0.6 + Math.sin(t * 1.5) * 0.15;
      ctx.lineTo(8 + Math.cos(bazAngle) * 32, -8 + Math.sin(bazAngle) * 32);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(8 + Math.cos(bazAngle) * 48, -8 + Math.sin(bazAngle) * 48, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right Slug (Holding Dynamite)
      const rightSlugX = width * 0.84;
      const rightSlugY = height - 100 + Math.cos((rightSlugX - width * 0.55) * 0.005) * 50;
      ctx.save();
      ctx.translate(rightSlugX, rightSlugY);
      ctx.scale(-1, 1);
      ctx.font = '38px sans-serif';
      ctx.fillText('🐌', -18, -2);
      ctx.font = '18px sans-serif';
      ctx.fillText('🏴‍☠️', -4, -18);
      ctx.font = '22px sans-serif';
      ctx.fillText('🧨', 12, -4);
      if (Math.sin(t * 12) > 0) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(28, -14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

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

  // Connecting screen
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
      {/* Background Animated Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-lg w-full space-y-6 my-auto py-6">
        {/* Header */}
        <div className="text-center space-y-2.5">
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

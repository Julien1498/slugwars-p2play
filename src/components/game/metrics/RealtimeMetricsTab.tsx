import React from 'react';
import { GameState } from '../../../core/types';
import { NetworkStats } from '../../../core/networkMetrics';
import { Cpu, HardDrive, Wifi, Zap, ArrowUpRight, ArrowDownLeft, Activity, Monitor } from 'lucide-react';

interface RealtimeMetricsTabProps {
  fps: number;
  frameTime: number;
  displayPing: number;
  fpsColor: string;
  netStats: NetworkStats;
  memoryUsage: { usedMB: number; totalMB: number } | null;
  gameState: GameState;
  isFpsHudActive: boolean;
  onToggleFpsHud: () => void;
  isFpsHudAdvancedActive: boolean;
  onToggleFpsHudAdvanced: () => void;
}

export const RealtimeMetricsTab: React.FC<RealtimeMetricsTabProps> = ({
  fps,
  frameTime,
  displayPing,
  fpsColor,
  netStats,
  memoryUsage,
  gameState,
  isFpsHudActive,
  onToggleFpsHud,
  isFpsHudAdvancedActive,
  onToggleFpsHudAdvanced,
}) => {
  const particleCount = gameState.particles?.length || 0;
  const projectileCount = gameState.projectiles?.length || 0;
  const explosionCount = gameState.explosions?.length || 0;
  const mineCount = gameState.mines?.length || 0;
  const livingSlugs = gameState.slugs.filter((s) => s.isAlive).length;

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-5 overflow-y-auto font-sans">
      {/* Top Metrics Cards: FPS, Frame Time, Latency */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* FPS */}
        <div className={`p-2.5 sm:p-3.5 rounded-xl border flex flex-col items-center justify-center ${fpsColor}`}>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>FPS</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{fps}</div>
          <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5 font-semibold">Cible: 60</div>
        </div>

        {/* Frame Time */}
        <div className="p-2.5 sm:p-3.5 rounded-xl border border-zinc-700/60 bg-zinc-950/70 text-zinc-200 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-0.5 sm:mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Rendu</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">{frameTime}ms</div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 font-semibold">Budget: 16.6ms</div>
        </div>

        {/* Network Latency */}
        <div className="p-2.5 sm:p-3.5 rounded-xl border border-zinc-700/60 bg-zinc-950/70 text-zinc-200 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-violet-400 mb-0.5 sm:mb-1">
            <Wifi className="w-3.5 h-3.5" />
            <span>Ping</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">{displayPing}ms</div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 font-semibold">
            {netStats.realPingMs !== null ? 'WebRTC RTT' : 'Canal P2P'}
          </div>
        </div>
      </div>

      {/* In-Game HUD Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Permanent In-Game Zero-Cost FPS HUD Toggle */}
        <div className="bg-zinc-950/90 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl flex items-center justify-between transition">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isFpsHudActive ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Compteur FPS en jeu</span>
                {isFpsHudActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono font-bold">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pastille discrète 60 FPS sur le terrain.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleFpsHud}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              isFpsHudActive ? 'bg-emerald-600' : 'bg-zinc-800'
            }`}
            title={isFpsHudActive ? 'Désactiver le compteur FPS en jeu' : 'Activer le compteur FPS en jeu'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isFpsHudActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Advanced Profiler HUD Toggle */}
        <div className={`bg-zinc-950/90 border ${isFpsHudActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/40 opacity-50'} p-3.5 rounded-xl flex items-center justify-between transition`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${isFpsHudAdvancedActive && isFpsHudActive ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Détails & Passes Canvas</span>
                {isFpsHudAdvancedActive && isFpsHudActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-mono font-bold">
                    Avancé
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Affiche les latences et passes (ciel, décor, etc.).
              </p>
            </div>
          </div>

          <button
            disabled={!isFpsHudActive}
            onClick={onToggleFpsHudAdvanced}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
              isFpsHudAdvancedActive && isFpsHudActive ? 'bg-cyan-600' : 'bg-zinc-800'
            } ${!isFpsHudActive ? 'cursor-not-allowed opacity-50' : ''}`}
            title={isFpsHudAdvancedActive ? 'Passer en affichage FPS simple' : 'Activer les détails microsecondes'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isFpsHudAdvancedActive && isFpsHudActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>


      {/* Real-Time Bandwidth P2P Section */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Débit Réseau P2P (Upload / Download)</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Total Session: {(netStats.totalSentKB + netStats.totalReceivedKB).toFixed(1)} KB
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Upload Card */}
          <div className="bg-zinc-900/80 border border-sky-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                <ArrowUpRight className="w-4 h-4" />
                <span>Upload (Émission)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {netStats.uploadKbps}
                </span>
                <span className="text-xs font-bold text-sky-300">kbps</span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ({netStats.uploadKBs} KB/s)
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-zinc-400">
              <div>Envoyé</div>
              <div className="font-bold text-zinc-200">{netStats.totalSentKB} KB</div>
            </div>
          </div>

          {/* Download Card */}
          <div className="bg-zinc-900/80 border border-violet-500/30 p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Download (Réception)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {netStats.downloadKbps}
                </span>
                <span className="text-xs font-bold text-violet-300">kbps</span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ({netStats.downloadKBs} KB/s)
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-zinc-400">
              <div>Reçu</div>
              <div className="font-bold text-zinc-200">{netStats.totalReceivedKB} KB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware & Entities Overview */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Performances Matériel & Mémoire</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
            <span className="text-zinc-400">Mémoire JS Heap :</span>
            <span className="font-mono font-bold text-amber-300">
              {memoryUsage ? `${memoryUsage.usedMB} MB / ${memoryUsage.totalMB} MB` : 'API Indisponible'}
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
            <span className="text-zinc-400">DPR Rendu (Écran) :</span>
            <span className="font-mono font-bold text-white">
              {typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 1.5 : 2.0) : 1}x{' '}
              <span className="text-[10px] text-emerald-400 font-normal">
                ({typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1}x natif)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Entities Counter */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Charge de Calcul Moteur & Entités</span>
        </h3>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Limaces</div>
            <div className="font-black text-base font-mono text-emerald-400 mt-1">{livingSlugs} / {gameState.slugs.length}</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Projectiles</div>
            <div className="font-black text-base font-mono text-amber-400 mt-1">{projectileCount}</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Mines</div>
            <div className="font-black text-base font-mono text-red-400 mt-1">{mineCount}</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Explosions</div>
            <div className="font-black text-base font-mono text-orange-400 mt-1">{explosionCount}</div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Particules</div>
            <div className="font-black text-base font-mono text-cyan-400 mt-1">{particleCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

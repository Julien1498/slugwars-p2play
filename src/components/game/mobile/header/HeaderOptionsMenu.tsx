import React, { useRef, useEffect } from 'react';
import {
  Settings,
  ChevronDown,
  Maximize2,
  Minimize2,
  Eye,
  Gauge,
  Activity,
  BookOpen,
  Home,
  LogOut,
} from 'lucide-react';
import { perfTracker } from '../../../../core/perfTracker';

interface HeaderOptionsMenuProps {
  showMenuPopover: boolean;
  setShowMenuPopover: (show: boolean) => void;
  fpsHudActive: boolean;
  setFpsHudActive: (active: boolean) => void;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleFullscreen: () => void;
  isHost?: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
  onRequestConfirmLobby: () => void;
  isTouch?: boolean;
}

export const HeaderOptionsMenu: React.FC<HeaderOptionsMenuProps> = ({
  showMenuPopover,
  setShowMenuPopover,
  fpsHudActive,
  setFpsHudActive,
  isFullscreen,
  isFullscreenSupported,
  toggleFullscreen,
  isHost,
  showHitboxes,
  onToggleHitboxes,
  onOpenRules,
  onOpenMetrics,
  onExit,
  onRequestConfirmLobby,
  isTouch,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenuPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenuPopover(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuPopover, setShowMenuPopover]);

  const handleToggleFps = () => {
    const nextVal = !fpsHudActive;
    setFpsHudActive(nextVal);
    perfTracker.setFpsHudEnabled(nextVal);
    setShowMenuPopover(false);
  };

  return (
    <div className="relative shrink-0 pointer-events-auto" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenuPopover(!showMenuPopover)}
        className="flex items-center gap-1 bg-zinc-900/90 hover:bg-zinc-850 active:bg-zinc-800 text-zinc-300 hover:text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-zinc-750/80 transition-all shadow-md active:scale-95"
        title="Menu & Options"
      >
        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
        <span className="text-xs font-black hidden md:inline tracking-wide">Menu</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
            showMenuPopover ? 'rotate-180 text-violet-400' : ''
          }`}
        />
      </button>

      {showMenuPopover && (
        <div className="fixed sm:absolute top-12 right-2 sm:right-0 w-64 bg-zinc-950/95 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-2 shadow-2xl shadow-violet-950/40 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 select-none">
          <div className="px-2.5 py-1 text-[10px] uppercase font-black tracking-widest text-violet-400/90 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
            <span>⚙️ Configuration</span>
            {isHost && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-mono">
                HÔTE
              </span>
            )}
          </div>

          {isFullscreenSupported && (
            <button
              type="button"
              onClick={() => {
                toggleFullscreen();
                setShowMenuPopover(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-900/90 hover:text-white transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                )}
                <span>{isFullscreen ? 'Quitter Plein Écran' : 'Plein Écran'}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                {isFullscreen ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {onToggleHitboxes && (
            <button
              type="button"
              onClick={() => {
                onToggleHitboxes();
                setShowMenuPopover(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-900/90 hover:text-white transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Afficher Hitboxes</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  showHitboxes
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {showHitboxes ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleFps}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-900/90 hover:text-white transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Compteur FPS HUD</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                fpsHudActive
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {fpsHudActive ? 'ON' : 'OFF'}
            </span>
          </button>

          {onOpenMetrics && (
            <button
              type="button"
              onClick={() => {
                onOpenMetrics();
                setShowMenuPopover(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-900/90 hover:text-white transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Métriques & Diagnostic</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                P2P
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenRules();
              setShowMenuPopover(false);
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-900/90 hover:text-white transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Règles du Jeu</span>
            </div>
            <span className="text-[10px] text-zinc-500">📖</span>
          </button>

          <div className="my-1 border-t border-zinc-800/80" />

          <button
            type="button"
            onClick={() => {
              setShowMenuPopover(false);
              onRequestConfirmLobby();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-all active:scale-[0.98]"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Retour au Lobby</span>
          </button>

          {onExit && (
            <button
              type="button"
              onClick={() => {
                setShowMenuPopover(false);
                onExit();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Quitter la Partie</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

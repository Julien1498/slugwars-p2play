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
import { perfTracker } from '../../../core/perfTracker';

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuPopover, setShowMenuPopover]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setShowMenuPopover(!showMenuPopover)}
        className={
          isTouch
            ? `p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                showMenuPopover
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 active:scale-95'
              }`
            : `px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                showMenuPopover
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`
        }
        title="Menu des options & outils"
      >
        <Settings className={isTouch ? 'w-4 h-4 text-zinc-300' : 'w-3.5 h-3.5 text-zinc-300'} />
        {!isTouch && <span>Menu</span>}
        {!isTouch && (
          <ChevronDown
            className={`w-3 h-3 text-zinc-400 transition-transform ${
              showMenuPopover ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {showMenuPopover && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
          {/* Fullscreen Toggle */}
          {isFullscreenSupported && (
            <button
              onClick={() => {
                toggleFullscreen();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
            >
              <div className="flex items-center gap-2">
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Plein écran</span>
              </div>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  isFullscreen
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {isFullscreen ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Hitboxes Toggle */}
          {onToggleHitboxes && (
            <button
              type="button"
              onClick={() => {
                onToggleHitboxes();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hitboxes</span>
              </div>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  showHitboxes
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {showHitboxes ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* In-Game FPS HUD Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !fpsHudActive;
              perfTracker.setFpsHudEnabled(next);
              setFpsHudActive(next);
              setShowMenuPopover(false);
            }}
            className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compteur FPS</span>
            </div>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                fpsHudActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {fpsHudActive ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Metrics Monitor */}
          {onOpenMetrics && (
            <button
              type="button"
              onClick={() => {
                onOpenMetrics();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-emerald-300"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Métriques & Réseau</span>
            </button>
          )}

          {/* Rules */}
          <button
            type="button"
            onClick={() => {
              onOpenRules();
              setShowMenuPopover(false);
            }}
            className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-zinc-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Règles d'engagement</span>
          </button>

          <div className="w-full h-px bg-zinc-800/80 my-1" />

          {/* Return to Lobby (Host Only) */}
          {isHost && (
            <button
              type="button"
              onClick={() => {
                onRequestConfirmLobby();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-amber-950/40 transition flex items-center gap-2 text-amber-300"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Retourner au Salon</span>
            </button>
          )}

          {/* Exit Game */}
          {onExit && (
            <button
              type="button"
              onClick={() => {
                onExit();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-red-950/40 transition flex items-center gap-2 text-red-400"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Quitter la partie</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

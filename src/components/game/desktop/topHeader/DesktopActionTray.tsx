import React, { useRef, useEffect } from 'react';
import { RoomCodeBadge } from 'p2play-core';
import { perfTracker } from '../../../../core/perfTracker';
import {
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  Gauge,
  Activity,
  BookOpen,
  Home,
  LogOut,
} from 'lucide-react';

interface DesktopActionTrayProps {
  hostPeerId?: string;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleFullscreen: () => void;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  fpsHudActive: boolean;
  setFpsHudActive: (active: boolean) => void;
  showMenuPopover: boolean;
  setShowMenuPopover: (show: boolean | ((prev: boolean) => boolean)) => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  isHost: boolean;
  onRequestConfirmLobby: () => void;
  onExit?: () => void;
}

export const DesktopActionTray: React.FC<DesktopActionTrayProps> = ({
  hostPeerId,
  isFullscreen,
  isFullscreenSupported,
  toggleFullscreen,
  showHitboxes = false,
  onToggleHitboxes,
  fpsHudActive,
  setFpsHudActive,
  showMenuPopover,
  setShowMenuPopover,
  onOpenRules,
  onOpenMetrics,
  isHost,
  onRequestConfirmLobby,
  onExit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close Menu Popover when clicking outside
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
    <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 p-1.5 rounded-2xl shadow-2xl">
      {/* 1. Room Code Badge */}
      {hostPeerId && (
        <RoomCodeBadge
          code={hostPeerId}
          label="Salon"
          accentClassName="text-violet-400"
        />
      )}

      {/* 2. Fullscreen Button */}
      {isFullscreenSupported && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center shadow-sm active:scale-95 bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700 cursor-pointer"
          title={
            isFullscreen
              ? 'Quitter le plein écran (Touche F ou F11)'
              : 'Plein écran immersif (Touche F ou F11)'
          }
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-zinc-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-zinc-300" />
          )}
        </button>
      )}

      {/* 3. Settings & Rules Dropdown Gear Button */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenuPopover((prev) => !prev)}
          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center shadow-sm cursor-pointer ${
            showMenuPopover
              ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700 active:scale-95'
          }`}
          title="Options, règles et métriques"
        >
          <Settings className="w-4 h-4 text-zinc-300" />
        </button>

        {/* Menu Popover Dropdown */}
        {showMenuPopover && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
            {/* Fullscreen Toggle in menu */}
            {isFullscreenSupported && (
              <button
                type="button"
                onClick={() => {
                  toggleFullscreen();
                  setShowMenuPopover(false);
                }}
                className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200 cursor-pointer"
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
                className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hitboxes tactiques</span>
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
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200 cursor-pointer"
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

            {/* Metrics Monitor Modal Trigger */}
            {onOpenMetrics && (
              <button
                type="button"
                onClick={() => {
                  onOpenMetrics();
                  setShowMenuPopover(false);
                }}
                className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-emerald-300 cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Métriques & Réseau P2P</span>
              </button>
            )}

            {/* Rules Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                onOpenRules();
                setShowMenuPopover(false);
              }}
              className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-zinc-200 cursor-pointer"
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
                className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-amber-950/40 transition flex items-center gap-2 text-amber-300 cursor-pointer"
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
                className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-red-950/40 transition flex items-center gap-2 text-red-400 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Quitter la partie</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

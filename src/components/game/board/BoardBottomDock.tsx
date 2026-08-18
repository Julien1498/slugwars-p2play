import React from 'react';
import { Slug, ActiveProjectile } from '../../../core/types';
import { MessageSquare } from 'lucide-react';

interface BoardBottomDockProps {
  activeSlug: Slug | undefined;
  activeSheep: ActiveProjectile | undefined;
  isMyTurn: boolean;
  showDrawer: boolean;
  onToggleDrawer: () => void;
  onOpenWeaponPicker: () => void;
  onExitVehicle?: () => void;
  chatMessageCount: number;
}

export const BoardBottomDock: React.FC<BoardBottomDockProps> = React.memo(({
  activeSlug,
  activeSheep,
  isMyTurn,
  showDrawer,
  onToggleDrawer,
  onOpenWeaponPicker,
  onExitVehicle,
  chatMessageCount,
}) => {
  return (
    <footer className="h-9 min-h-[36px] max-h-[36px] bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-xl px-2.5 flex items-center justify-between text-xs text-zinc-300 gap-2 shadow-2xl shrink-0 mx-1 mb-0.5 z-30 whitespace-nowrap overflow-hidden">
      <div className="flex items-center gap-2 shrink-0 overflow-hidden">
        {activeSlug?.inVehicleId ? (
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/70 px-2.5 py-0.5 rounded-lg text-amber-200 shadow-md shrink-0">
            <span className="font-black flex items-center gap-1 text-amber-300">
              <span className="text-sm animate-bounce">🚁</span> Hélicoptère
            </span>
            <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
              ZQSD / Flèches pour voler
            </span>
            {isMyTurn && (
              <button
                onClick={onExitVehicle}
                className="px-2 py-0.2 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] rounded transition shadow flex items-center gap-1"
              >
                Sortir [E]
              </button>
            )}
          </div>
        ) : activeSheep ? (
          <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/70 px-2.5 py-0.5 rounded-lg text-amber-200 shadow-md shrink-0">
            <span className="font-black flex items-center gap-1 text-amber-300">
              <span className="text-sm animate-bounce">🐑</span> Super-Mouton
            </span>
            <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
              ◄ / ► Naviguer
            </span>
            <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
              Entrée : Faire sauter
            </span>
          </div>
        ) : (
          <>
            {/* Movement & Jump */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-violet-300">
                Q / D
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Marcher</span>

              <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-amber-300">
                Espace
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Sauter 🦘</span>
            </div>

            {/* Aim Angle */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-sky-300">
                ▲ / ▼
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Visée</span>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                Clic-Droit
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Caméra</span>

              <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                Molette
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Zoom</span>

              <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

              <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                C
              </span>
              <span className="text-zinc-400 text-[11px] font-semibold">Centrer</span>
            </div>
          </>
        )}
      </div>

      {/* Action Controls & Arsenal */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Journal & Chat Drawer Button */}
        <button
          onClick={onToggleDrawer}
          className={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
            showDrawer
              ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_12px_#8b5cf6]'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat & Journal</span>
          {chatMessageCount > 0 && (
            <span className="px-1.5 py-0.2 bg-violet-950 border border-violet-500/50 rounded-full text-[10px] text-violet-300 font-mono">
              {chatMessageCount}
            </span>
          )}
        </button>

        {/* Fire Prompt */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg shadow shrink-0 transition-all ${
            isMyTurn ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0 px-0 overflow-hidden border-0'
          }`}
        >
          <span className="px-1.5 py-0.2 bg-emerald-900/90 border border-emerald-500/80 rounded font-mono text-[10px] font-black text-emerald-200">
            Clic / Entrée
          </span>
          <span className="font-black text-xs text-emerald-300">Tirer 🚀</span>
        </div>

        {/* Prominent Accessible Weapons Button */}
        <button
          onClick={onOpenWeaponPicker}
          disabled={!isMyTurn}
          className={`px-3.5 py-1 rounded-xl border font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 ${
            isMyTurn
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-violet-400 shadow-[0_0_15px_rgba(147,51,234,0.45)] hover:scale-105 active:scale-95'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
          }`}
          title="Ouvrir l'Arsenal W.M.D (Touche I)"
        >
          <span>Armes 🎒 [I]</span>
        </button>
      </div>
    </footer>
  );
}, (prev, next) => {
  return (
    prev.isMyTurn === next.isMyTurn &&
    prev.showDrawer === next.showDrawer &&
    prev.chatMessageCount === next.chatMessageCount &&
    prev.activeSlug?.id === next.activeSlug?.id &&
    prev.activeSlug?.inVehicleId === next.activeSlug?.inVehicleId &&
    prev.activeSlug?.selectedWeaponId === next.activeSlug?.selectedWeaponId &&
    prev.activeSheep?.id === next.activeSheep?.id &&
    prev.onToggleDrawer === next.onToggleDrawer &&
    prev.onOpenWeaponPicker === next.onOpenWeaponPicker &&
    prev.onExitVehicle === next.onExitVehicle
  );
});

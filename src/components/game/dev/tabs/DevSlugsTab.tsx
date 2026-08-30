import React from 'react';
import { Shield, Heart, Skull, Crosshair, Zap } from 'lucide-react';
import { GameState } from '../../../../core/types';
import { DevCursorTool } from '../../../../hooks/useDevMode';

interface DevSlugsTabProps {
  gameState: GameState;
  onToggleGodMode: () => void;
  onHealAll: () => void;
  onSetOneHp: () => void;
  onKillActiveSlug: () => void;
  activeCursorTool: DevCursorTool | null;
  onSelectCursorTool: (tool: DevCursorTool | null) => void;
}

export const DevSlugsTab: React.FC<DevSlugsTabProps> = ({
  gameState,
  onToggleGodMode,
  onHealAll,
  onSetOneHp,
  onKillActiveSlug,
  activeCursorTool,
  onSelectCursorTool,
}) => {
  const isGodMode = gameState.godModeEnabled;
  const isTeleporting = activeCursorTool === 'teleport_slug';

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="font-bold text-zinc-200">God Mode (Invulnérabilité)</div>
          <div className="text-[11px] text-zinc-400">
            {isGodMode ? 'Les limaces ne prennent aucun dégât' : 'Dégâts normaux'}
          </div>
        </div>
        <button
          onClick={onToggleGodMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            isGodMode
              ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          {isGodMode ? 'ACTIF' : 'INACTIF'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onHealAll}
          className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Heart className="w-3.5 h-3.5" /> Soigner Tout (100 HP)
        </button>

        <button
          onClick={onSetOneHp}
          className="px-3 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold border border-rose-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" /> Tout à 1 HP (One-Shot)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectCursorTool('teleport_slug')}
          className={`px-3 py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-colors ${
            isTeleporting
              ? 'bg-cyan-500 text-zinc-950 border-cyan-400 animate-pulse'
              : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/40'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          {isTeleporting ? 'Cliquez terrain...' : 'Téléporter Limace'}
        </button>

        <button
          onClick={onKillActiveSlug}
          className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 font-bold border border-red-800/60 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Skull className="w-3.5 h-3.5" /> Tuer Limace Active
        </button>
      </div>
    </div>
  );
};

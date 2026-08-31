import React from 'react';
import { Wind, Waves, Sparkles, Layers, Bomb } from 'lucide-react';
import { GameState } from '../../../../core/types';
import { DevCursorTool } from '../../../../hooks/useDevMode';

interface DevEnvTabProps {
  gameState: GameState;
  onSetWind: (wind: number) => void;
  onRiseWater: (amountPx: number) => void;
  onLowerWater: (amountPx: number) => void;
  onTriggerArmageddon: () => void;
  activeCursorTool?: DevCursorTool | null;
  onSelectCursorTool?: (tool: DevCursorTool | null) => void;
  brushRadius?: number;
  onSetBrushRadius?: (r: number) => void;
}

export const DevEnvTab: React.FC<DevEnvTabProps> = ({
  gameState,
  onSetWind,
  onRiseWater,
  onLowerWater,
  onTriggerArmageddon,
  activeCursorTool,
  onSelectCursorTool,
  brushRadius = 30,
  onSetBrushRadius,
}) => {
  const curWind = gameState.wind ?? 0;
  const isDigging = activeCursorTool === 'dig_terrain';
  const isBuilding = activeCursorTool === 'build_terrain';

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Terrain Sculpting / Editing */}
      {onSelectCursorTool && (
        <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectCursorTool('dig_terrain')}
              className={`px-3 py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                isDigging
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 animate-pulse'
                  : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
              }`}
            >
              <Bomb className="w-3.5 h-3.5" />
              {isDigging ? 'Actif (Glissez pour creuser)' : '⛏️ Creuser Sol'}
            </button>

            <button
              onClick={() => onSelectCursorTool('build_terrain')}
              className={`px-3 py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                isBuilding
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 animate-pulse'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isBuilding ? 'Actif (Glissez pour poser)' : '🧱 Poser Sol'}
            </button>
          </div>

          {onSetBrushRadius && (
            <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800/60">
              <div className="flex justify-between items-center text-[11px] font-bold text-zinc-300">
                <span>Rayon du Pinceau :</span>
                <span className="font-mono text-amber-400">{brushRadius} px</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={brushRadius}
                onChange={(e) => onSetBrushRadius(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Wind Slider */}
      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between font-bold text-zinc-200">
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vent :</span>
          </div>
          <span className="font-mono text-cyan-300">
            {curWind > 0 ? `+${curWind.toFixed(1)} ➡️` : curWind < 0 ? `${curWind.toFixed(1)} ⬅️` : '0.0 (Calme)'}
          </span>
        </div>
        <input
          type="range"
          min="-5.0"
          max="5.0"
          step="0.5"
          value={curWind}
          onChange={(e) => onSetWind(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <button onClick={() => onSetWind(-5.0)} className="hover:text-cyan-400">-5.0 (Max Gauche)</button>
          <button onClick={() => onSetWind(0)} className="hover:text-cyan-400">0.0 (Nul)</button>
          <button onClick={() => onSetWind(5.0)} className="hover:text-cyan-400">+5.0 (Max Droite)</button>
        </div>
      </div>

      {/* Water Level Rise & Lower */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onRiseWater(30)}
          className="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Waves className="w-3.5 h-3.5" /> Montée Eau (+30px)
        </button>

        <button
          onClick={() => onLowerWater(30)}
          className="px-3 py-2 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Waves className="w-3.5 h-3.5 rotate-180" /> Baisser Eau (-30px)
        </button>
      </div>

      {/* Armageddon Apocalypse */}
      <button
        onClick={onTriggerArmageddon}
        className="px-3 py-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 font-black tracking-wider border border-red-700/80 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-950/40"
      >
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" /> Invoquer l'Armageddon (Pluie de Météores)
      </button>
    </div>
  );
};

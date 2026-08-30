import React from 'react';
import { Eye, EyeOff, Box, Activity, Layers } from 'lucide-react';

interface DevOverlaysTabProps {
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  showPerfMetrics: boolean;
  onTogglePerfMetrics: () => void;
}

export const DevOverlaysTab: React.FC<DevOverlaysTabProps> = ({
  showHitboxes,
  onToggleHitboxes,
  showPerfMetrics,
  onTogglePerfMetrics,
}) => {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="font-bold text-zinc-200">Afficher les Hitboxes Physiques</div>
            <div className="text-[11px] text-zinc-400">Rayons de collision des limaces, caisses, mines et obus</div>
          </div>
        </div>
        <button
          onClick={onToggleHitboxes}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            showHitboxes
              ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {showHitboxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showHitboxes ? 'VISIBLE' : 'MASQUÉ'}
        </button>
      </div>

      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <div>
            <div className="font-bold text-zinc-200">Graphiques de Performance / FPS</div>
            <div className="text-[11px] text-zinc-400">Ouvre l'analyseur temps réel CPU/GPU, FPS et Netcode</div>
          </div>
        </div>
        <button
          onClick={onTogglePerfMetrics}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            showPerfMetrics
              ? 'bg-violet-500 text-zinc-950 hover:bg-violet-400'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {showPerfMetrics ? 'OUVERT' : 'OUVRIR'}
        </button>
      </div>
    </div>
  );
};

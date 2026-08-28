import React from 'react';
import { Zap } from 'lucide-react';

interface PerfControlBarProps {
  isPerfRecording: boolean;
  perfCountdown: number;
  onStartPerfCapture: () => void;
}

export const PerfControlBar: React.FC<PerfControlBarProps> = ({
  isPerfRecording,
  perfCountdown,
  onStartPerfCapture,
}) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Profiling Matériel & Rendu Canvas (5 Secondes)</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Capture chaque image rendue : FPS réels, saccades (Jank), temps de dessin Canvas 2D et consommation mémoire.
        </p>
      </div>

      <div>
        {isPerfRecording ? (
          <div className="flex items-center gap-3 bg-amber-950/80 border border-amber-500/60 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Profiling en cours ({perfCountdown}s restantes)...</span>
          </div>
        ) : (
          <button
            onClick={onStartPerfCapture}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg transition"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ Lancer le Profiling 5s</span>
          </button>
        )}
      </div>
    </div>
  );
};

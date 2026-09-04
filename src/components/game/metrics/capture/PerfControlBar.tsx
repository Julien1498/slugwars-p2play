import React, { useState, useEffect } from 'react';
import { Zap, Microscope, Layers } from 'lucide-react';
import { IsolateProgress } from '../../../../core/perfTracker';
import { renderSettings } from '../../../../core/perf/renderSettings';

interface PerfControlBarProps {
  isPerfRecording: boolean;
  perfCountdown: number;
  onStartPerfCapture: () => void;
  isIsolateRunning?: boolean;
  isolateProgress?: IsolateProgress | null;
  onStartIsolate?: () => void;
}

export const PerfControlBar: React.FC<PerfControlBarProps> = ({
  isPerfRecording,
  perfCountdown,
  onStartPerfCapture,
  isIsolateRunning,
  isolateProgress,
  onStartIsolate,
}) => {
  const [mipmapEnabled, setMipmapEnabled] = useState(renderSettings.getTerrainMipmapEnabled());
  const [propsMipmapEnabled, setPropsMipmapEnabled] = useState(renderSettings.getPropsMipmapEnabled());
  const [threshold, setThreshold] = useState(renderSettings.getTerrainMipmapThreshold());

  useEffect(() => {
    return renderSettings.onChange(() => {
      setMipmapEnabled(renderSettings.getTerrainMipmapEnabled());
      setPropsMipmapEnabled(renderSettings.getPropsMipmapEnabled());
      setThreshold(renderSettings.getTerrainMipmapThreshold());
    });
  }, []);
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Diagnostic Matériel & Isolation GPU</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Capture globale ou séquence automatisée pour isoler le composant créant le goulot d'étranglement GPU.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isIsolateRunning ? (
          <div className="flex items-center gap-3 bg-indigo-950/80 border border-indigo-500/60 px-4 py-2 rounded-xl text-indigo-300 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span>
              🔬 Étape {isolateProgress?.currentStepIndex}/{isolateProgress?.totalSteps} : {isolateProgress?.currentLabel} ({isolateProgress?.secondsRemaining}s)
            </span>
          </div>
        ) : isPerfRecording ? (
          <div className="flex items-center gap-3 bg-amber-950/80 border border-amber-500/60 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Profiling en cours ({perfCountdown}s restantes)...</span>
          </div>
        ) : (
          <>
            <button
              onClick={onStartPerfCapture}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg transition"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Profiling 5s</span>
            </button>

            {onStartIsolate && (
              <button
                onClick={onStartIsolate}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-950/40 transition"
              >
                <Microscope className="w-4 h-4" />
                <span>🔬 Rapport Isolate (18s)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 pl-1.5">Seuil:</span>
              {[0.5, 0.65, 0.8, 1.0].map((val) => (
                <button
                  key={val}
                  onClick={() => renderSettings.setTerrainMipmapThreshold(val)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition ${
                    Math.abs(threshold - val) < 0.04
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={`Active le Mipmap lorsque le dézoom est inférieur ou égal à ${val}x`}
                >
                  {val.toFixed(2)}x
                </button>
              ))}
            </div>

            <button
              onClick={() => renderSettings.toggleTerrainMipmap()}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                mipmapEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
              }`}
              title="Active/désactive le Mipmapping 2:1 du terrain en dézoom"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{mipmapEnabled ? '✔ Terrain Mipmap' : '✖ Terrain Mipmap'}</span>
            </button>

            <button
              onClick={() => renderSettings.togglePropsMipmap()}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                propsMipmapEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
              }`}
              title="Active/désactive le Mipmapping / Sprite Cache des props en dézoom"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{propsMipmapEnabled ? '✔ Props Mipmap' : '✖ Props Mipmap'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

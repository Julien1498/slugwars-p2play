import React, { useState } from 'react';
import { PerfCaptureReport } from '../../../core/perfTracker';
import { Zap, AlertTriangle, Layers, FileText, Check, Copy } from 'lucide-react';

interface PerfCaptureTabProps {
  perfReport: PerfCaptureReport | null;
  isPerfRecording: boolean;
  perfCountdown: number;
  onStartPerfCapture: () => void;
  onCopyPerfReport: () => void;
  perfCopied: boolean;
}

export const PerfCaptureTab: React.FC<PerfCaptureTabProps> = ({
  perfReport,
  isPerfRecording,
  perfCountdown,
  onStartPerfCapture,
  onCopyPerfReport,
  perfCopied,
}) => {
  const [onlyJankFilter, setOnlyJankFilter] = useState(false);

  const filteredPerfFrames = perfReport
    ? onlyJankFilter
      ? perfReport.frames.filter((f) => f.isJank)
      : perfReport.frames
    : [];

  return (
    <div className="p-6 space-y-5 overflow-y-auto font-sans flex-1">
      {/* Recording Control Bar */}
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

      {/* Results Report View */}
      {perfReport ? (
        <div className="space-y-4">
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-5 gap-2.5">
            {/* FPS Moy & Min/Max */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">FPS Moyen / Min</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black font-mono text-emerald-400">
                  {perfReport.avgFps}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  (Min: <strong className="text-amber-400">{perfReport.minFps}</strong>)
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                1% Low : <strong className="text-amber-300">{perfReport.p1LowFps} FPS</strong>
              </div>
            </div>

            {/* Draw Time */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Dessin Canvas 2D</div>
              <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                {perfReport.avgRenderDurationMs} <span className="text-xs">ms</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Max Dessin : {perfReport.maxRenderDurationMs} ms
              </div>
            </div>

            {/* Physics Calculations */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Physique Moteur</div>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {perfReport.avgPhysicsDurationMs} <span className="text-xs">ms</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Max: {perfReport.maxPhysicsDurationMs}ms ({perfReport.totalPhysicsTicks} ticks)
              </div>
            </div>

            {/* Saccades & Jank */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Saccades (&gt;20ms)</div>
              <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                {perfReport.jankFrameCount}{' '}
                <span className="text-xs font-normal text-zinc-400">
                  ({perfReport.jankPercent}%)
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Critiques (&gt;33ms) : <strong className="text-red-400">{perfReport.criticalJankCount}</strong>
              </div>
            </div>

            {/* JS Heap Memory */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Mémoire JS Heap</div>
              <div className="text-xl font-black font-mono text-violet-400 mt-0.5">
                {perfReport.memoryEndMB !== null ? `${perfReport.memoryEndMB} MB` : 'N/A'}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {perfReport.memoryDeltaMB !== null
                  ? `Variation: ${perfReport.memoryDeltaMB >= 0 ? '+' : ''}${perfReport.memoryDeltaMB} MB`
                  : 'Navigateur bridé'}
              </div>
            </div>
          </div>

          {/* Worst Frames Alert Section */}
          {perfReport.topWorstFrames.length > 0 && perfReport.topWorstFrames[0].frameIntervalMs > 20 && (
            <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Top des Images les plus lentes (Pics de Latence)</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                {perfReport.topWorstFrames.slice(0, 6).map((f) => (
                  <div key={f.frameId} className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg">
                    <div className="flex justify-between text-zinc-300">
                      <span>Image #{f.frameId} (+{(f.timeOffsetMs / 1000).toFixed(2)}s)</span>
                      <span className={f.frameIntervalMs > 33.3 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                        {f.frameIntervalMs} ms
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                      <span>Dessin : {f.renderDurationMs}ms</span>
                      <span>React : {f.reactRenderDurationMs}ms</span>
                      <span>{f.fpsInstant} FPS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* React Component Activity Table */}
          {perfReport.reactComponents.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Activité & Re-renders des Composants React ({perfReport.totalReactRenders} passes)</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  Temps Moyen Re-render : <strong className="text-zinc-200">{perfReport.avgReactRenderMs} ms</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {perfReport.reactComponents.map((c) => (
                  <div key={c.componentId} className="bg-zinc-900/70 border border-zinc-800 p-2.5 rounded-lg text-xs font-mono">
                    <div className="font-bold text-white flex justify-between">
                      <span>&lt;{c.componentId} /&gt;</span>
                      <span className="text-violet-300 font-normal">{c.renderCount}x</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                      <span>Total : {c.totalDurationMs}ms</span>
                      <span>Moy : {c.avgDurationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frames Timeline Header */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Toutes les Images Rendues ({filteredPerfFrames.length} / {perfReport.totalFrames})</span>
              </h4>

              {perfReport.jankFrameCount > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  <input
                    type="checkbox"
                    checked={onlyJankFilter}
                    onChange={(e) => setOnlyJankFilter(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Saccades uniquement ({perfReport.jankFrameCount})</span>
                </label>
              )}
            </div>

            <button
              onClick={onCopyPerfReport}
              className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition"
            >
              {perfCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{perfCopied ? 'Copié !' : 'Copier le rapport JSON'}</span>
            </button>
          </div>

          {/* Frames Timeline */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredPerfFrames.map((f) => (
              <div
                key={f.frameId}
                className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono transition ${
                  f.isCriticalJank
                    ? 'bg-red-950/50 border-red-500/50 text-red-200'
                    : f.isJank
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[11px] w-12">
                    +{(f.timeOffsetMs / 1000).toFixed(2)}s
                  </span>
                  <span className="font-bold text-white">Frame #{f.frameId}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      f.fpsInstant >= 55
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : f.fpsInstant >= 30
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-red-950 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {f.fpsInstant} FPS
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Dessin : <strong>{f.renderDurationMs}ms</strong> | Phys : <strong>{f.physicsDurationMs}ms</strong> | React : <strong>{f.reactRenderDurationMs}ms</strong> | Intervalle : <strong>{f.frameIntervalMs}ms</strong>
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400">
                  🐌 {f.entities.livingSlugs} | 🚀 {f.entities.projectiles} | 💥 {f.entities.explosions} | ✨ {f.entities.particles}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isPerfRecording && (
          <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs space-y-2">
            <div className="text-2xl">⚡</div>
            <div className="font-bold text-zinc-200 text-sm">Prêt pour le diagnostic matériel & rendu</div>
            <p className="max-w-md mx-auto">
              Cliquez sur le bouton ci-dessus pour enregistrer 5 secondes de jeu et identifier chaque chute de FPS, saccade ou pic de calcul Canvas.
            </p>
          </div>
        )
      )}
    </div>
  );
};

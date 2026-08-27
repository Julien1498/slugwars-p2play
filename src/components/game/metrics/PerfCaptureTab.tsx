import React, { useState } from 'react';
import { PerfCaptureReport } from '../../../core/perfTracker';
import { Zap, AlertTriangle, Layers, FileText, Check, Copy, Activity } from 'lucide-react';

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
          {/* Automatic Diagnostic Verdict Banner */}
          {perfReport.diagnosticVerdict && (
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-cyan-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs">
              <span className="text-xl shrink-0">🔬</span>
              <div className="space-y-1.5 w-full">
                <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Diagnostic Approfondi Matériel & Moteur</span>
                  {perfReport.environment?.smoothnessScore !== undefined && (
                    <span className="text-emerald-400 font-mono text-xs">
                      Fluidité VSync : <strong>{perfReport.environment.smoothnessScore}%</strong> (Jitter: ±{perfReport.environment.framePacingJitterMs}ms)
                    </span>
                  )}
                </div>
                <div className="text-zinc-200 leading-relaxed font-sans font-medium">
                  {perfReport.diagnosticVerdict}
                </div>
                {perfReport.environment && (
                  <div className="text-[10px] text-zinc-400 font-mono pt-1 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800/80">
                    <span>GPU : <strong className="text-cyan-300">{perfReport.environment.gpuRenderer}</strong></span>
                    <span>Résolution : <strong className="text-white">{perfReport.environment.screenWidth}x{perfReport.environment.screenHeight}</strong></span>
                    <span>DPR Fond : <strong className="text-amber-300">{(perfReport.environment.dprBg ?? perfReport.environment.dpr).toFixed(2)}x</strong></span>
                    <span>DPR Action : <strong className="text-emerald-300">{(perfReport.environment.dprAction ?? 1.0).toFixed(2)}x</strong></span>
                    <span>CPU Cores : <strong className="text-white">{perfReport.environment.hardwareConcurrency}</strong></span>
                    <span>RAM : <strong className="text-white">{perfReport.environment.deviceMemoryGB ? `${perfReport.environment.deviceMemoryGB} GB` : 'N/A'}</strong></span>
                    {perfReport.environment.heapSizeLimitMB && (
                      <span>Limite Heap : <strong className="text-violet-300">{perfReport.environment.heapSizeLimitMB} MB</strong></span>
                    )}
                    <span>Latence Event Loop : <strong className="text-emerald-300">{perfReport.environment.avgEventLoopLagMs}ms</strong></span>
                    <span>Tâches Longues (&gt;50ms) : <strong className="text-emerald-300">{perfReport.environment.longTasksCount}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real CPU vs GPU vs Idle Breakdown Bar */}
          {perfReport.cpuGpuBreakdown && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400">
                <span>Décomposition Réelle du Temps par Trame ({perfReport.avgFrameIntervalMs} ms)</span>
                <span className="text-cyan-300 font-mono">
                  CPU: {perfReport.cpuGpuBreakdown.avgCpuJsMs}ms · GPU: {perfReport.cpuGpuBreakdown.avgGpuRasterMs}ms · VSync: {perfReport.cpuGpuBreakdown.avgRealIdleMs}ms
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div
                  className="bg-cyan-400 h-full rounded-l-full transition-all"
                  style={{ width: `${Math.max(2, perfReport.cpuGpuBreakdown.cpuJsPercent)}%` }}
                  title={`CPU JS : ${perfReport.cpuGpuBreakdown.avgCpuJsMs}ms (${perfReport.cpuGpuBreakdown.cpuJsPercent}%)`}
                />
                <div
                  className="bg-fuchsia-500 h-full transition-all"
                  style={{ width: `${Math.max(2, perfReport.cpuGpuBreakdown.gpuRasterPercent)}%` }}
                  title={`GPU Raster & Shaders : ${perfReport.cpuGpuBreakdown.avgGpuRasterMs}ms (${perfReport.cpuGpuBreakdown.gpuRasterPercent}%)`}
                />
                <div
                  className="bg-indigo-500 h-full rounded-r-full transition-all"
                  style={{ width: `${Math.max(2, perfReport.cpuGpuBreakdown.realIdlePercent)}%` }}
                  title={`Repos VSync Inactif : ${perfReport.cpuGpuBreakdown.avgRealIdleMs}ms (${perfReport.cpuGpuBreakdown.realIdlePercent}%)`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  <span>⚡ CPU JS Total : <strong className="text-white">{perfReport.cpuGpuBreakdown.avgCpuJsMs} ms</strong> ({perfReport.cpuGpuBreakdown.cpuJsPercent}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 inline-block" />
                  <span>🎮 Rendu GPU & Shaders : <strong className="text-white">{perfReport.cpuGpuBreakdown.avgGpuRasterMs} ms</strong> ({perfReport.cpuGpuBreakdown.gpuRasterPercent}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>💤 Sommeil / VSync Réel : <strong className="text-white">{perfReport.cpuGpuBreakdown.avgRealIdleMs} ms</strong> ({perfReport.cpuGpuBreakdown.realIdlePercent}%)</span>
                </span>
              </div>
            </div>
          )}

          {/* FPS Distribution Breakdown Bar */}
          {perfReport.fpsDistribution && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400">
                <span>Distribution de la Cadence d'Images (FPS Buckets)</span>
                <span className="text-emerald-400 font-mono">
                  {perfReport.fpsDistribution.fps60PlusPercent}% ≥ 60 FPS
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                <div
                  className="bg-emerald-400 h-full rounded-l-full transition-all"
                  style={{ width: `${perfReport.fpsDistribution.fps60PlusPercent}%` }}
                  title={`≥ 60 FPS : ${perfReport.fpsDistribution.fps60PlusCount} trames (${perfReport.fpsDistribution.fps60PlusPercent}%)`}
                />
                <div
                  className="bg-teal-400 h-full transition-all"
                  style={{ width: `${perfReport.fpsDistribution.fps50to59Percent}%` }}
                  title={`50-59 FPS : ${perfReport.fpsDistribution.fps50to59Count} trames (${perfReport.fpsDistribution.fps50to59Percent}%)`}
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${perfReport.fpsDistribution.fps30to49Percent}%` }}
                  title={`30-49 FPS : ${perfReport.fpsDistribution.fps30to49Count} trames (${perfReport.fpsDistribution.fps30to49Percent}%)`}
                />
                <div
                  className="bg-red-400 h-full rounded-r-full transition-all"
                  style={{ width: `${perfReport.fpsDistribution.fpsBelow30Percent}%` }}
                  title={`< 30 FPS : ${perfReport.fpsDistribution.fpsBelow30Count} trames (${perfReport.fpsDistribution.fpsBelow30Percent}%)`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ≥60 FPS: <strong className="text-white">{perfReport.fpsDistribution.fps60PlusPercent}%</strong> ({perfReport.fpsDistribution.fps60PlusCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> 50-59 FPS: <strong className="text-white">{perfReport.fpsDistribution.fps50to59Percent}%</strong> ({perfReport.fpsDistribution.fps50to59Count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 30-49 FPS: <strong className="text-white">{perfReport.fpsDistribution.fps30to49Percent}%</strong> ({perfReport.fpsDistribution.fps30to49Count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;30 FPS: <strong className="text-white">{perfReport.fpsDistribution.fpsBelow30Percent}%</strong> ({perfReport.fpsDistribution.fpsBelow30Count})
                </span>
              </div>
            </div>
          )}

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
              <div className="text-[10px] font-bold uppercase text-zinc-400">Dessin Canvas (CPU)</div>
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

            {/* GPU & Composition Time */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-zinc-400">Rendu GPU & Shaders</div>
              <div className="text-xl font-black font-mono text-fuchsia-400 mt-0.5">
                {perfReport.cpuGpuBreakdown?.avgGpuRasterMs ?? 0} <span className="text-xs">ms</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {perfReport.cpuGpuBreakdown?.gpuRasterPercent ?? 0}% de la trame
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

          {/* Render Passes Micro-Profiling Breakdown */}
          {perfReport.renderPasses && perfReport.renderPasses.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  <span>🎨 Temps de Dessin par Élément Canvas (Micro-Profiling Matériel)</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  Total Dessin Moyen : <strong className="text-cyan-300">{perfReport.avgRenderDurationMs} ms</strong> / frame
                </span>
              </div>

              {/* Automatic Bottleneck Diagnostic Banner */}
              {perfReport.topBottleneckPass && (
                <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-2.5 flex items-center gap-2.5 text-xs">
                  <span className="text-base">⚡</span>
                  <div className="text-zinc-300">
                    <strong className="text-cyan-300 font-semibold">{perfReport.topBottleneckPass.label}</strong> est le premier consommateur CPU/GPU avec <strong className="text-white">{perfReport.topBottleneckPass.percentOfRender}%</strong> du temps de dessin (<span className="text-cyan-400 font-mono">{perfReport.topBottleneckPass.avgDurationMs}ms</span> en moyenne, pic max à <span className="text-amber-400 font-mono">{perfReport.topBottleneckPass.maxDurationMs}ms</span>).
                  </div>
                </div>
              )}

              {/* Passes List & Visual Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {perfReport.renderPasses.map((p) => {
                  const isHeavy = p.percentOfRender >= 30 || p.avgDurationMs >= 1.0;
                  const isModerate = p.percentOfRender >= 15 || p.avgDurationMs >= 0.4;
                  return (
                    <div
                      key={p.passId}
                      className={`p-3 rounded-lg border flex flex-col justify-between gap-2 font-mono text-xs ${
                        isHeavy
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                          : isModerate
                          ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-sans">
                        <span className="font-bold text-white text-xs">{p.label}</span>
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                          {p.percentOfRender}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHeavy ? 'bg-amber-400' : isModerate ? 'bg-cyan-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, p.percentOfRender))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Moyenne : <strong className="text-zinc-200">{p.avgDurationMs} ms</strong></span>
                        <span>Pic Max : <strong className="text-zinc-200">{p.maxDurationMs} ms</strong></span>
                        <span>{p.callCount} passes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

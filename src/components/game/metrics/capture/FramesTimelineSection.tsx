import React from 'react';
import { AlertTriangle, Layers, FileText, Check, Copy } from 'lucide-react';
import { PerfCaptureReport, FrameLogEntry } from '../../../../core/perfTracker';
import {
  getFrameFpsBadgeColor,
  getWorstFrameLatencyColor,
  getFrameCardTheme,
} from './perfCaptureTabUtils';

interface FramesTimelineSectionProps {
  perfReport: PerfCaptureReport;
  filteredPerfFrames: FrameLogEntry[];
  onlyJankFilter: boolean;
  setOnlyJankFilter: (onlyJank: boolean) => void;
  onCopyPerfReport: () => void;
  perfCopied: boolean;
}

export const FramesTimelineSection: React.FC<FramesTimelineSectionProps> = ({
  perfReport,
  filteredPerfFrames,
  onlyJankFilter,
  setOnlyJankFilter,
  onCopyPerfReport,
  perfCopied,
}) => {
  return (
    <div className="space-y-4">
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
                  <span className={getWorstFrameLatencyColor(f.frameIntervalMs)}>
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
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition cursor-pointer"
        >
          {perfCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{perfCopied ? 'Copié !' : 'Copier le rapport JSON'}</span>
        </button>
      </div>

      {/* Frames Timeline List */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {filteredPerfFrames.map((f) => (
          <div
            key={f.frameId}
            className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono transition ${getFrameCardTheme(f)}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-[11px] w-12">
                +{(f.timeOffsetMs / 1000).toFixed(2)}s
              </span>
              <span className="font-bold text-white">Frame #{f.frameId}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getFrameFpsBadgeColor(f.fpsInstant)}`}>
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
  );
};

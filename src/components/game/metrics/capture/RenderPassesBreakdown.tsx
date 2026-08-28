import React from 'react';
import { Activity } from 'lucide-react';
import { PerfCaptureReport } from '../../../../core/perfTracker';
import { getRenderPassClassification } from './perfCaptureTabUtils';

interface RenderPassesBreakdownProps {
  perfReport: PerfCaptureReport;
}

export const RenderPassesBreakdown: React.FC<RenderPassesBreakdownProps> = ({ perfReport }) => {
  const passes = perfReport.renderPasses;
  if (!passes || passes.length === 0) return null;

  return (
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
        {passes.map((p) => {
          const { colorClass, barColor } = getRenderPassClassification(p.percentOfRender, p.avgDurationMs);
          return (
            <div
              key={p.passId}
              className={`p-3 rounded-lg border flex flex-col justify-between gap-2 font-mono text-xs ${colorClass}`}
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
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
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
  );
};

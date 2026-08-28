import React from 'react';
import { PerfCaptureReport } from '../../../../core/perfTracker';

interface CpuGpuBreakdownCardProps {
  perfReport: PerfCaptureReport;
}

export const CpuGpuBreakdownCard: React.FC<CpuGpuBreakdownCardProps> = ({ perfReport }) => {
  const breakdown = perfReport.cpuGpuBreakdown;
  if (!breakdown) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs font-mono">
      <div className="flex justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400">
        <span>Décomposition Réelle du Temps par Trame ({perfReport.avgFrameIntervalMs} ms)</span>
        <span className="text-cyan-300 font-mono">
          CPU: {breakdown.avgCpuJsMs}ms · GPU: {breakdown.avgGpuRasterMs}ms · VSync: {breakdown.avgRealIdleMs}ms
        </span>
      </div>
      <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5">
        <div
          className="bg-cyan-400 h-full rounded-l-full transition-all"
          style={{ width: `${Math.max(2, breakdown.cpuJsPercent)}%` }}
          title={`CPU JS : ${breakdown.avgCpuJsMs}ms (${breakdown.cpuJsPercent}%)`}
        />
        <div
          className="bg-fuchsia-500 h-full transition-all"
          style={{ width: `${Math.max(2, breakdown.gpuRasterPercent)}%` }}
          title={`GPU Raster & Shaders : ${breakdown.avgGpuRasterMs}ms (${breakdown.gpuRasterPercent}%)`}
        />
        <div
          className="bg-indigo-500 h-full rounded-r-full transition-all"
          style={{ width: `${Math.max(2, breakdown.realIdlePercent)}%` }}
          title={`Repos VSync Inactif : ${breakdown.avgRealIdleMs}ms (${breakdown.realIdlePercent}%)`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>⚡ CPU JS Total : <strong className="text-white">{breakdown.avgCpuJsMs} ms</strong> ({breakdown.cpuJsPercent}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 inline-block" />
          <span>🎮 Rendu GPU & Shaders : <strong className="text-white">{breakdown.avgGpuRasterMs} ms</strong> ({breakdown.gpuRasterPercent}%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          <span>💤 Sommeil / VSync Réel : <strong className="text-white">{breakdown.avgRealIdleMs} ms</strong> ({breakdown.realIdlePercent}%)</span>
        </span>
      </div>
    </div>
  );
};

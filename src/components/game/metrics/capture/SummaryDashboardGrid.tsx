import React from 'react';
import { PerfCaptureReport } from '../../../../core/perfTracker';
import { formatMemoryDelta } from './perfCaptureTabUtils';

interface SummaryDashboardGridProps {
  perfReport: PerfCaptureReport;
}

export const SummaryDashboardGrid: React.FC<SummaryDashboardGridProps> = ({ perfReport }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
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
          {formatMemoryDelta(perfReport.memoryDeltaMB)}
        </div>
      </div>
    </div>
  );
};

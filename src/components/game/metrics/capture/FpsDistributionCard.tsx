import React from 'react';
import { PerfCaptureReport } from '../../../../core/perfTracker';

interface FpsDistributionCardProps {
  perfReport: PerfCaptureReport;
}

export const FpsDistributionCard: React.FC<FpsDistributionCardProps> = ({ perfReport }) => {
  const dist = perfReport.fpsDistribution;
  if (!dist) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
      <div className="flex justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-400">
        <span>Distribution de la Cadence d'Images (FPS Buckets)</span>
        <span className="text-emerald-400 font-mono">
          {dist.fps60PlusPercent}% ≥ 60 FPS
        </span>
      </div>
      <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5">
        <div
          className="bg-emerald-400 h-full rounded-l-full transition-all"
          style={{ width: `${dist.fps60PlusPercent}%` }}
          title={`≥ 60 FPS : ${dist.fps60PlusCount} trames (${dist.fps60PlusPercent}%)`}
        />
        <div
          className="bg-teal-400 h-full transition-all"
          style={{ width: `${dist.fps50to59Percent}%` }}
          title={`50-59 FPS : ${dist.fps50to59Count} trames (${dist.fps50to59Percent}%)`}
        />
        <div
          className="bg-amber-400 h-full transition-all"
          style={{ width: `${dist.fps30to49Percent}%` }}
          title={`30-49 FPS : ${dist.fps30to49Count} trames (${dist.fps30to49Percent}%)`}
        />
        <div
          className="bg-red-400 h-full rounded-r-full transition-all"
          style={{ width: `${dist.fpsBelow30Percent}%` }}
          title={`< 30 FPS : ${dist.fpsBelow30Count} trames (${dist.fpsBelow30Percent}%)`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ≥60 FPS: <strong className="text-white">{dist.fps60PlusPercent}%</strong> ({dist.fps60PlusCount})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> 50-59 FPS: <strong className="text-white">{dist.fps50to59Percent}%</strong> ({dist.fps50to59Count})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 30-49 FPS: <strong className="text-white">{dist.fps30to49Percent}%</strong> ({dist.fps30to49Count})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;30 FPS: <strong className="text-white">{dist.fpsBelow30Percent}%</strong> ({dist.fpsBelow30Count})
        </span>
      </div>
    </div>
  );
};

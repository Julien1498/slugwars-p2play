import React from 'react';
import { PerfCaptureReport } from '../../../../core/perfTracker';
import { formatDeviceMemory } from './perfCaptureTabUtils';

interface DiagnosticVerdictBannerProps {
  perfReport: PerfCaptureReport;
}

export const DiagnosticVerdictBanner: React.FC<DiagnosticVerdictBannerProps> = ({ perfReport }) => {
  if (!perfReport.diagnosticVerdict) return null;

  return (
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
            <span>RAM : <strong className="text-white">{formatDeviceMemory(perfReport.environment.deviceMemoryGB)}</strong></span>
            {perfReport.environment.heapSizeLimitMB && (
              <span>Limite Heap : <strong className="text-violet-300">{perfReport.environment.heapSizeLimitMB} MB</strong></span>
            )}
            <span>Latence Event Loop : <strong className="text-emerald-300">{perfReport.environment.avgEventLoopLagMs}ms</strong></span>
            <span>Tâches Longues (&gt;50ms) : <strong className="text-emerald-300">{perfReport.environment.longTasksCount}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

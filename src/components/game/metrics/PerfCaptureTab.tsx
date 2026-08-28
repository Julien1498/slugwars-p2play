import React, { useState } from 'react';
import {
  PerfCaptureTabProps,
  filterPerfFrames,
} from './capture/perfCaptureTabUtils';
import { PerfControlBar } from './capture/PerfControlBar';
import { DiagnosticVerdictBanner } from './capture/DiagnosticVerdictBanner';
import { CpuGpuBreakdownCard } from './capture/CpuGpuBreakdownCard';
import { FpsDistributionCard } from './capture/FpsDistributionCard';
import { SummaryDashboardGrid } from './capture/SummaryDashboardGrid';
import { RenderPassesBreakdown } from './capture/RenderPassesBreakdown';
import { FramesTimelineSection } from './capture/FramesTimelineSection';

export type { PerfCaptureTabProps };

export const PerfCaptureTab: React.FC<PerfCaptureTabProps> = ({
  perfReport,
  isPerfRecording,
  perfCountdown,
  onStartPerfCapture,
  onCopyPerfReport,
  perfCopied,
}) => {
  const [onlyJankFilter, setOnlyJankFilter] = useState(false);

  const filteredPerfFrames = filterPerfFrames(perfReport?.frames, onlyJankFilter);

  return (
    <div className="p-6 space-y-5 overflow-y-auto font-sans flex-1">
      {/* 1. Recording Control Bar */}
      <PerfControlBar
        isPerfRecording={isPerfRecording}
        perfCountdown={perfCountdown}
        onStartPerfCapture={onStartPerfCapture}
      />

      {/* 2. Results Report View */}
      {perfReport ? (
        <div className="space-y-4">
          {/* Automatic Diagnostic Verdict Banner */}
          <DiagnosticVerdictBanner perfReport={perfReport} />

          {/* Real CPU vs GPU vs Idle Breakdown Bar */}
          <CpuGpuBreakdownCard perfReport={perfReport} />

          {/* FPS Distribution Breakdown Bar */}
          <FpsDistributionCard perfReport={perfReport} />

          {/* Summary Dashboard Cards */}
          <SummaryDashboardGrid perfReport={perfReport} />

          {/* Render Passes Micro-Profiling Breakdown */}
          <RenderPassesBreakdown perfReport={perfReport} />

          {/* React Activity & Frames Timeline */}
          <FramesTimelineSection
            perfReport={perfReport}
            filteredPerfFrames={filteredPerfFrames}
            onlyJankFilter={onlyJankFilter}
            setOnlyJankFilter={setOnlyJankFilter}
            onCopyPerfReport={onCopyPerfReport}
            perfCopied={perfCopied}
          />
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

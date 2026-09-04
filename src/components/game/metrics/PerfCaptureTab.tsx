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
import { IsolateReportCard } from './capture/IsolateReportCard';
import {
  isolateBenchmark,
  IsolateProgress,
  IsolateBenchmarkReport,
} from '../../../core/perfTracker';

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
  const [isIsolateRunning, setIsIsolateRunning] = useState(false);
  const [isolateProgress, setIsolateProgress] = useState<IsolateProgress | null>(null);
  const [isolateReport, setIsolateReport] = useState<IsolateBenchmarkReport | null>(null);

  const filteredPerfFrames = filterPerfFrames(perfReport?.frames, onlyJankFilter);

  const handleStartIsolate = () => {
    if (isIsolateRunning || isPerfRecording) return;
    setIsIsolateRunning(true);
    setIsolateReport(null);
    isolateBenchmark.start(
      (progress) => {
        setIsolateProgress(progress);
      },
      (report) => {
        setIsIsolateRunning(false);
        setIsolateProgress(null);
        setIsolateReport(report);
      }
    );
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto font-sans flex-1">
      {/* 1. Recording Control Bar */}
      <PerfControlBar
        isPerfRecording={isPerfRecording}
        perfCountdown={perfCountdown}
        onStartPerfCapture={onStartPerfCapture}
        isIsolateRunning={isIsolateRunning}
        isolateProgress={isolateProgress}
        onStartIsolate={handleStartIsolate}
      />

      {/* 2. Automated Isolation Benchmark Report (if run) */}
      {isolateReport && (
        <IsolateReportCard report={isolateReport} />
      )}

      {/* 3. Results Report View */}
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
        !isPerfRecording && !isIsolateRunning && !isolateReport && (
          <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs space-y-2">
            <div className="text-2xl">⚡</div>
            <div className="font-bold text-zinc-200 text-sm">Prêt pour le diagnostic matériel & rendu</div>
            <p className="max-w-md mx-auto">
              Cliquez sur <strong>⚡ Profiling 5s</strong> pour une capture globale ou sur <strong>🔬 Rapport Isolate (12s)</strong> pour identifier automatiquement le composant créant le goulot d'étranglement GPU.
            </p>
          </div>
        )
      )}
    </div>
  );
};

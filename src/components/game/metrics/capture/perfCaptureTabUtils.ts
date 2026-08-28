import { PerfCaptureReport, FrameLogEntry } from '../../../../core/perfTracker';

export interface PerfCaptureTabProps {
  perfReport: PerfCaptureReport | null;
  isPerfRecording: boolean;
  perfCountdown: number;
  onStartPerfCapture: () => void;
  onCopyPerfReport: () => void;
  perfCopied: boolean;
}

export function filterPerfFrames(
  frames: FrameLogEntry[] | undefined,
  onlyJank: boolean
): FrameLogEntry[] {
  if (!frames) return [];
  return onlyJank ? frames.filter((f) => f.isJank) : frames;
}

export function getRenderPassClassification(
  percentOfRender: number,
  avgDurationMs: number
): { isHeavy: boolean; isModerate: boolean; colorClass: string; barColor: string } {
  const isHeavy = percentOfRender >= 30 || avgDurationMs >= 1.0;
  const isModerate = !isHeavy && (percentOfRender >= 15 || avgDurationMs >= 0.4);

  if (isHeavy) {
    return {
      isHeavy: true,
      isModerate: false,
      colorClass: 'bg-amber-950/20 border-amber-500/40 text-amber-200',
      barColor: 'bg-amber-400',
    };
  }
  if (isModerate) {
    return {
      isHeavy: false,
      isModerate: true,
      colorClass: 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200',
      barColor: 'bg-cyan-400',
    };
  }
  return {
    isHeavy: false,
    isModerate: false,
    colorClass: 'bg-zinc-900/60 border-zinc-800 text-zinc-300',
    barColor: 'bg-emerald-400',
  };
}

export function getFrameFpsBadgeColor(fpsInstant: number): string {
  if (fpsInstant >= 55) return 'bg-emerald-950 text-emerald-300 border-emerald-500/30';
  if (fpsInstant >= 30) return 'bg-amber-950 text-amber-300 border-amber-500/30';
  return 'bg-red-950 text-red-300 border-red-500/30';
}

export function getWorstFrameLatencyColor(frameIntervalMs: number): string {
  return frameIntervalMs > 33.3 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold';
}

export function getFrameCardTheme(frame: FrameLogEntry): string {
  if (frame.isCriticalJank) return 'bg-red-950/50 border-red-500/50 text-red-200';
  if (frame.isJank) return 'bg-amber-950/40 border-amber-500/40 text-amber-200';
  return 'bg-zinc-950 border-zinc-800/80 text-zinc-300';
}

export function formatMemoryDelta(deltaMB: number | null | undefined): string {
  if (deltaMB === null || deltaMB === undefined) return 'Navigateur bridé';
  return `Variation: ${deltaMB >= 0 ? '+' : ''}${deltaMB} MB`;
}

export function formatDeviceMemory(memoryGB: number | null | undefined): string {
  return memoryGB ? `${memoryGB} GB` : 'N/A';
}

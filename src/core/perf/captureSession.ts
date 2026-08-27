import { FrameLogEntry, PerfCaptureReport } from './perfTypes';
import { generateCaptureReport } from './perfReporter';

export interface CaptureSessionState {
  isCapturing: boolean;
  captureStartTime: number;
  capturePlannedMs: number;
  capturedFrames: FrameLogEntry[];
  nextFrameId: number;
  lastReport: PerfCaptureReport | null;
  memoryStartMB: number | null;
  longTasksCount: number;
  longTasksTotalMs: number;
  longTaskObserver: PerformanceObserver | null;
  eventLoopLags: number[];
  eventLoopTimerId: any;
  physicsTickCount: number;
  sumPhysicsDurationMs: number;
  maxPhysicsDurationMs: number;
  currentFrameReactDurationMs: number;
  totalReactRendersCount: number;
  sumReactDurationMs: number;
  maxReactDurationMs: number;
  reactStatsMap: Map<string, { count: number; totalMs: number; maxMs: number }>;
  currentFramePasses: Record<string, number>;
  renderPassStatsMap: Map<string, { count: number; totalMs: number; maxMs: number }>;
}

export function startCaptureSession(
  state: CaptureSessionState,
  durationSeconds: number,
  notifyProgress: (remaining: number) => void,
  onFinished: (report: PerfCaptureReport) => void,
  getLiveDprs: () => { bgDpr: number; actionDpr: number }
): void {
  if (state.isCapturing) return;
  state.isCapturing = true;
  state.capturePlannedMs = durationSeconds * 1000;
  state.captureStartTime = performance.now();
  state.capturedFrames = [];
  state.nextFrameId = 1;
  state.lastReport = null;

  state.longTasksCount = 0;
  state.longTasksTotalMs = 0;
  state.eventLoopLags = [];

  try {
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      state.longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.longTasksCount++;
          state.longTasksTotalMs += entry.duration;
        }
      });
      state.longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  } catch {
    state.longTaskObserver = null;
  }

  let lastLagCheck = performance.now();
  state.eventLoopTimerId = setInterval(() => {
    const nowLag = performance.now();
    const delay = nowLag - lastLagCheck - 50;
    if (delay > 0) {
      state.eventLoopLags.push(delay);
    }
    lastLagCheck = nowLag;
  }, 50);

  state.physicsTickCount = 0;
  state.sumPhysicsDurationMs = 0;
  state.maxPhysicsDurationMs = 0;

  state.currentFrameReactDurationMs = 0;
  state.totalReactRendersCount = 0;
  state.sumReactDurationMs = 0;
  state.maxReactDurationMs = 0;
  state.reactStatsMap.clear();

  state.currentFramePasses = {};
  state.renderPassStatsMap.clear();

  const mem = (performance as any)?.memory;
  state.memoryStartMB = mem?.usedJSHeapSize
    ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10
    : null;

  let remaining = durationSeconds;
  notifyProgress(remaining);

  const timer = setInterval(() => {
    remaining--;
    if (remaining <= 0 || !state.isCapturing) {
      clearInterval(timer);
      if (state.isCapturing) {
        finishCaptureSession(state, onFinished, getLiveDprs);
      }
    } else {
      notifyProgress(remaining);
    }
  }, 1000);
}

export function finishCaptureSession(
  state: CaptureSessionState,
  onFinished: (report: PerfCaptureReport) => void,
  getLiveDprs: () => { bgDpr: number; actionDpr: number }
): void {
  if (!state.isCapturing) return;
  state.isCapturing = false;

  if (state.eventLoopTimerId) {
    clearInterval(state.eventLoopTimerId);
    state.eventLoopTimerId = null;
  }
  if (state.longTaskObserver) {
    try {
      state.longTaskObserver.disconnect();
    } catch {}
    state.longTaskObserver = null;
  }

  const actualDurationMs = Math.round(performance.now() - state.captureStartTime);
  const { bgDpr, actionDpr } = getLiveDprs();

  const report = generateCaptureReport({
    actualDurationMs,
    frames: [...state.capturedFrames],
    physicsTickCount: state.physicsTickCount,
    sumPhysicsDurationMs: state.sumPhysicsDurationMs,
    maxPhysicsDurationMs: state.maxPhysicsDurationMs,
    totalReactRendersCount: state.totalReactRendersCount,
    sumReactDurationMs: state.sumReactDurationMs,
    maxReactDurationMs: state.maxReactDurationMs,
    reactStatsMap: state.reactStatsMap,
    renderPassStatsMap: state.renderPassStatsMap,
    longTasksCount: state.longTasksCount,
    longTasksTotalMs: state.longTasksTotalMs,
    eventLoopLags: state.eventLoopLags,
    memoryStartMB: state.memoryStartMB,
    liveBgDpr: bgDpr,
    liveActionDpr: actionDpr,
  });

  state.lastReport = report;
  onFinished(report);
}

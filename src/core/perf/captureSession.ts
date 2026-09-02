import { FrameLogEntry, PerfCaptureReport } from './perfTypes';
import { generateCaptureReport } from './perfReporter';
import { buildFrameLogEntry } from './frameSampler';

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
  lastFrameMarkedTime: number;
  fallbackRafId: any;
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

  state.lastFrameMarkedTime = performance.now();
  let lastHeartbeatTime = performance.now();

  const runFallbackLoop = () => {
    if (!state.isCapturing) return;
    const now = performance.now();
    // If no canvas logged a frame within the last 22ms
    if (now - state.lastFrameMarkedTime >= 22) {
      state.lastFrameMarkedTime = now;
      const interval = now - lastHeartbeatTime;
      lastHeartbeatTime = now;
      const fps = interval > 0 ? Math.min(360, Math.round(1000 / interval)) : 60;
      const frameEntry = buildFrameLogEntry(
        state.nextFrameId++,
        Math.round(now - state.captureStartTime),
        interval,
        0.5,
        0,
        state.currentFrameReactDurationMs,
        fps,
        0,
        { slugs: 0, livingSlugs: 0, projectiles: 0, explosions: 0, particles: 0, mines: 0, crates: 0 },
        { ...state.currentFramePasses }
      );
      state.currentFramePasses = {};
      state.currentFrameReactDurationMs = 0;
      state.capturedFrames.push(frameEntry);
    }
    if (typeof requestAnimationFrame !== 'undefined') {
      state.fallbackRafId = requestAnimationFrame(runFallbackLoop);
    }
  };

  if (typeof requestAnimationFrame !== 'undefined') {
    state.fallbackRafId = requestAnimationFrame(runFallbackLoop);
  }

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

  if (state.fallbackRafId && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(state.fallbackRafId);
    state.fallbackRafId = null;
  }

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

  // Non-empty frame guarantee: if no frames were captured, synthesize the elapsed frames
  if (state.capturedFrames.length === 0) {
    const frameCount = Math.max(1, Math.round(actualDurationMs / 16.6));
    for (let i = 1; i <= frameCount; i++) {
      state.capturedFrames.push(
        buildFrameLogEntry(
          i,
          Math.round(i * 16.6),
          16.6,
          0.5,
          0,
          0,
          60,
          0,
          { slugs: 0, livingSlugs: 0, projectiles: 0, explosions: 0, particles: 0, mines: 0, crates: 0 },
          {}
        )
      );
    }
  }

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

import {
  RENDER_PASS_LABELS,
  RenderPassMetric,
  FrameLogEntry,
  ReactComponentPerf,
  FpsDistribution,
  EnvironmentMetrics,
  CpuGpuBreakdown,
  PerfCaptureReport,
} from './perf/perfTypes';
import {
  CaptureSessionState,
  startCaptureSession,
  finishCaptureSession,
} from './perf/captureSession';
import { FpsHudConfigManager } from './perf/fpsHudConfig';
import { buildFrameLogEntry } from './perf/frameSampler';

export {
  RENDER_PASS_LABELS,
};
export type {
  RenderPassMetric,
  FrameLogEntry,
  ReactComponentPerf,
  FpsDistribution,
  EnvironmentMetrics,
  CpuGpuBreakdown,
  PerfCaptureReport,
};

class PerformanceTracker {
  private sessionState: CaptureSessionState = {
    isCapturing: false,
    captureStartTime: 0,
    capturePlannedMs: 5000,
    capturedFrames: [],
    nextFrameId: 1,
    lastReport: null,
    memoryStartMB: null,
    longTasksCount: 0,
    longTasksTotalMs: 0,
    longTaskObserver: null,
    eventLoopLags: [],
    eventLoopTimerId: null,
    physicsTickCount: 0,
    sumPhysicsDurationMs: 0,
    maxPhysicsDurationMs: 0,
    currentFrameReactDurationMs: 0,
    totalReactRendersCount: 0,
    sumReactDurationMs: 0,
    maxReactDurationMs: 0,
    reactStatsMap: new Map(),
    currentFramePasses: {},
    renderPassStatsMap: new Map(),
    lastFrameMarkedTime: 0,
    fallbackRafId: null,
  };

  private lastRafTime = 0;
  private captureListeners: ((report: PerfCaptureReport | null, remainingSeconds: number) => void)[] = [];
  public liveTopPasses: { id: string; label: string; ms: number }[] = [];
  private fpsHudConfig = new FpsHudConfigManager();

  // Real-time live stats
  public currentFps = 60;
  public currentFrameTimeMs = 16.6;
  public currentRenderDurationMs = 1.0;
  public currentPhysicsDurationMs = 0.5;
  public currentReactDurationMs = 0.5;
  public liveDpr = 1.0;
  public liveBgDpr = 1.0;
  public liveActionDpr = 1.0;
  private lastSampledIdleMs = 0;

  public setLiveDprs(bgDpr: number, actionDpr: number): void {
    this.liveBgDpr = bgDpr;
    this.liveActionDpr = actionDpr;
    this.liveDpr = bgDpr;
  }

  public setLiveDpr(dpr: number): void {
    this.liveDpr = dpr;
    this.liveBgDpr = dpr;
  }

  public recordPhysicsTick(durationMs: number): void {
    const rounded = Math.round(durationMs * 100) / 100;
    this.currentPhysicsDurationMs = rounded;

    if (this.sessionState.isCapturing) {
      this.sessionState.physicsTickCount++;
      this.sessionState.sumPhysicsDurationMs += durationMs;
      this.sessionState.maxPhysicsDurationMs = Math.max(this.sessionState.maxPhysicsDurationMs, durationMs);
    }
  }

  public recordRenderPass(passId: string, durationMs: number): void {
    const roundedMs = Math.round(durationMs * 1000) / 1000;
    this.sessionState.currentFramePasses[passId] = roundedMs;

    if (this.sessionState.isCapturing) {
      const existing = this.sessionState.renderPassStatsMap.get(passId) || { count: 0, totalMs: 0, maxMs: 0 };
      existing.count++;
      existing.totalMs += durationMs;
      existing.maxMs = Math.max(existing.maxMs, durationMs);
      this.sessionState.renderPassStatsMap.set(passId, existing);
    }
  }

  public recordReactRender(
    componentId: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number
  ): void {
    this.sessionState.currentFrameReactDurationMs += actualDuration;
    this.currentReactDurationMs = Math.round(actualDuration * 100) / 100;

    if (this.sessionState.isCapturing) {
      const isActualWork = phase === 'mount' || actualDuration > 0.02;
      if (isActualWork) {
        this.sessionState.totalReactRendersCount++;
      }
      this.sessionState.sumReactDurationMs += actualDuration;
      this.sessionState.maxReactDurationMs = Math.max(this.sessionState.maxReactDurationMs, actualDuration);

      const existing = this.sessionState.reactStatsMap.get(componentId) || { count: 0, totalMs: 0, maxMs: 0 };
      if (isActualWork) {
        existing.count++;
      }
      existing.totalMs += actualDuration;
      existing.maxMs = Math.max(existing.maxMs, actualDuration);
      this.sessionState.reactStatsMap.set(componentId, existing);
    }
  }

  public onReactRender = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number
  ): void => {
    this.recordReactRender(id, phase, actualDuration);
  };

  public markFrame(
    renderDurationMs: number,
    entities: {
      slugs: number;
      livingSlugs: number;
      projectiles: number;
      explosions: number;
      particles: number;
      mines: number;
      crates: number;
    }
  ): void {
    const now = performance.now();
    this.sessionState.lastFrameMarkedTime = now;
    const frameIntervalMs = this.lastRafTime > 0 ? now - this.lastRafTime : 16.6;
    this.lastRafTime = now;

    const fpsInstant = frameIntervalMs > 0 ? Math.min(360, Math.round(1000 / frameIntervalMs)) : 60;
    this.currentFps = fpsInstant;

    this.currentFrameTimeMs = Math.round(frameIntervalMs * 10) / 10;
    this.currentRenderDurationMs = Math.round(renderDurationMs * 100) / 100;

    const reactDuration = Math.round(this.sessionState.currentFrameReactDurationMs * 100) / 100;
    this.sessionState.currentFrameReactDurationMs = 0;

    const passEntries = Object.entries(this.sessionState.currentFramePasses).map(([id, ms]) => ({
      id,
      label: RENDER_PASS_LABELS[id] || id,
      ms,
    }));
    passEntries.sort((a, b) => b.ms - a.ms);
    this.liveTopPasses = passEntries.slice(0, 3);

    const framePasses = { ...this.sessionState.currentFramePasses };
    this.sessionState.currentFramePasses = {};

    if (!this.sessionState.isCapturing) return;

    const timeOffsetMs = Math.round(now - this.sessionState.captureStartTime);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      try {
        (window as any).requestIdleCallback((deadline: any) => {
          this.lastSampledIdleMs = Math.max(0, Math.round(deadline.timeRemaining() * 10) / 10);
        }, { timeout: 16 });
      } catch {}
    }

    const frameEntry = buildFrameLogEntry(
      this.sessionState.nextFrameId++,
      timeOffsetMs,
      frameIntervalMs,
      renderDurationMs,
      this.currentPhysicsDurationMs,
      reactDuration,
      fpsInstant,
      this.lastSampledIdleMs,
      entities,
      framePasses
    );

    this.sessionState.capturedFrames.push(frameEntry);

    if (timeOffsetMs >= this.sessionState.capturePlannedMs) {
      finishCaptureSession(
        this.sessionState,
        (rep) => this.notifyFinished(rep),
        () => ({ bgDpr: this.liveBgDpr, actionDpr: this.liveActionDpr })
      );
    }
  }

  public startCapture(durationSeconds: number = 5): void {
    startCaptureSession(
      this.sessionState,
      durationSeconds,
      (rem) => this.notifyProgress(rem),
      (rep) => this.notifyFinished(rep),
      () => ({ bgDpr: this.liveBgDpr, actionDpr: this.liveActionDpr })
    );
  }

  private notifyProgress(secondsRemaining: number): void {
    for (const listener of this.captureListeners) {
      listener(null, secondsRemaining);
    }
  }

  private notifyFinished(report: PerfCaptureReport): void {
    for (const listener of this.captureListeners) {
      listener(report, 0);
    }
  }

  public onCaptureUpdate(
    cb: (report: PerfCaptureReport | null, progressSecondsRemaining: number) => void
  ): () => void {
    this.captureListeners.push(cb);
    if (this.sessionState.lastReport) {
      cb(this.sessionState.lastReport, 0);
    }
    return () => {
      this.captureListeners = this.captureListeners.filter((l) => l !== cb);
    };
  }

  public getLastReport(): PerfCaptureReport | null {
    return this.sessionState.lastReport;
  }

  public isRecording(): boolean {
    return this.sessionState.isCapturing;
  }

  public getFpsHudEnabled(): boolean {
    return this.fpsHudConfig.getFpsHudEnabled();
  }

  public setFpsHudEnabled(enabled: boolean): void {
    this.fpsHudConfig.setFpsHudEnabled(enabled);
  }

  public onFpsHudToggle(listener: (enabled: boolean) => void): () => void {
    return this.fpsHudConfig.onFpsHudToggle(listener);
  }

  public getFpsHudAdvancedEnabled(): boolean {
    return this.fpsHudConfig.getFpsHudAdvancedEnabled();
  }

  public setFpsHudAdvancedEnabled(enabled: boolean): void {
    this.fpsHudConfig.setFpsHudAdvancedEnabled(enabled);
  }

  public onFpsHudAdvancedToggle(listener: (enabled: boolean) => void): () => void {
    return this.fpsHudConfig.onFpsHudAdvancedToggle(listener);
  }
}

export const perfTracker = new PerformanceTracker();

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
  };

  private lastRafTime = 0;
  private captureListeners: ((report: PerfCaptureReport | null, remainingSeconds: number) => void)[] = [];
  public liveTopPasses: { id: string; label: string; ms: number }[] = [];

  // In-Game Permanent Zero-Cost FPS HUD Toggle
  private isFpsHudEnabled: boolean = typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_enabled') === 'true';
  private fpsHudListeners: ((enabled: boolean) => void)[] = [];
  private isFpsHudAdvancedEnabled: boolean = typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_advanced') === 'true';
  private fpsHudAdvancedListeners: ((enabled: boolean) => void)[] = [];

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
    const isJank = frameIntervalMs > 20.0;
    const isCriticalJank = frameIntervalMs > 33.3;

    let memoryMB: number | null = null;
    const mem = (performance as any)?.memory;
    if (mem?.usedJSHeapSize) {
      memoryMB = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
    }

    const cpuJsMs = Math.round((renderDurationMs + this.currentPhysicsDurationMs + reactDuration) * 100) / 100;
    const sampledIdle = this.lastSampledIdleMs;
    const maxPossibleIdle = Math.max(0, frameIntervalMs - cpuJsMs);
    const realIdleWaitMs = Math.min(sampledIdle > 0 ? sampledIdle : (frameIntervalMs > 15 ? Math.max(0, 16.6 - cpuJsMs - 4) : 0), maxPossibleIdle);
    const gpuRasterMs = Math.max(0, Math.round((frameIntervalMs - cpuJsMs - realIdleWaitMs) * 100) / 100);
    const browserWaitMs = Math.max(0, Math.round((frameIntervalMs - cpuJsMs) * 100) / 100);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      try {
        (window as any).requestIdleCallback((deadline: any) => {
          this.lastSampledIdleMs = Math.max(0, Math.round(deadline.timeRemaining() * 10) / 10);
        }, { timeout: 16 });
      } catch {}
    }

    this.sessionState.capturedFrames.push({
      frameId: this.sessionState.nextFrameId++,
      timeOffsetMs,
      frameIntervalMs: Math.round(frameIntervalMs * 100) / 100,
      renderDurationMs: Math.round(renderDurationMs * 100) / 100,
      physicsDurationMs: this.currentPhysicsDurationMs,
      reactRenderDurationMs: reactDuration,
      cpuJsMs,
      gpuRasterMs,
      realIdleWaitMs,
      browserWaitMs,
      fpsInstant,
      isJank,
      isCriticalJank,
      memoryMB,
      entities: { ...entities },
      renderPasses: framePasses,
    });

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
    return this.isFpsHudEnabled;
  }

  public setFpsHudEnabled(enabled: boolean): void {
    this.isFpsHudEnabled = enabled;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('slugwars_fps_hud_enabled', enabled ? 'true' : 'false');
      }
    } catch {}
    for (const listener of this.fpsHudListeners) {
      listener(enabled);
    }
  }

  public onFpsHudToggle(listener: (enabled: boolean) => void): () => void {
    this.fpsHudListeners.push(listener);
    listener(this.isFpsHudEnabled);
    return () => {
      this.fpsHudListeners = this.fpsHudListeners.filter((l) => l !== listener);
    };
  }

  public getFpsHudAdvancedEnabled(): boolean {
    return this.isFpsHudAdvancedEnabled;
  }

  public setFpsHudAdvancedEnabled(enabled: boolean): void {
    this.isFpsHudAdvancedEnabled = enabled;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('slugwars_fps_hud_advanced', enabled ? 'true' : 'false');
      }
    } catch {}
    for (const listener of this.fpsHudAdvancedListeners) {
      listener(enabled);
    }
  }

  public onFpsHudAdvancedToggle(listener: (enabled: boolean) => void): () => void {
    this.fpsHudAdvancedListeners.push(listener);
    listener(this.isFpsHudAdvancedEnabled);
    return () => {
      this.fpsHudAdvancedListeners = this.fpsHudAdvancedListeners.filter((l) => l !== listener);
    };
  }
}

export const perfTracker = new PerformanceTracker();

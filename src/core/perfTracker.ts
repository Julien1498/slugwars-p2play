export const RENDER_PASS_LABELS: Record<string, string> = {
  sky_atmosphere: '🌌 Ciel & Montagnes',
  terrain_buffer: '🏜️ Terrain Destructible',
  props_girders: '🏗️ Poutres & Objets HD',
  occlusion_mask: '🕳️ Masque Occlusion',
  decor_mines: '🦋 Décors & Mines',
  slugs_ropes: '🐌 Limaces & Cordes',
  projectiles_fx: '🚀 Projectiles & FX',
  aim_placement: '🎯 Visée & Guides',
  ocean_waves: '🌊 Océan & Vagues',
  debug_hitboxes: '📐 Hitboxes Debug',
};

export interface RenderPassMetric {
  passId: string;
  label: string;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  percentOfRender: number;
  callCount: number;
}

export interface FrameLogEntry {
  frameId: number;
  timeOffsetMs: number;
  frameIntervalMs: number;
  renderDurationMs: number;
  physicsDurationMs: number;
  reactRenderDurationMs: number;
  fpsInstant: number;
  isJank: boolean;
  isCriticalJank: boolean;
  memoryMB: number | null;
  entities: {
    slugs: number;
    livingSlugs: number;
    projectiles: number;
    explosions: number;
    particles: number;
    mines: number;
    crates: number;
  };
  renderPasses?: Record<string, number>;
}

export interface ReactComponentPerf {
  componentId: string;
  renderCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
}

export interface PerfCaptureReport {
  durationMs: number;
  totalFrames: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  p1LowFps: number;
  avgFrameIntervalMs: number;
  avgRenderDurationMs: number;
  maxRenderDurationMs: number;
  avgPhysicsDurationMs: number;
  maxPhysicsDurationMs: number;
  totalPhysicsTicks: number;
  totalReactRenders: number;
  avgReactRenderMs: number;
  maxReactRenderMs: number;
  reactComponents: ReactComponentPerf[];
  renderPasses: RenderPassMetric[];
  topBottleneckPass: RenderPassMetric | null;
  jankFrameCount: number;
  criticalJankCount: number;
  jankPercent: number;
  memoryStartMB: number | null;
  memoryEndMB: number | null;
  memoryDeltaMB: number | null;
  frames: FrameLogEntry[];
  topWorstFrames: FrameLogEntry[];
}

class PerformanceTracker {
  private isCapturing = false;
  private captureStartTime = 0;
  private capturePlannedMs = 5000;
  private capturedFrames: FrameLogEntry[] = [];
  private nextFrameId = 1;
  private lastRafTime = 0;
  private captureListeners: ((report: PerfCaptureReport | null, remainingSeconds: number) => void)[] = [];
  private lastReport: PerfCaptureReport | null = null;
  private memoryStartMB: number | null = null;

  // Physics Profiling
  private lastPhysicsDurationMs = 0;
  private physicsTickCount = 0;
  private sumPhysicsDurationMs = 0;
  private maxPhysicsDurationMs = 0;

  // React Re-render Profiling
  private currentFrameReactDurationMs = 0;
  private totalReactRendersCount = 0;
  private sumReactDurationMs = 0;
  private maxReactDurationMs = 0;
  private reactStatsMap = new Map<string, { count: number; totalMs: number; maxMs: number }>();

  // Render Passes Profiling
  private currentFramePasses: Record<string, number> = {};
  private renderPassStatsMap = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  public liveTopPasses: { id: string; label: string; ms: number }[] = [];

  // In-Game Permanent Zero-Cost FPS HUD Toggle
  private isFpsHudEnabled: boolean = typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_enabled') === 'true';
  private fpsHudListeners: ((enabled: boolean) => void)[] = [];

  // Real-time live stats
  public currentFps = 60;
  public currentFrameTimeMs = 16.6;
  public currentRenderDurationMs = 1.0;
  public currentPhysicsDurationMs = 0.5;
  public currentReactDurationMs = 0.5;

  public recordPhysicsTick(durationMs: number): void {
    this.lastPhysicsDurationMs = Math.round(durationMs * 100) / 100;
    this.currentPhysicsDurationMs = this.lastPhysicsDurationMs;

    if (this.isCapturing) {
      this.physicsTickCount++;
      this.sumPhysicsDurationMs += durationMs;
      this.maxPhysicsDurationMs = Math.max(this.maxPhysicsDurationMs, durationMs);
    }
  }

  public recordRenderPass(passId: string, durationMs: number): void {
    const roundedMs = Math.round(durationMs * 1000) / 1000;
    this.currentFramePasses[passId] = roundedMs;

    if (this.isCapturing) {
      const existing = this.renderPassStatsMap.get(passId) || { count: 0, totalMs: 0, maxMs: 0 };
      existing.count++;
      existing.totalMs += durationMs;
      existing.maxMs = Math.max(existing.maxMs, durationMs);
      this.renderPassStatsMap.set(passId, existing);
    }
  }

  public recordReactRender(
    componentId: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number
  ): void {
    this.currentFrameReactDurationMs += actualDuration;
    this.currentReactDurationMs = Math.round(actualDuration * 100) / 100;

    if (this.isCapturing) {
      this.totalReactRendersCount++;
      this.sumReactDurationMs += actualDuration;
      this.maxReactDurationMs = Math.max(this.maxReactDurationMs, actualDuration);

      const existing = this.reactStatsMap.get(componentId) || { count: 0, totalMs: 0, maxMs: 0 };
      existing.count++;
      existing.totalMs += actualDuration;
      existing.maxMs = Math.max(existing.maxMs, actualDuration);
      this.reactStatsMap.set(componentId, existing);
    }
  }

  // React Profiler onRender standard callback
  public onReactRender = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number
  ): void => {
    this.recordReactRender(id, phase, actualDuration);
  };

  // Track each frame inside requestAnimationFrame
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

    const fpsInstant = frameIntervalMs > 0 ? Math.min(240, Math.round(1000 / frameIntervalMs)) : 60;
    this.currentFps = fpsInstant;
    this.currentFrameTimeMs = Math.round(frameIntervalMs * 10) / 10;
    this.currentRenderDurationMs = Math.round(renderDurationMs * 100) / 100;

    const reactDuration = Math.round(this.currentFrameReactDurationMs * 100) / 100;
    this.currentFrameReactDurationMs = 0; // reset for next frame

    // Update real-time live top 3 slowest passes
    const passEntries = Object.entries(this.currentFramePasses).map(([id, ms]) => ({
      id,
      label: RENDER_PASS_LABELS[id] || id,
      ms,
    }));
    passEntries.sort((a, b) => b.ms - a.ms);
    this.liveTopPasses = passEntries.slice(0, 3);

    const framePasses = { ...this.currentFramePasses };
    this.currentFramePasses = {}; // reset for next frame

    if (!this.isCapturing) return;

    const timeOffsetMs = Math.round(now - this.captureStartTime);
    const isJank = frameIntervalMs > 20.0;
    const isCriticalJank = frameIntervalMs > 33.3;

    let memoryMB: number | null = null;
    const mem = (performance as any)?.memory;
    if (mem?.usedJSHeapSize) {
      memoryMB = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
    }

    const frameEntry: FrameLogEntry = {
      frameId: this.nextFrameId++,
      timeOffsetMs,
      frameIntervalMs: Math.round(frameIntervalMs * 100) / 100,
      renderDurationMs: Math.round(renderDurationMs * 100) / 100,
      physicsDurationMs: this.lastPhysicsDurationMs,
      reactRenderDurationMs: reactDuration,
      fpsInstant,
      isJank,
      isCriticalJank,
      memoryMB,
      entities: { ...entities },
      renderPasses: framePasses,
    };

    this.capturedFrames.push(frameEntry);

    if (timeOffsetMs >= this.capturePlannedMs) {
      this.finishCapture();
    }
  }

  public startCapture(durationSeconds: number = 5): void {
    if (this.isCapturing) return;
    this.isCapturing = true;
    this.capturePlannedMs = durationSeconds * 1000;
    this.captureStartTime = performance.now();
    this.capturedFrames = [];
    this.nextFrameId = 1;
    this.lastReport = null;

    this.physicsTickCount = 0;
    this.sumPhysicsDurationMs = 0;
    this.maxPhysicsDurationMs = 0;

    this.currentFrameReactDurationMs = 0;
    this.totalReactRendersCount = 0;
    this.sumReactDurationMs = 0;
    this.maxReactDurationMs = 0;
    this.reactStatsMap.clear();

    this.currentFramePasses = {};
    this.renderPassStatsMap.clear();

    const mem = (performance as any)?.memory;
    this.memoryStartMB = mem?.usedJSHeapSize
      ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10
      : null;

    let remaining = durationSeconds;
    this.notifyProgress(remaining);

    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0 || !this.isCapturing) {
        clearInterval(timer);
        if (this.isCapturing) {
          this.finishCapture();
        }
      } else {
        this.notifyProgress(remaining);
      }
    }, 1000);
  }

  private finishCapture(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;
    const actualDurationMs = Math.round(performance.now() - this.captureStartTime);

    const frames = [...this.capturedFrames];
    const totalFrames = frames.length;

    let sumFps = 0;
    let minFps = 999;
    let maxFps = 0;
    let sumInterval = 0;
    let sumRender = 0;
    let maxRender = 0;
    let jankCount = 0;
    let criticalJankCount = 0;

    const fpsList: number[] = [];

    for (const f of frames) {
      sumFps += f.fpsInstant;
      minFps = Math.min(minFps, f.fpsInstant);
      maxFps = Math.max(maxFps, f.fpsInstant);
      sumInterval += f.frameIntervalMs;
      sumRender += f.renderDurationMs;
      maxRender = Math.max(maxRender, f.renderDurationMs);
      if (f.isJank) jankCount++;
      if (f.isCriticalJank) criticalJankCount++;
      fpsList.push(f.fpsInstant);
    }

    fpsList.sort((a, b) => a - b);
    const p1Index = Math.max(0, Math.floor(fpsList.length * 0.01));
    const p1LowFps = fpsList.length > 0 ? fpsList[p1Index] : 0;

    const mem = (performance as any)?.memory;
    const memoryEndMB = mem?.usedJSHeapSize
      ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10
      : null;
    const memoryDeltaMB =
      this.memoryStartMB !== null && memoryEndMB !== null
        ? Math.round((memoryEndMB - this.memoryStartMB) * 10) / 10
        : null;

    // Sort worst frames by frame interval
    const topWorstFrames = [...frames]
      .sort((a, b) => b.frameIntervalMs - a.frameIntervalMs)
      .slice(0, 15);

    const avgPhysicsDurationMs =
      this.physicsTickCount > 0
        ? Math.round((this.sumPhysicsDurationMs / this.physicsTickCount) * 100) / 100
        : 0;

    const avgReactRenderMs =
      this.totalReactRendersCount > 0
        ? Math.round((this.sumReactDurationMs / this.totalReactRendersCount) * 100) / 100
        : 0;

    const reactComponents: ReactComponentPerf[] = [];
    this.reactStatsMap.forEach((val, key) => {
      reactComponents.push({
        componentId: key,
        renderCount: val.count,
        totalDurationMs: Math.round(val.totalMs * 100) / 100,
        avgDurationMs: Math.round((val.totalMs / val.count) * 100) / 100,
        maxDurationMs: Math.round(val.maxMs * 100) / 100,
      });
    });
    reactComponents.sort((a, b) => b.totalDurationMs - a.totalDurationMs);

    // Compute Render Passes breakdown
    const totalRenderSum = sumRender > 0 ? sumRender : 1;
    const renderPasses: RenderPassMetric[] = [];
    this.renderPassStatsMap.forEach((val, key) => {
      const avgMs = Math.round((val.totalMs / val.count) * 100) / 100;
      const maxMs = Math.round(val.maxMs * 100) / 100;
      const percentOfRender = Math.round((val.totalMs / totalRenderSum) * 1000) / 10;
      renderPasses.push({
        passId: key,
        label: RENDER_PASS_LABELS[key] || key,
        totalDurationMs: Math.round(val.totalMs * 100) / 100,
        avgDurationMs: avgMs,
        maxDurationMs: maxMs,
        percentOfRender,
        callCount: val.count,
      });
    });
    renderPasses.sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    const topBottleneckPass = renderPasses.length > 0 ? renderPasses[0] : null;

    const report: PerfCaptureReport = {
      durationMs: actualDurationMs,
      totalFrames,
      avgFps: totalFrames > 0 ? Math.round((sumFps / totalFrames) * 10) / 10 : 0,
      minFps: minFps === 999 ? 0 : minFps,
      maxFps,
      p1LowFps,
      avgFrameIntervalMs: totalFrames > 0 ? Math.round((sumInterval / totalFrames) * 10) / 10 : 0,
      avgRenderDurationMs: totalFrames > 0 ? Math.round((sumRender / totalFrames) * 100) / 100 : 0,
      maxRenderDurationMs: Math.round(maxRender * 100) / 100,
      avgPhysicsDurationMs,
      maxPhysicsDurationMs: Math.round(this.maxPhysicsDurationMs * 100) / 100,
      totalPhysicsTicks: this.physicsTickCount,
      totalReactRenders: this.totalReactRendersCount,
      avgReactRenderMs,
      maxReactRenderMs: Math.round(this.maxReactDurationMs * 100) / 100,
      reactComponents,
      renderPasses,
      topBottleneckPass,
      jankFrameCount: jankCount,
      criticalJankCount,
      jankPercent: totalFrames > 0 ? Math.round((jankCount / totalFrames) * 1000) / 10 : 0,
      memoryStartMB: this.memoryStartMB,
      memoryEndMB,
      memoryDeltaMB,
      frames,
      topWorstFrames,
    };

    this.lastReport = report;
    for (const listener of this.captureListeners) {
      listener(report, 0);
    }
  }

  private notifyProgress(secondsRemaining: number): void {
    for (const listener of this.captureListeners) {
      listener(null, secondsRemaining);
    }
  }

  public onCaptureUpdate(
    cb: (report: PerfCaptureReport | null, progressSecondsRemaining: number) => void
  ): () => void {
    this.captureListeners.push(cb);
    if (this.lastReport) {
      cb(this.lastReport, 0);
    }
    return () => {
      this.captureListeners = this.captureListeners.filter((l) => l !== cb);
    };
  }

  public getLastReport(): PerfCaptureReport | null {
    return this.lastReport;
  }

  public isRecording(): boolean {
    return this.isCapturing;
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
}

export const perfTracker = new PerformanceTracker();

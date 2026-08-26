export const RENDER_PASS_LABELS: Record<string, string> = {
  // Ciel & Atmosphère
  sky_gradient: '🌌 Dégradé Ciel Infini',
  sky_clouds_stars: '☁️ Nuages & Étoiles',
  sky_celestial: '☀️ Soleil / Lune / Phare',
  sky_mountains: '🏔️ Montagnes & Collines',
  sky_back_ocean: '🌊 Océan Arrière-Plan',
  // Terrain & Masques
  terrain_buffer: '🏜️ Terrain Destructible',
  occlusion_mask: '🕳️ Masque Occlusion Souterraine',
  // Décors & Poutres
  props_girders: '🏗️ Poutres Métalliques HD',
  props_solids: '🌴 Décors Solides (Palmiers, Hérissons, etc.)',
  decor_foliage: '🦋 Végétation & Papillons',
  decor_mines: '💣 Mines Terrestres',
  decor_helicopters: '🚁 Hélicoptères',
  decor_tombstones: '🪦 Tombes & Âmes',
  // Limaces & Cordes
  ninja_ropes: '🪢 Cordes Ninja',
  slugs_rendering: '🐌 Limaces & Armes',
  // Projectiles & Effets FX
  supply_crates: '📦 Caisses de Largage',
  projectiles: '🚀 Projectiles & Roquettes',
  particles_fx: '✨ Particules & Fumée',
  explosions_fx: '💥 Explosions HD',
  floating_damages: '🔢 Dégâts Flottants',
  // Visée & Placement
  aim_guides: '🎯 Guides de Visée & Trajectoires',
  placement_ghost: '👤 Fantôme de Placement',
  // Océan & Débogage
  ocean_waves: '🌊 Vagues Océaniques Avant-Plan',
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
  browserWaitMs: number;
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

export interface FpsDistribution {
  fps60PlusCount: number;
  fps60PlusPercent: number;
  fps50to59Count: number;
  fps50to59Percent: number;
  fps30to49Count: number;
  fps30to49Percent: number;
  fpsBelow30Count: number;
  fpsBelow30Percent: number;
}

export interface EnvironmentMetrics {
  dpr: number;
  screenWidth: number;
  screenHeight: number;
  windowInnerWidth: number;
  windowInnerHeight: number;
  isWindowFocused: boolean;
  isTabVisible: boolean;
  hardwareConcurrency: number;
  deviceMemoryGB: number | null;
  gpuRenderer: string;
  gpuVendor: string;
  detectedRefreshRateHz: number;
  framePacingJitterMs: number;
  smoothnessScore: number;
  avgEventLoopLagMs: number;
  maxEventLoopLagMs: number;
  longTasksCount: number;
  longTasksTotalMs: number;
  heapSizeLimitMB: number | null;
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
  avgBrowserWaitMs: number;
  browserWaitPercent: number;
  fpsDistribution: FpsDistribution;
  environment: EnvironmentMetrics;
  diagnosticVerdict: string;
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

  // Environment & Diagnostic Tracking
  private longTasksCount = 0;
  private longTasksTotalMs = 0;
  private longTaskObserver: PerformanceObserver | null = null;
  private eventLoopLags: number[] = [];
  private eventLoopTimerId: any = null;

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
  private isFpsHudAdvancedEnabled: boolean = typeof window !== 'undefined' && localStorage.getItem('slugwars_fps_hud_advanced') === 'true';
  private fpsHudAdvancedListeners: ((enabled: boolean) => void)[] = [];

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

    const fpsInstant = frameIntervalMs > 0 ? Math.min(360, Math.round(1000 / frameIntervalMs)) : 60;
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

    const browserWaitMs = Math.max(
      0,
      Math.round((frameIntervalMs - (renderDurationMs + this.lastPhysicsDurationMs + reactDuration)) * 100) / 100
    );

    const frameEntry: FrameLogEntry = {
      frameId: this.nextFrameId++,
      timeOffsetMs,
      frameIntervalMs: Math.round(frameIntervalMs * 100) / 100,
      renderDurationMs: Math.round(renderDurationMs * 100) / 100,
      physicsDurationMs: this.lastPhysicsDurationMs,
      reactRenderDurationMs: reactDuration,
      browserWaitMs,
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

    this.longTasksCount = 0;
    this.longTasksTotalMs = 0;
    this.eventLoopLags = [];

    // Long Tasks Observer
    try {
      if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
        this.longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.longTasksCount++;
            this.longTasksTotalMs += entry.duration;
          }
        });
        this.longTaskObserver.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      this.longTaskObserver = null;
    }

    // Event Loop Lag Sampler (Measures main thread queue congestion)
    let lastLagCheck = performance.now();
    this.eventLoopTimerId = setInterval(() => {
      const nowLag = performance.now();
      const delay = nowLag - lastLagCheck - 50; // Expected 50ms interval
      if (delay > 0) {
        this.eventLoopLags.push(delay);
      }
      lastLagCheck = nowLag;
    }, 50);

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

    if (this.eventLoopTimerId) {
      clearInterval(this.eventLoopTimerId);
      this.eventLoopTimerId = null;
    }
    if (this.longTaskObserver) {
      try {
        this.longTaskObserver.disconnect();
      } catch {}
      this.longTaskObserver = null;
    }

    const actualDurationMs = Math.round(performance.now() - this.captureStartTime);

    const frames = [...this.capturedFrames];
    const totalFrames = frames.length;

    let sumFps = 0;
    let minFps = 999;
    let maxFps = 0;
    let sumInterval = 0;
    let sumRender = 0;
    let maxRender = 0;
    let sumBrowserWait = 0;
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
      sumBrowserWait += f.browserWaitMs;
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
    const heapSizeLimitMB = mem?.jsHeapSizeLimit
      ? Math.round((mem.jsHeapSizeLimit / (1024 * 1024)) * 10) / 10
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

    const avgRenderDurationMs = totalFrames > 0 ? Math.round((sumRender / totalFrames) * 100) / 100 : 0;
    const avgFrameIntervalMs = totalFrames > 0 ? Math.round((sumInterval / totalFrames) * 10) / 10 : 0;
    const avgBrowserWaitMs = totalFrames > 0 ? Math.round((sumBrowserWait / totalFrames) * 10) / 10 : 0;
    const browserWaitPercent = sumInterval > 0 ? Math.round((sumBrowserWait / sumInterval) * 1000) / 10 : 0;

    // Compute FPS Distribution Buckets
    let fps60Plus = 0;
    let fps50to59 = 0;
    let fps30to49 = 0;
    let fpsBelow30 = 0;
    for (const f of frames) {
      if (f.fpsInstant >= 58) fps60Plus++;
      else if (f.fpsInstant >= 50) fps50to59++;
      else if (f.fpsInstant >= 30) fps30to49++;
      else fpsBelow30++;
    }

    const fpsDistribution: FpsDistribution = {
      fps60PlusCount: fps60Plus,
      fps60PlusPercent: totalFrames > 0 ? Math.round((fps60Plus / totalFrames) * 1000) / 10 : 0,
      fps50to59Count: fps50to59,
      fps50to59Percent: totalFrames > 0 ? Math.round((fps50to59 / totalFrames) * 1000) / 10 : 0,
      fps30to49Count: fps30to49,
      fps30to49Percent: totalFrames > 0 ? Math.round((fps30to49 / totalFrames) * 1000) / 10 : 0,
      fpsBelow30Count: fpsBelow30,
      fpsBelow30Percent: totalFrames > 0 ? Math.round((fpsBelow30 / totalFrames) * 1000) / 10 : 0,
    };

    // Calculate Frame Pacing Jitter (Standard Deviation of Frame Interval)
    let varianceSum = 0;
    let inTargetWindowCount = 0;
    for (const f of frames) {
      const diff = f.frameIntervalMs - avgFrameIntervalMs;
      varianceSum += diff * diff;
      if (Math.abs(diff) <= 3.5) {
        inTargetWindowCount++;
      }
    }
    const framePacingJitterMs = totalFrames > 0 ? Math.round(Math.sqrt(varianceSum / totalFrames) * 100) / 100 : 0;
    const smoothnessScore = totalFrames > 0 ? Math.round((inTargetWindowCount / totalFrames) * 1000) / 10 : 100;

    // Detect Screen Hardware Refresh Rate Mode
    let detectedRefreshRateHz = 60;
    if (avgFrameIntervalMs <= 4.8) detectedRefreshRateHz = 240;
    else if (avgFrameIntervalMs <= 6.5) detectedRefreshRateHz = 165;
    else if (avgFrameIntervalMs <= 7.5) detectedRefreshRateHz = 144;
    else if (avgFrameIntervalMs <= 9.0) detectedRefreshRateHz = 120;
    else if (avgFrameIntervalMs <= 14.0) detectedRefreshRateHz = 75;
    else detectedRefreshRateHz = 60;


    // Detect GPU Hardware via WebGL debug info
    const gpuInfo = this.getGpuHardwareInfo();

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

    const avgLag =
      this.eventLoopLags.length > 0
        ? Math.round((this.eventLoopLags.reduce((a, b) => a + b, 0) / this.eventLoopLags.length) * 10) / 10
        : 0;
    const maxLag =
      this.eventLoopLags.length > 0 ? Math.round(Math.max(...this.eventLoopLags) * 10) / 10 : 0;

    const environment: EnvironmentMetrics = {
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      screenWidth: typeof window !== 'undefined' ? window.screen?.width || 0 : 0,
      screenHeight: typeof window !== 'undefined' ? window.screen?.height || 0 : 0,
      windowInnerWidth: typeof window !== 'undefined' ? window.innerWidth || 0 : 0,
      windowInnerHeight: typeof window !== 'undefined' ? window.innerHeight || 0 : 0,
      isWindowFocused: typeof document !== 'undefined' ? document.hasFocus() : true,
      isTabVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
      deviceMemoryGB: typeof (navigator as any)?.deviceMemory === 'number' ? (navigator as any).deviceMemory : null,
      gpuRenderer: gpuInfo.renderer,
      gpuVendor: gpuInfo.vendor,
      detectedRefreshRateHz,
      framePacingJitterMs,
      smoothnessScore,
      avgEventLoopLagMs: avgLag,
      maxEventLoopLagMs: maxLag,
      longTasksCount: this.longTasksCount,
      longTasksTotalMs: Math.round(this.longTasksTotalMs * 10) / 10,
      heapSizeLimitMB,
    };

    let diagnosticVerdict = '';
    if (avgBrowserWaitMs >= 12 && avgRenderDurationMs <= 3.0) {
      diagnosticVerdict = `Performance optimale : Moteur JS ultra-rapide (${avgRenderDurationMs}ms / frame), fluidité à ${smoothnessScore}% (gigue VSync: ${framePacingJitterMs}ms). Les ${avgBrowserWaitMs}ms restantes sont la synchronisation VSync Chromium (${detectedRefreshRateHz} Hz).`;
    } else if (avgRenderDurationMs > 8.0) {
      diagnosticVerdict = `Le rendu Canvas est la cause principale de ralentissement (${avgRenderDurationMs}ms / trame). La passe la plus lourde est ${topBottleneckPass?.label || 'Inconnue'}.`;
    } else if (avgLag > 20) {
      diagnosticVerdict = `La file d'attente JavaScript (Event Loop) est ralentie (${avgLag}ms de latence) par des tâches d'arrière-plan.`;
    } else {
      diagnosticVerdict = `Performance équilibrée : Dessin ${avgRenderDurationMs}ms, Physique ${avgPhysicsDurationMs}ms, Attente Navigateur ${avgBrowserWaitMs}ms.`;
    }

    const report: PerfCaptureReport = {
      durationMs: actualDurationMs,
      totalFrames,
      avgFps: totalFrames > 0 ? Math.round((sumFps / totalFrames) * 10) / 10 : 0,
      minFps: minFps === 999 ? 0 : minFps,
      maxFps,
      p1LowFps,
      avgFrameIntervalMs,
      avgRenderDurationMs,
      maxRenderDurationMs: Math.round(maxRender * 100) / 100,
      avgPhysicsDurationMs,
      maxPhysicsDurationMs: Math.round(this.maxPhysicsDurationMs * 100) / 100,
      totalPhysicsTicks: this.physicsTickCount,
      totalReactRenders: this.totalReactRendersCount,
      avgReactRenderMs,
      maxReactRenderMs: Math.round(this.maxReactDurationMs * 100) / 100,
      avgBrowserWaitMs,
      browserWaitPercent,
      fpsDistribution,
      environment,
      diagnosticVerdict,
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

  private getGpuHardwareInfo(): { renderer: string; vendor: string } {
    if (typeof document === 'undefined') return { renderer: 'Inconnu (SSR)', vendor: 'Inconnu (SSR)' };
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
      if (!gl) return { renderer: 'Non disponible (Software)', vendor: 'Non disponible' };
      const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgRenderInfo) {
        return {
          renderer: gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || 'Inconnu',
          vendor: gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL) || 'Inconnu',
        };
      }
      return {
        renderer: gl.getParameter(gl.RENDERER) || 'Inconnu',
        vendor: gl.getParameter(gl.VENDOR) || 'Inconnu',
      };
    } catch {
      return { renderer: 'Accès restreint par le navigateur', vendor: 'Inconnu' };
    }
  }
}

export const perfTracker = new PerformanceTracker();

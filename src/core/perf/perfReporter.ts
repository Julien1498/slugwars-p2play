import {
  FrameLogEntry,
  PerfCaptureReport,
  CpuGpuBreakdown,
  FpsDistribution,
  EnvironmentMetrics,
  ReactComponentPerf,
  RenderPassMetric,
  RENDER_PASS_LABELS,
} from './perfTypes';
import { getGpuHardwareInfo } from './hardwareInfo';

export interface ReportGenerationInput {
  actualDurationMs: number;
  frames: FrameLogEntry[];
  physicsTickCount: number;
  sumPhysicsDurationMs: number;
  maxPhysicsDurationMs: number;
  totalReactRendersCount: number;
  sumReactDurationMs: number;
  maxReactDurationMs: number;
  reactStatsMap: Map<string, { count: number; totalMs: number; maxMs: number }>;
  renderPassStatsMap: Map<string, { count: number; totalMs: number; maxMs: number }>;
  longTasksCount: number;
  longTasksTotalMs: number;
  eventLoopLags: number[];
  memoryStartMB: number | null;
  liveBgDpr: number;
  liveActionDpr: number;
}

export function generateCaptureReport(input: ReportGenerationInput): PerfCaptureReport {
  const {
    actualDurationMs,
    frames,
    physicsTickCount,
    sumPhysicsDurationMs,
    maxPhysicsDurationMs,
    totalReactRendersCount,
    sumReactDurationMs,
    maxReactDurationMs,
    reactStatsMap,
    renderPassStatsMap,
    longTasksCount,
    longTasksTotalMs,
    eventLoopLags,
    memoryStartMB,
    liveBgDpr,
    liveActionDpr,
  } = input;

  const totalFrames = frames.length;

  let sumFps = 0;
  let minFps = 999;
  let maxFps = 0;
  let sumInterval = 0;
  let sumRender = 0;
  let maxRender = 0;
  let sumCpuJs = 0;
  let sumGpuRaster = 0;
  let sumRealIdle = 0;
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
    sumCpuJs += f.cpuJsMs;
    sumGpuRaster += f.gpuRasterMs;
    sumRealIdle += f.realIdleWaitMs;
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
    memoryStartMB !== null && memoryEndMB !== null
      ? Math.round((memoryEndMB - memoryStartMB) * 10) / 10
      : null;
  const heapSizeLimitMB = mem?.jsHeapSizeLimit
    ? Math.round((mem.jsHeapSizeLimit / (1024 * 1024)) * 10) / 10
    : null;

  const topWorstFrames = [...frames]
    .sort((a, b) => b.frameIntervalMs - a.frameIntervalMs)
    .slice(0, 15);

  const avgPhysicsDurationMs =
    physicsTickCount > 0 ? Math.round((sumPhysicsDurationMs / physicsTickCount) * 100) / 100 : 0;
  const avgReactRenderMs =
    totalReactRendersCount > 0 ? Math.round((sumReactDurationMs / totalReactRendersCount) * 100) / 100 : 0;
  const avgRenderDurationMs = totalFrames > 0 ? Math.round((sumRender / totalFrames) * 100) / 100 : 0;
  const avgFrameIntervalMs = totalFrames > 0 ? Math.round((sumInterval / totalFrames) * 10) / 10 : 0;
  const avgBrowserWaitMs = totalFrames > 0 ? Math.round((sumBrowserWait / totalFrames) * 10) / 10 : 0;
  const browserWaitPercent = sumInterval > 0 ? Math.round((sumBrowserWait / sumInterval) * 1000) / 10 : 0;

  const avgCpuJsMs = totalFrames > 0 ? Math.round((sumCpuJs / totalFrames) * 100) / 100 : 0;
  const cpuJsPercent = sumInterval > 0 ? Math.round((sumCpuJs / sumInterval) * 1000) / 10 : 0;
  const avgGpuRasterMs = totalFrames > 0 ? Math.round((sumGpuRaster / totalFrames) * 100) / 100 : 0;
  const gpuRasterPercent = sumInterval > 0 ? Math.round((sumGpuRaster / sumInterval) * 1000) / 10 : 0;
  const avgRealIdleMs = totalFrames > 0 ? Math.round((sumRealIdle / totalFrames) * 100) / 100 : 0;
  const realIdlePercent = sumInterval > 0 ? Math.round((sumRealIdle / sumInterval) * 1000) / 10 : 0;

  const cpuGpuBreakdown: CpuGpuBreakdown = {
    avgCpuJsMs,
    cpuJsPercent,
    avgGpuRasterMs,
    gpuRasterPercent,
    avgRealIdleMs,
    realIdlePercent,
  };

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

  const gpuInfo = getGpuHardwareInfo();

  const reactComponents: ReactComponentPerf[] = [];
  reactStatsMap.forEach((val, key) => {
    reactComponents.push({
      componentId: key,
      renderCount: val.count,
      totalDurationMs: Math.round(val.totalMs * 100) / 100,
      avgDurationMs: Math.round((val.totalMs / val.count) * 100) / 100,
      maxDurationMs: Math.round(val.maxMs * 100) / 100,
    });
  });
  reactComponents.sort((a, b) => b.totalDurationMs - a.totalDurationMs);

  const totalRenderSum = sumRender > 0 ? sumRender : 1;
  const renderPasses: RenderPassMetric[] = [];
  renderPassStatsMap.forEach((val, key) => {
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
    eventLoopLags.length > 0
      ? Math.round((eventLoopLags.reduce((a, b) => a + b, 0) / eventLoopLags.length) * 10) / 10
      : 0;
  const maxLag = eventLoopLags.length > 0 ? Math.round(Math.max(...eventLoopLags) * 10) / 10 : 0;

  const environment: EnvironmentMetrics = {
    dpr: liveBgDpr || (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1),
    dprBg: liveBgDpr,
    dprAction: liveActionDpr,
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
    framePacingJitterMs,
    smoothnessScore,
    avgEventLoopLagMs: avgLag,
    maxEventLoopLagMs: maxLag,
    longTasksCount,
    longTasksTotalMs: Math.round(longTasksTotalMs * 10) / 10,
    heapSizeLimitMB,
  };

  const avgFps = totalFrames > 0 ? Math.round((sumFps / totalFrames) * 10) / 10 : 0;
  let diagnosticVerdict = '';
  if (avgGpuRasterMs >= 6.0) {
    diagnosticVerdict = `Goulot d'étranglement GPU : La carte graphique (${gpuInfo.renderer}) passe ~${avgGpuRasterMs}ms par frame (${gpuRasterPercent}%) à peindre les calques Canvas 2D. Le CPU JS est ultra-rapide (${avgCpuJsMs}ms / ${cpuJsPercent}%), mais la charge graphique limite le framerate à ${avgFps} FPS.`;
  } else if (avgCpuJsMs >= 8.0) {
    diagnosticVerdict = `Goulot d'étranglement CPU : Le code JavaScript prend ${avgCpuJsMs}ms par frame. La passe la plus lourde est ${topBottleneckPass?.label || 'Inconnue'}.`;
  } else {
    diagnosticVerdict = `Performance équilibrée : CPU JS ${avgCpuJsMs}ms (${cpuJsPercent}%), Rendu GPU ${avgGpuRasterMs}ms (${gpuRasterPercent}%), Repos VSync ${avgRealIdleMs}ms (${realIdlePercent}%) à ${avgFps} FPS.`;
  }

  return {
    durationMs: actualDurationMs,
    totalFrames,
    avgFps,
    minFps: minFps === 999 ? 0 : minFps,
    maxFps,
    p1LowFps,
    avgFrameIntervalMs,
    avgRenderDurationMs,
    maxRenderDurationMs: Math.round(maxRender * 100) / 100,
    avgPhysicsDurationMs,
    maxPhysicsDurationMs: Math.round(maxPhysicsDurationMs * 100) / 100,
    totalPhysicsTicks: physicsTickCount,
    totalReactRenders: totalReactRendersCount,
    avgReactRenderMs,
    maxReactRenderMs: Math.round(maxReactDurationMs * 100) / 100,
    avgBrowserWaitMs,
    browserWaitPercent,
    cpuGpuBreakdown,
    fpsDistribution,
    environment,
    diagnosticVerdict,
    reactComponents,
    renderPasses,
    topBottleneckPass,
    jankFrameCount: jankCount,
    criticalJankCount,
    jankPercent: totalFrames > 0 ? Math.round((jankCount / totalFrames) * 1000) / 10 : 0,
    memoryStartMB,
    memoryEndMB,
    memoryDeltaMB,
    frames,
    topWorstFrames,
  };
}
